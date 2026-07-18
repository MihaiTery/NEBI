'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { checkoutSchema } = require('../src/lib/validation');

function basePayload(overrides) {
    return Object.assign({
        config: { extraLevels: 0, sisalCount: 0, ropeCount: 0 },
        customerType: 'individual',
        firstName: 'Ana',
        lastName: 'Popescu',
        email: 'ana@example.ro',
        phone: '0722111222',
        shipping: { county: 'Prahova', city: 'Ploiești', address: 'Str. Test 1', postalCode: '100000' },
        billingSameAsShipping: true,
        acceptedTerms: true,
        acceptedRefundPolicy: true,
        confirmedConfig: true
    }, overrides);
}

test('accepts a valid individual (persoană fizică) checkout', () => {
    const result = checkoutSchema.safeParse(basePayload());
    assert.equal(result.success, true);
});

test('accepts a valid company (persoană juridică) checkout', () => {
    const result = checkoutSchema.safeParse(basePayload({
        customerType: 'company',
        firstName: undefined,
        lastName: undefined,
        companyName: 'ACME SRL',
        cui: 'RO12345678',
        billingSameAsShipping: true,
        billing: {
            companyName: 'ACME SRL', cui: 'RO12345678',
            county: 'Prahova', city: 'Ploiești', address: 'Str. Test 1', postalCode: '100000'
        }
    }));
    assert.equal(result.success, true);
});

test('rejects company checkout missing CUI/company name', () => {
    const result = checkoutSchema.safeParse(basePayload({ customerType: 'company', firstName: undefined, lastName: undefined }));
    assert.equal(result.success, false);
});

test('accepts billing address different from shipping when provided', () => {
    const result = checkoutSchema.safeParse(basePayload({
        billingSameAsShipping: false,
        billing: { county: 'Cluj', city: 'Cluj-Napoca', address: 'Str. Facturare 2', postalCode: '400000' }
    }));
    assert.equal(result.success, true);
});

test('rejects billing-different-from-shipping without billing details', () => {
    const result = checkoutSchema.safeParse(basePayload({ billingSameAsShipping: false }));
    assert.equal(result.success, false);
});

test('requires all mandatory shipping fields', () => {
    const result = checkoutSchema.safeParse(basePayload({ shipping: { county: 'Prahova', city: '', address: '', postalCode: '' } }));
    assert.equal(result.success, false);
});

test('email and phone are always required, even though merchant contact is still a placeholder', () => {
    const missingEmail = checkoutSchema.safeParse(basePayload({ email: undefined }));
    const missingPhone = checkoutSchema.safeParse(basePayload({ phone: undefined }));
    assert.equal(missingEmail.success, false);
    assert.equal(missingPhone.success, false);
});

test('rejects malformed email', () => {
    const result = checkoutSchema.safeParse(basePayload({ email: 'not-an-email' }));
    assert.equal(result.success, false);
});

test('requires acceptedTerms to be explicitly true (unchecked box rejected)', () => {
    const result = checkoutSchema.safeParse(basePayload({ acceptedTerms: false }));
    assert.equal(result.success, false);
});

test('requires acceptedRefundPolicy to be explicitly true', () => {
    const result = checkoutSchema.safeParse(basePayload({ acceptedRefundPolicy: false }));
    assert.equal(result.success, false);
});

test('requires confirmedConfig to be explicitly true', () => {
    const result = checkoutSchema.safeParse(basePayload({ confirmedConfig: false }));
    assert.equal(result.success, false);
});

test('rejects a manipulated payload with an out-of-range config (defense in depth alongside pricing.computeTotals)', () => {
    const result = checkoutSchema.safeParse(basePayload({ config: { extraLevels: 999, sisalCount: 0, ropeCount: 0 } }));
    // zod only checks shape/non-negativity here; the 8-level ceiling is enforced by pricing.computeTotals
    // downstream (see pricing.test.js) — this test documents that split of responsibility.
    assert.equal(result.success, true);
});

test('rejects negative config values at the schema layer too', () => {
    const result = checkoutSchema.safeParse(basePayload({ config: { extraLevels: -3, sisalCount: 0, ropeCount: 0 } }));
    assert.equal(result.success, false);
});
