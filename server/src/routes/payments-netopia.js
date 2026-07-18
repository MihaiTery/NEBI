'use strict';

const express = require('express');
const crypto = require('node:crypto');
const config = require('../config');
const db = require('../db');
const netopia = require('../lib/netopiaClient');
const { getOrderByPublicNumber, getOrderById } = require('../lib/orders');
const { rateLimit } = require('../lib/rateLimit');

const router = express.Router();

const createRateLimit = rateLimit({ windowMs: 60_000, max: 20, keyFn: (req) => req.ip });

function orderDescription(order) {
    return `Comandă NEBI ${order.public_number}`;
}

function billingFromOrder(order) {
    return {
        first_name: order.customer_first_name || order.billing_contact_name || order.customer_company_name || 'Client',
        last_name: order.customer_last_name || '',
        email: order.customer_email,
        mobile_phone: order.customer_phone,
        address: order.shipping_address,
        city: order.shipping_city,
        country: 'România'
    };
}

router.post('/payments/netopia/create', createRateLimit, async (req, res) => {
    const publicNumber = req.body && req.body.publicNumber;
    if (!publicNumber || typeof publicNumber !== 'string') {
        res.status(400).json({ error: 'publicNumber este obligatoriu.' });
        return;
    }

    const order = getOrderByPublicNumber(publicNumber);
    if (!order) {
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    if (order.payment_status === 'paid') {
        res.status(409).json({ error: 'Comanda a fost deja plătită.', paymentStatus: order.payment_status });
        return;
    }

    if (!netopia.isConfigured()) {
        res.status(200).json({
            disabled: true,
            message: config.netopia.env === 'sandbox'
                ? 'Mediul Sandbox NETOPIA nu are încă cheile configurate — plata nu poate fi inițiată.'
                : 'Plata online nu este încă activă pe acest mediu (NETOPIA_ENV=disabled). Comanda a fost înregistrată cu statusul „în așteptare".'
        });
        return;
    }

    try {
        const amountRon = order.total_bani / 100;
        const result = await netopia.startPayment({
            order: {
                orderId: order.public_number,
                description: orderDescription(order),
                amountRon,
                currency: order.currency
            },
            billing: billingFromOrder(order)
        });

        db.prepare(`
            INSERT INTO payments (order_id, provider, external_transaction_id, status, amount_bani, currency, initiated_at, attempt_count)
            VALUES (?, 'netopia', ?, 'processing', ?, ?, ?, 1)
        `).run(order.id, result.ntpId, order.total_bani, order.currency, new Date().toISOString());

        db.prepare("UPDATE orders SET payment_status = 'processing', updated_at = ? WHERE id = ?")
            .run(new Date().toISOString(), order.id);

        res.json({ disabled: false, paymentUrl: result.paymentUrl });
    } catch (err) {
        console.error('NETOPIA create payment failed:', err.code || err.message);
        db.prepare(`
            INSERT INTO payments (order_id, provider, status, amount_bani, currency, initiated_at, failed_at, technical_reason, attempt_count)
            VALUES (?, 'netopia', 'failed', ?, ?, ?, ?, ?, 1)
        `).run(order.id, order.total_bani, order.currency, new Date().toISOString(), new Date().toISOString(), String(err.code || 'UNKNOWN_ERROR'));

        res.status(502).json({ error: 'Inițierea plății a eșuat. Poți relua plata pentru aceeași comandă.' });
    }
});

// Raw body is required to compute a stable payload hash for idempotency BEFORE JSON parsing.
router.post('/payments/netopia/ipn', express.raw({ type: '*/*', limit: '256kb' }), async (req, res) => {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : '';
    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
    const receivedAt = new Date().toISOString();

    let payload;
    try {
        payload = JSON.parse(rawBody);
    } catch (e) {
        payload = {};
    }

    const ntpId = payload.ntpID || payload?.order?.ntpID || null;
    const orderId = payload.orderID || payload?.order?.orderID || null;
    // Fallback idempotency key: identical raw payloads dedupe on payload hash even without a vendor event id.
    const eventUid = ntpId ? `netopia:${ntpId}:${payloadHash.slice(0, 16)}` : `netopia:hash:${payloadHash}`;

    const existing = db.prepare('SELECT id FROM payment_events WHERE event_uid = ?').get(eventUid);
    if (existing) {
        // Duplicate notification — acknowledge without reprocessing (idempotent by design).
        res.status(200).json({ status: 'duplicate-ignored' });
        return;
    }

    db.prepare(`
        INSERT INTO payment_events (event_uid, provider, external_transaction_id, order_id, event_type, payload_hash, received_at)
        VALUES (?, 'netopia', ?, NULL, ?, ?, ?)
    `).run(eventUid, ntpId, payload.status || 'unknown', payloadHash, receivedAt);

    if (!orderId) {
        markEventProcessed(eventUid, 'rejected: missing orderID');
        res.status(400).json({ error: 'orderID lipsă în notificare.' });
        return;
    }

    const order = getOrderByPublicNumber(orderId);
    if (!order) {
        markEventProcessed(eventUid, 'rejected: order not found');
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    db.prepare('UPDATE payment_events SET order_id = ? WHERE event_uid = ?').run(order.id, eventUid);

    if (order.payment_status === 'paid') {
        markEventProcessed(eventUid, 'ignored: order already paid');
        res.status(200).json({ status: 'already-paid' });
        return;
    }

    // Never trust the webhook payload directly — verify server-to-server with NETOPIA before
    // changing anything, and cross-check amount/currency against what we actually charged for.
    try {
        const statusResult = await netopia.getPaymentStatus({ orderId: order.public_number, ntpId });
        const verifiedStatus = normalizeNetopiaStatus(statusResult);
        const verifiedAmountBani = Math.round((statusResult?.order?.amount ?? statusResult?.amount ?? 0) * 100);
        const verifiedCurrency = statusResult?.order?.currency || statusResult?.currency || order.currency;

        if (verifiedAmountBani !== order.total_bani || verifiedCurrency !== order.currency) {
            markEventProcessed(eventUid, `rejected: amount/currency mismatch (got ${verifiedAmountBani} ${verifiedCurrency})`);
            res.status(200).json({ status: 'amount-mismatch-ignored' });
            return;
        }

        applyPaymentStatus(order, verifiedStatus, ntpId);
        markEventProcessed(eventUid, `applied: ${verifiedStatus}`);
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('IPN verification failed:', err.code || err.message);
        markEventProcessed(eventUid, `error: ${err.code || 'verification-failed'}`);
        // 200 so NETOPIA doesn't hammer retries for an error on our side that a human needs to look at;
        // the event is recorded either way for manual follow-up from the admin panel.
        res.status(200).json({ status: 'error-logged' });
    }
});

function normalizeNetopiaStatus(statusResult) {
    const raw = String(statusResult?.payment?.status ?? statusResult?.status ?? '').toLowerCase();
    if (['paid', 'confirmed', 'success', '3'].includes(raw)) return 'paid';
    if (['cancelled', 'canceled'].includes(raw)) return 'cancelled';
    if (['failed', 'declined', 'error'].includes(raw)) return 'failed';
    if (['expired'].includes(raw)) return 'expired';
    return 'processing';
}

function applyPaymentStatus(order, status, ntpId) {
    const now = new Date().toISOString();
    db.exec('BEGIN');
    try {
        db.prepare(`
            UPDATE payments SET status = ?, external_transaction_id = COALESCE(?, external_transaction_id),
                confirmed_at = CASE WHEN ? = 'paid' THEN ? ELSE confirmed_at END,
                failed_at = CASE WHEN ? IN ('failed','expired','cancelled') THEN ? ELSE failed_at END
            WHERE order_id = ? AND provider = 'netopia'
            ORDER BY id DESC LIMIT 1
        `).run(status, ntpId, status, now, status, now, order.id);

        db.prepare(`
            UPDATE orders SET payment_status = ?, paid_at = CASE WHEN ? = 'paid' THEN ? ELSE paid_at END,
                order_status = CASE WHEN ? = 'paid' AND order_status = 'new' THEN 'confirmed' ELSE order_status END,
                updated_at = ?
            WHERE id = ?
        `).run(status, status, now, status, now, order.id);

        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

function markEventProcessed(eventUid, result) {
    db.prepare('UPDATE payment_events SET processed_at = ?, processing_result = ? WHERE event_uid = ?')
        .run(new Date().toISOString(), result, eventUid);
}

module.exports = router;
