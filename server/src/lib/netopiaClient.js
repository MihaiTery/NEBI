'use strict';

/**
 * Thin REST client for NETOPIA Payments API v2 (JSON, API-key auth), built directly against
 * the public docs at https://doc.netopia-payments.com/docs/payment-api/v2.x/ — deliberately
 * NOT using a third-party npm wrapper, since NETOPIA does not publish an official Node SDK
 * (only a reference sample app), and an unofficial wrapper is exactly the kind of dependency
 * this project should avoid.
 *
 * VERIFICATION STATUS (be honest about this — see README-COMENZI-SI-BAZA-DE-DATE.md):
 *  - POST {base}/payment/card/start  — confirmed shape from official "Sample Request" docs.
 *  - Response field carrying the hosted-payment redirect URL — NOT confirmed against a live
 *    Sandbox response in this session (no credentials exist yet); `extractPaymentUrl` below
 *    checks the field names documented/observed for this API family and must be re-verified
 *    the first time this runs against a real NETOPIA Sandbox account.
 *  - Status-check endpoint path — best-effort guess (`/payment/status`), NOT confirmed.
 *  - IPN authenticity — verified here by calling NETOPIA's status endpoint back
 *    (server-to-server, using our own API key) rather than trusting the webhook payload
 *    directly, since the exact IPN signature header for v2 was not confirmed in this session.
 */

const config = require('../config');

function baseUrl() {
    if (config.netopia.env === 'live') return config.netopia.liveBaseUrl;
    return config.netopia.sandboxBaseUrl;
}

function isConfigured() {
    return config.netopia.env !== 'disabled' && Boolean(config.netopia.apiKey) && Boolean(config.netopia.posSignature);
}

async function startPayment({ order, billing, shipping, products, browserData }) {
    if (!isConfigured()) {
        const err = new Error('NETOPIA nu este configurată (mod disabled sau chei lipsă).');
        err.code = 'NETOPIA_DISABLED';
        throw err;
    }

    const body = {
        config: {
            emailTemplate: '',
            notifyUrl: config.netopia.notifyUrl,
            redirectUrl: config.netopia.returnUrl,
            language: 'ro'
        },
        payment: {
            options: { installments: 0, bonus: 0 },
            instrument: { type: 'card' },
            data: browserData || {}
        },
        order: {
            posSignature: config.netopia.posSignature,
            dateTime: new Date().toISOString(),
            description: order.description,
            orderID: order.orderId,
            amount: order.amountRon,
            currency: order.currency,
            billing,
            shipping: shipping || billing,
            products: products || []
        }
    };

    const response = await fetch(`${baseUrl()}/payment/card/start`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: config.netopia.apiKey
        },
        body: JSON.stringify(body)
    });

    const text = await response.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        const err = new Error('Răspuns NETOPIA neinterpretabil (nu este JSON valid).');
        err.code = 'NETOPIA_BAD_RESPONSE';
        throw err;
    }

    if (!response.ok) {
        const err = new Error(`NETOPIA a răspuns cu eroare (HTTP ${response.status}).`);
        err.code = 'NETOPIA_HTTP_ERROR';
        err.details = json;
        throw err;
    }

    const paymentUrl = extractPaymentUrl(json);
    if (!paymentUrl) {
        const err = new Error('Răspunsul NETOPIA nu conține o adresă de redirect recunoscută — necesită verificare împotriva Sandbox real.');
        err.code = 'NETOPIA_UNRECOGNIZED_RESPONSE';
        err.details = json;
        throw err;
    }

    return { paymentUrl, ntpId: extractNtpId(json), raw: json };
}

function extractPaymentUrl(json) {
    return (
        json?.payment?.paymentURL ||
        json?.paymentURL ||
        json?.data?.paymentURL ||
        json?.redirectUrl ||
        json?.data?.redirectUrl ||
        null
    );
}

function extractNtpId(json) {
    return json?.payment?.ntpID || json?.ntpID || json?.order?.ntpID || null;
}

/** Server-to-server status check, used to verify an inbound IPN before trusting it. */
async function getPaymentStatus({ orderId, ntpId }) {
    if (!isConfigured()) {
        const err = new Error('NETOPIA nu este configurată (mod disabled sau chei lipsă).');
        err.code = 'NETOPIA_DISABLED';
        throw err;
    }

    const response = await fetch(`${baseUrl()}/payment/status`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: config.netopia.apiKey
        },
        body: JSON.stringify({ orderID: orderId, ntpID: ntpId })
    });

    const text = await response.text();
    let json;
    try {
        json = JSON.parse(text);
    } catch (e) {
        const err = new Error('Răspuns NETOPIA (status) neinterpretabil.');
        err.code = 'NETOPIA_BAD_RESPONSE';
        throw err;
    }

    if (!response.ok) {
        const err = new Error(`NETOPIA (status) a răspuns cu eroare (HTTP ${response.status}).`);
        err.code = 'NETOPIA_HTTP_ERROR';
        err.details = json;
        throw err;
    }

    return json;
}

module.exports = { isConfigured, startPayment, getPaymentStatus, extractPaymentUrl, extractNtpId };
