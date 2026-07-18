'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../src/pricing');

test('base configuration: 12 levels, 24 pieces, 2490 lei', () => {
    const totals = pricing.computeTotals({ extraLevels: 0, sisalCount: 0, ropeCount: 0 });
    assert.equal(totals.levels.total, 12);
    assert.equal(totals.pieces.total, 24);
    assert.equal(totals.pieces.foundation, 4);
    assert.equal(totals.pieces.standard, 20);
    assert.equal(totals.priceBani.total, 249000);
    assert.equal(totals.heightM, 1.2);
});

test('minimum levels cannot go below 12 (extraLevels cannot be negative)', () => {
    assert.throws(() => pricing.computeTotals({ extraLevels: -1, sisalCount: 0, ropeCount: 0 }), /Configurație invalidă/);
});

test('maximum total levels is 20 (max 8 extra levels)', () => {
    const totals = pricing.computeTotals({ extraLevels: 8, sisalCount: 0, ropeCount: 0 });
    assert.equal(totals.levels.total, 20);
    assert.equal(totals.priceBani.extraLevels, 8 * 20000);
});

test('rejects more than 8 extra levels', () => {
    assert.throws(() => pricing.computeTotals({ extraLevels: 9, sisalCount: 0, ropeCount: 0 }), /Configurație invalidă/);
});

test('rejects fractional level counts', () => {
    assert.throws(() => pricing.computeTotals({ extraLevels: 1.5, sisalCount: 0, ropeCount: 0 }), /Configurație invalidă/);
});

test('rejects negative special piece counts', () => {
    assert.throws(() => pricing.computeTotals({ extraLevels: 0, sisalCount: -1, ropeCount: 0 }), /Configurație invalidă/);
});

test('200 lei per extra level', () => {
    const totals = pricing.computeTotals({ extraLevels: 3, sisalCount: 0, ropeCount: 0 });
    assert.equal(totals.priceBani.extraLevels, 3 * 20000);
    assert.equal(totals.priceBani.total, 249000 + 3 * 20000);
});

test('300 lei per special piece, sisal and rope tracked and priced separately', () => {
    const totals = pricing.computeTotals({ extraLevels: 0, sisalCount: 2, ropeCount: 3 });
    assert.equal(totals.pieces.sisal, 2);
    assert.equal(totals.pieces.rope, 3);
    assert.equal(totals.priceBani.sisal, 2 * 30000);
    assert.equal(totals.priceBani.rope, 3 * 30000);
    assert.equal(totals.priceBani.total, 249000 + 5 * 30000);
});

test('special pieces have no artificial maximum tied to piece slots', () => {
    // Far more specials than there are standard piece "slots" in the base config — must still be accepted.
    const totals = pricing.computeTotals({ extraLevels: 0, sisalCount: 50, ropeCount: 50 });
    assert.equal(totals.pieces.sisal, 50);
    assert.equal(totals.pieces.rope, 50);
    assert.equal(totals.priceBani.total, 249000 + 100 * 30000);
});

test('full formula: base + extraLevels*200 + sisal*300 + rope*300', () => {
    const totals = pricing.computeTotals({ extraLevels: 4, sisalCount: 1, ropeCount: 2 });
    const expected = 249000 + 4 * 20000 + 1 * 30000 + 2 * 30000;
    assert.equal(totals.priceBani.total, expected);
});

test('all monetary amounts are integers (bani), never floating point', () => {
    const totals = pricing.computeTotals({ extraLevels: 5, sisalCount: 3, ropeCount: 7 });
    for (const value of Object.values(totals.priceBani)) {
        assert.equal(Number.isInteger(value), true);
    }
});

test('formatRON renders Romanian grouping with "lei" suffix', () => {
    assert.equal(pricing.formatRON(249000), '2.490 lei');
    assert.equal(pricing.formatRON(20000), '200 lei');
    assert.equal(pricing.formatRON(30000), '300 lei');
});

test('rejects non-numeric / malformed payloads (manipulated payload)', () => {
    assert.throws(() => pricing.computeTotals({ extraLevels: '5', sisalCount: 0, ropeCount: 0 }));
    assert.throws(() => pricing.computeTotals({ extraLevels: null, sisalCount: 0, ropeCount: 0 }));
    assert.throws(() => pricing.computeTotals({}));
});
