'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const dbFile = path.join(__dirname, `tmp-test-${process.pid}.sqlite`);
process.env.DB_FILE = dbFile;
process.env.ADMIN_USERNAME = 'testadmin';
// Precomputed scrypt hash for the password 'TestPassword12345!' (see passwordHash.test.js for the mechanism).
const { hashPassword } = require('../src/lib/passwordHash');
process.env.ADMIN_PASSWORD_HASH = hashPassword('TestPassword12345!');
process.env.NETOPIA_ENV = 'disabled';
process.env.NODE_ENV = 'test';

require('../src/db/migrate').run();
const app = require('../src/app');

let server;
let baseUrl;

test.before(async () => {
    server = app.listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    for (const suffix of ['', '-journal', '-wal', '-shm']) {
        try { fs.unlinkSync(dbFile + suffix); } catch (e) { /* ignore */ }
    }
});

function validOrderPayload(overrides) {
    return Object.assign({
        config: { extraLevels: 2, sisalCount: 1, ropeCount: 0 },
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

test('POST /api/orders creates an order with server-computed total (client cannot inject a price)', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderPayload())
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.match(body.publicNumber, /^NEBI-/);
    assert.equal(body.totalBani, 249000 + 2 * 20000 + 1 * 30000);
    assert.equal(body.paymentStatus, 'pending');
});

test('POST /api/orders ignores a client-submitted total/price and recomputes it server-side', async () => {
    const payload = validOrderPayload();
    payload.totalBani = 1; // attempted manipulation — must be ignored entirely
    payload.priceBani = { total: 1 };
    const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const body = await res.json();
    assert.equal(res.status, 201);
    assert.equal(body.totalBani, 249000 + 2 * 20000 + 1 * 30000);
});

test('POST /api/orders rejects an out-of-range configuration (server re-validates, never trusts the client)', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderPayload({ config: { extraLevels: 999, sisalCount: 0, ropeCount: 0 } }))
    });
    assert.equal(res.status, 400);
});

test('POST /api/orders rejects an order missing required acceptances', async () => {
    const res = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validOrderPayload({ acceptedTerms: false }))
    });
    assert.equal(res.status, 400);
});

test('two separate submissions create two distinct orders (double-click protection is a frontend concern — see checkout.js)', async () => {
    const first = await (await fetch(`${baseUrl}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validOrderPayload())
    })).json();
    const second = await (await fetch(`${baseUrl}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validOrderPayload())
    })).json();
    assert.notEqual(first.publicNumber, second.publicNumber);
});

test('GET /api/orders/:publicNumber/payment-status returns 404 for an unknown order', async () => {
    const res = await fetch(`${baseUrl}/api/orders/NEBI-DOESNOTEXIST/payment-status`);
    assert.equal(res.status, 404);
});

test('POST /api/payments/netopia/create returns disabled:true when NETOPIA_ENV=disabled (never pretends to charge)', async () => {
    const created = await (await fetch(`${baseUrl}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validOrderPayload())
    })).json();

    const res = await fetch(`${baseUrl}/api/payments/netopia/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicNumber: created.publicNumber })
    });
    const body = await res.json();
    assert.equal(body.disabled, true);
    assert.equal(typeof body.message, 'string');
});

test('admin API is blocked without authentication', async () => {
    const res = await fetch(`${baseUrl}/api/admin/orders`);
    assert.equal(res.status, 401);
});

test('admin login rejects wrong credentials', async () => {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testadmin', password: 'wrong' })
    });
    assert.equal(res.status, 401);
});

test('admin login succeeds and grants access to protected routes via session cookie', async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testadmin', password: 'TestPassword12345!' })
    });
    assert.equal(loginRes.status, 200);
    const cookie = loginRes.headers.get('set-cookie');
    assert.match(cookie, /nebi_admin_session=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);

    const ordersRes = await fetch(`${baseUrl}/api/admin/orders`, { headers: { Cookie: cookie } });
    assert.equal(ordersRes.status, 200);
    const ordersBody = await ordersRes.json();
    assert.equal(Array.isArray(ordersBody.orders), true);
});

test('admin cannot set payment_status to "paid" through the normal order-update endpoint', async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testadmin', password: 'TestPassword12345!' })
    });
    const cookie = loginRes.headers.get('set-cookie');

    const created = await (await fetch(`${baseUrl}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validOrderPayload())
    })).json();

    const patchRes = await fetch(`${baseUrl}/api/admin/orders/${created.publicNumber}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ paymentStatus: 'paid' })
    });
    // 'paymentStatus' is not a recognized field on this endpoint — nothing to update.
    assert.equal(patchRes.status, 400);

    const detailRes = await fetch(`${baseUrl}/api/admin/orders/${created.publicNumber}`, { headers: { Cookie: cookie } });
    const detail = await detailRes.json();
    assert.equal(detail.order.payment_status, 'pending');
});

test('marking an order paid manually requires a reason and is audit-logged', async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testadmin', password: 'TestPassword12345!' })
    });
    const cookie = loginRes.headers.get('set-cookie');

    const created = await (await fetch(`${baseUrl}/api/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validOrderPayload())
    })).json();

    const withoutReason = await fetch(`${baseUrl}/api/admin/orders/${created.publicNumber}/mark-paid-manually`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify({})
    });
    assert.equal(withoutReason.status, 400);

    const withReason = await fetch(`${baseUrl}/api/admin/orders/${created.publicNumber}/mark-paid-manually`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
        body: JSON.stringify({ reason: 'Plată confirmată telefonic, verificată manual cu banca.' })
    });
    assert.equal(withReason.status, 200);

    const auditRes = await fetch(`${baseUrl}/api/admin/audit-log`, { headers: { Cookie: cookie } });
    const audit = await auditRes.json();
    assert.equal(audit.entries.some((e) => e.action === 'mark_paid_manually'), true);
});

test('admin session is revoked on logout', async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testadmin', password: 'TestPassword12345!' })
    });
    const cookie = loginRes.headers.get('set-cookie');

    await fetch(`${baseUrl}/api/admin/logout`, { method: 'POST', headers: { Cookie: cookie } });

    const res = await fetch(`${baseUrl}/api/admin/orders`, { headers: { Cookie: cookie } });
    assert.equal(res.status, 401);
});

test('the SQLite database file is never reachable through the static file server', async () => {
    const res = await fetch(`${baseUrl}/server/data/nebi.sqlite`);
    assert.equal(res.status, 404);
});
