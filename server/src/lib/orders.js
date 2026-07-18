'use strict';

const db = require('../db');
const pricing = require('../pricing');
const { generatePublicOrderNumber } = require('./publicId');
const { TERMS_VERSION, REFUND_POLICY_VERSION } = require('./legalVersions');

function buildOrderItems(totals) {
    const items = [
        {
            item_type: 'base_package',
            name_snapshot: 'Configurație de bază — 12 nivele, 24 de piese (4 piese 60cm + 20 piese 40cm)',
            quantity: 1,
            unit_price_bani: pricing.PRICE_BASE_BANI,
            line_total_bani: pricing.PRICE_BASE_BANI,
            config_snapshot_json: JSON.stringify({
                levels: pricing.BASE_LEVELS,
                foundationPieces: pricing.FOUNDATION_PIECES,
                standardPieces: pricing.BASE_STANDARD_PIECES
            })
        }
    ];

    if (totals.levels.extra > 0) {
        items.push({
            item_type: 'extra_level',
            name_snapshot: 'Nivel suplimentar (2 piese de 40x10x10cm)',
            quantity: totals.levels.extra,
            unit_price_bani: pricing.PRICE_PER_EXTRA_LEVEL_BANI,
            line_total_bani: totals.priceBani.extraLevels,
            config_snapshot_json: JSON.stringify({ piecesPerLevel: 2 })
        });
    }

    if (totals.pieces.sisal > 0) {
        items.push({
            item_type: 'special_sisal',
            name_snapshot: 'Piesă specială cu sisal',
            quantity: totals.pieces.sisal,
            unit_price_bani: pricing.PRICE_PER_SPECIAL_BANI,
            line_total_bani: totals.priceBani.sisal,
            config_snapshot_json: JSON.stringify({})
        });
    }

    if (totals.pieces.rope > 0) {
        items.push({
            item_type: 'special_rope',
            name_snapshot: 'Piesă specială cu sfoară',
            quantity: totals.pieces.rope,
            unit_price_bani: pricing.PRICE_PER_SPECIAL_BANI,
            line_total_bani: totals.priceBani.rope,
            config_snapshot_json: JSON.stringify({})
        });
    }

    return items;
}

/**
 * Creates an order + its line items in a single transaction. The price is always
 * recomputed here from `payload.config` via pricing-config.js — client-submitted
 * totals, if any, are ignored entirely.
 */
function createOrder(payload, meta) {
    const totals = pricing.computeTotals(payload.config); // throws INVALID_CONFIG on bad input
    const items = buildOrderItems(totals);
    const now = new Date().toISOString();
    const publicNumber = generatePublicOrderNumber();

    const billing = payload.billingSameAsShipping ? null : payload.billing;
    const billingForCompanyDefaults = payload.customerType === 'company' ? (payload.billing || {}) : {};

    const insertOrder = db.prepare(`
        INSERT INTO orders (
            public_number, customer_type,
            customer_first_name, customer_last_name, customer_company_name, customer_cui, customer_reg_com,
            customer_email, customer_phone,
            shipping_county, shipping_city, shipping_address, shipping_postal_code,
            billing_same_as_shipping,
            billing_company_name, billing_cui, billing_reg_com, billing_county, billing_city, billing_address, billing_postal_code,
            billing_contact_name, billing_contact_email, billing_contact_phone,
            notes,
            currency, subtotal_bani, vat_included, shipping_included, total_bani, config_json,
            payment_status, order_status, shipping_status, carrier,
            terms_version, refund_policy_version, consent_accepted_at, consent_ip, consent_user_agent,
            created_at, updated_at
        ) VALUES (
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?, ?,
            ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?,
            ?, ?, ?, ?, ?, ?,
            'pending', 'new', 'not_prepared', 'GLS',
            ?, ?, ?, ?, ?,
            ?, ?
        )
    `);

    const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, item_type, name_snapshot, quantity, unit_price_bani, line_total_bani, config_snapshot_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let orderId;
    db.exec('BEGIN');
    try {
        const result = insertOrder.run(
            publicNumber, payload.customerType,
            payload.firstName || null, payload.lastName || null, payload.companyName || null, payload.cui || null, payload.regCom || null,
            payload.email, payload.phone,
            payload.shipping.county, payload.shipping.city, payload.shipping.address, payload.shipping.postalCode,
            payload.billingSameAsShipping ? 1 : 0,
            (billing && billing.companyName) || billingForCompanyDefaults.companyName || null,
            (billing && billing.cui) || billingForCompanyDefaults.cui || null,
            (billing && billing.regCom) || billingForCompanyDefaults.regCom || null,
            (billing && billing.county) || null,
            (billing && billing.city) || null,
            (billing && billing.address) || null,
            (billing && billing.postalCode) || null,
            (billing && billing.contactName) || null,
            (billing && billing.contactEmail) || null,
            (billing && billing.contactPhone) || null,
            payload.notes || null,
            totals.currency, totals.priceBani.total, 1, 1, totals.priceBani.total, JSON.stringify(payload.config),
            TERMS_VERSION, REFUND_POLICY_VERSION, now, meta.ip || null, meta.userAgent || null,
            now, now
        );
        orderId = result.lastInsertRowid;

        for (const item of items) {
            insertItem.run(orderId, item.item_type, item.name_snapshot, item.quantity, item.unit_price_bani, item.line_total_bani, item.config_snapshot_json);
        }

        db.exec('COMMIT');
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }

    return getOrderById(orderId);
}

function getOrderById(id) {
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function getOrderByPublicNumber(publicNumber) {
    return db.prepare('SELECT * FROM orders WHERE public_number = ?').get(publicNumber);
}

function getOrderItems(orderId) {
    return db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
}

function listOrders(filters) {
    const clauses = [];
    const params = [];

    if (filters.paymentStatus) { clauses.push('payment_status = ?'); params.push(filters.paymentStatus); }
    if (filters.orderStatus) { clauses.push('order_status = ?'); params.push(filters.orderStatus); }
    if (filters.shippingStatus) { clauses.push('shipping_status = ?'); params.push(filters.shippingStatus); }
    if (filters.search) {
        clauses.push('(public_number LIKE ? OR customer_email LIKE ? OR customer_last_name LIKE ? OR customer_company_name LIKE ?)');
        const like = `%${filters.search}%`;
        params.push(like, like, like, like);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

    const rows = db.prepare(`SELECT * FROM orders ${where} ORDER BY created_at ${sortDir} LIMIT ? OFFSET ?`)
        .all(...params, limit, offset);
    const totalRow = db.prepare(`SELECT COUNT(*) AS count FROM orders ${where}`).get(...params);

    return { rows, total: totalRow.count };
}

module.exports = {
    createOrder,
    getOrderById,
    getOrderByPublicNumber,
    getOrderItems,
    listOrders
};
