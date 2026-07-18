'use strict';

const express = require('express');
const { checkoutSchema } = require('../lib/validation');
const { createOrder, getOrderByPublicNumber, getOrderItems } = require('../lib/orders');
const { rateLimit } = require('../lib/rateLimit');

const router = express.Router();

const checkoutRateLimit = rateLimit({ windowMs: 60_000, max: 20, keyFn: (req) => req.ip });

router.post('/orders', checkoutRateLimit, (req, res) => {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Date de comandă invalide.', details: parsed.error.issues });
        return;
    }

    try {
        const order = createOrder(parsed.data, {
            ip: req.ip,
            userAgent: req.get('user-agent') || null
        });

        const items = getOrderItems(order.id);

        res.status(201).json({
            publicNumber: order.public_number,
            totalBani: order.total_bani,
            currency: order.currency,
            paymentStatus: order.payment_status,
            items: items.map((i) => ({
                type: i.item_type,
                name: i.name_snapshot,
                quantity: i.quantity,
                unitPriceBani: i.unit_price_bani,
                lineTotalBani: i.line_total_bani
            }))
        });
    } catch (err) {
        if (err.code === 'INVALID_CONFIG') {
            res.status(400).json({ error: 'Configurație invalidă.', details: err.details });
            return;
        }
        console.error('Order creation failed:', err.message);
        res.status(500).json({ error: 'Comanda nu a putut fi creată. Încearcă din nou.' });
    }
});

router.get('/orders/:publicNumber/payment-status', (req, res) => {
    const order = getOrderByPublicNumber(req.params.publicNumber);
    if (!order) {
        res.status(404).json({ error: 'Comanda nu a fost găsită.' });
        return;
    }

    res.json({
        publicNumber: order.public_number,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        totalBani: order.total_bani,
        currency: order.currency
    });
});

module.exports = router;
