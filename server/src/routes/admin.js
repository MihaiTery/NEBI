'use strict';

const express = require('express');
const config = require('../config');
const db = require('../db');
const auth = require('../lib/adminAuth');
const { verifyPassword } = require('../lib/passwordHash');
const { rateLimit } = require('../lib/rateLimit');
const { recordAudit } = require('../lib/auditLog');
const { listOrders, getOrderByPublicNumber, getOrderItems } = require('../lib/orders');
const { updateOrderSchema, markPaidManuallySchema, loginSchema } = require('../lib/adminValidation');

const router = express.Router();

const loginRateLimit = rateLimit({ windowMs: 5 * 60_000, max: 10, keyFn: (req) => req.ip });

router.post('/admin/login', loginRateLimit, (req, res) => {
    if (!config.admin.username || !config.admin.passwordHash) {
        res.status(503).json({ error: 'Contul de administrator nu este configurat pe acest mediu.' });
        return;
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Date de autentificare invalide.' });
        return;
    }

    const { username, password } = parsed.data;

    // Constant-shape response whether the username or the password was wrong, to avoid user enumeration.
    if (username !== config.admin.username || !verifyPassword(password, config.admin.passwordHash)) {
        res.status(401).json({ error: 'Utilizator sau parolă incorectă.' });
        return;
    }

    const session = auth.createSession(username);
    auth.setSessionCookie(res, session.id, session.expiresAt);
    res.json({ username });
});

router.post('/admin/logout', auth.requireAdmin, (req, res) => {
    auth.destroySession(req.admin.sessionId);
    auth.clearSessionCookie(res);
    res.json({ ok: true });
});

router.get('/admin/me', auth.requireAdmin, (req, res) => {
    res.json({ username: req.admin.username });
});

router.get('/admin/orders', auth.requireAdmin, (req, res) => {
    const { rows, total } = listOrders({
        paymentStatus: req.query.paymentStatus || null,
        orderStatus: req.query.orderStatus || null,
        shippingStatus: req.query.shippingStatus || null,
        search: req.query.search || null,
        sortDir: req.query.sortDir || 'desc',
        limit: req.query.limit,
        offset: req.query.offset
    });

    res.json({
        total,
        orders: rows.map(toOrderSummary)
    });
});

router.get('/admin/orders/export.csv', auth.requireAdmin, (req, res) => {
    const { rows } = listOrders({
        paymentStatus: req.query.paymentStatus || null,
        orderStatus: req.query.orderStatus || null,
        shippingStatus: req.query.shippingStatus || null,
        search: req.query.search || null,
        sortDir: 'desc',
        limit: 10000,
        offset: 0
    });

    const header = ['public_number', 'created_at', 'customer_type', 'customer_email', 'customer_phone', 'total_bani', 'payment_status', 'order_status', 'shipping_status', 'awb', 'tracking_url'];
    const lines = [header.join(',')];
    for (const o of rows) {
        lines.push(header.map((key) => csvEscape(o[key])).join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="comenzi-nebi-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(lines.join('\n'));
});

router.get('/admin/orders/:publicNumber', auth.requireAdmin, (req, res) => {
    const order = getOrderByPublicNumber(req.params.publicNumber);
    if (!order) {
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    const items = getOrderItems(order.id);
    const payments = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY id DESC').all(order.id);
    const events = db.prepare('SELECT * FROM payment_events WHERE order_id = ? ORDER BY id DESC').all(order.id);
    const auditEntries = db.prepare("SELECT * FROM audit_log WHERE entity = 'order' AND entity_id = ? ORDER BY id DESC")
        .all(String(order.id));

    res.json({ order, items, payments, events, auditEntries });
});

router.patch('/admin/orders/:publicNumber', auth.requireAdmin, (req, res) => {
    const order = getOrderByPublicNumber(req.params.publicNumber);
    if (!order) {
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    const parsed = updateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Date invalide.', details: parsed.error.issues });
        return;
    }

    const fields = parsed.data;
    const updates = [];
    const params = [];
    const oldValue = {};
    const newValue = {};

    if (fields.orderStatus !== undefined) {
        updates.push('order_status = ?'); params.push(fields.orderStatus);
        oldValue.orderStatus = order.order_status; newValue.orderStatus = fields.orderStatus;
    }
    if (fields.shippingStatus !== undefined) {
        updates.push('shipping_status = ?'); params.push(fields.shippingStatus);
        oldValue.shippingStatus = order.shipping_status; newValue.shippingStatus = fields.shippingStatus;
        if (fields.shippingStatus === 'handed_to_gls' && !order.shipped_at) {
            updates.push('shipped_at = ?'); params.push(new Date().toISOString());
        }
    }
    if (fields.awb !== undefined) {
        updates.push('awb = ?'); params.push(fields.awb || null);
        oldValue.awb = order.awb; newValue.awb = fields.awb;
    }
    if (fields.trackingUrl !== undefined) {
        updates.push('tracking_url = ?'); params.push(fields.trackingUrl || null);
        oldValue.trackingUrl = order.tracking_url; newValue.trackingUrl = fields.trackingUrl;
    }
    if (fields.notes !== undefined) {
        updates.push('notes = ?'); params.push(sanitizeNotes(fields.notes));
        oldValue.notes = order.notes; newValue.notes = fields.notes;
    }

    if (updates.length === 0) {
        res.status(400).json({ error: 'Nicio modificare trimisă.' });
        return;
    }

    updates.push('updated_at = ?'); params.push(new Date().toISOString());
    params.push(order.id);

    db.prepare(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    recordAudit({ adminUsername: req.admin.username, action: 'update_order', entity: 'order', entityId: order.id, oldValue, newValue });

    res.json({ ok: true });
});

// Deliberately separate, narrow endpoint: marking an order 'paid' outside of a verified NETOPIA
// notification is an exceptional, audited administrative override — never a normal status edit.
router.post('/admin/orders/:publicNumber/mark-paid-manually', auth.requireAdmin, (req, res) => {
    const order = getOrderByPublicNumber(req.params.publicNumber);
    if (!order) {
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    const parsed = markPaidManuallySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Este necesar un motiv detaliat (minimum 10 caractere) pentru marcarea manuală ca plătită.' });
        return;
    }

    if (order.payment_status === 'paid') {
        res.status(409).json({ error: 'Comanda este deja marcată ca plătită.' });
        return;
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE orders SET payment_status = 'paid', paid_at = ?, updated_at = ? WHERE id = ?")
        .run(now, now, order.id);

    recordAudit({
        adminUsername: req.admin.username,
        action: 'mark_paid_manually',
        entity: 'order',
        entityId: order.id,
        oldValue: { paymentStatus: order.payment_status },
        newValue: { paymentStatus: 'paid', reason: parsed.data.reason }
    });

    res.json({ ok: true });
});

router.get('/admin/audit-log', auth.requireAdmin, (req, res) => {
    const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 200').all();
    res.json({ entries: rows });
});

function toOrderSummary(o) {
    return {
        publicNumber: o.public_number,
        createdAt: o.created_at,
        customerType: o.customer_type,
        customerName: o.customer_type === 'company' ? o.customer_company_name : `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim(),
        customerEmail: o.customer_email,
        totalBani: o.total_bani,
        currency: o.currency,
        paymentStatus: o.payment_status,
        orderStatus: o.order_status,
        shippingStatus: o.shipping_status,
        awb: o.awb
    };
}

function sanitizeNotes(notes) {
    // Admin notes are rendered as text (never innerHTML) in the panel, but strip tags defensively anyway.
    return String(notes).replace(/<[^>]*>/g, '').slice(0, 2000);
}

function csvEscape(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

module.exports = router;
