'use strict';

const { z } = require('zod');

const ORDER_STATUSES = ['new', 'confirmed', 'in_production', 'ready_for_shipping', 'shipped', 'completed', 'cancelled', 'returned'];
const SHIPPING_STATUSES = ['not_prepared', 'ready', 'handed_to_gls', 'in_transit', 'delivered', 'delivery_exception', 'returned'];

const updateOrderSchema = z.object({
    orderStatus: z.enum(ORDER_STATUSES).optional(),
    shippingStatus: z.enum(SHIPPING_STATUSES).optional(),
    awb: z.string().trim().max(100).optional(),
    trackingUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional()
});

const markPaidManuallySchema = z.object({
    reason: z.string().trim().min(10).max(1000)
});

const loginSchema = z.object({
    username: z.string().trim().min(1).max(100),
    password: z.string().min(1).max(200)
});

module.exports = { updateOrderSchema, markPaidManuallySchema, loginSchema, ORDER_STATUSES, SHIPPING_STATUSES };
