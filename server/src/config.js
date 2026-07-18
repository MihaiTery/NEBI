'use strict';

const path = require('node:path');

// Node's built-in .env loader (>=20.6) — optional file, ignored if absent.
try {
    process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
} catch (e) {
    // No .env file present (e.g. production env vars injected by the host) — that's fine.
}

function bool(value, fallback) {
    if (value === undefined || value === '') return fallback;
    return value === 'true' || value === '1';
}

const NODE_ENV = process.env.NODE_ENV || 'development';

const config = {
    nodeEnv: NODE_ENV,
    isProduction: NODE_ENV === 'production',
    port: parseInt(process.env.PORT, 10) || 3000,

    // Repo root: the existing static frontend (index.html, magazin.html, legal pages, …) lives here.
    // The server serves it as-is — same design, same URLs — and layers /api and a few new folders on top.
    siteRoot: path.join(__dirname, '..', '..'),

    db: {
        file: process.env.DB_FILE || path.join(__dirname, '..', 'data', 'nebi.sqlite')
    },

    admin: {
        // No default credentials on purpose — the server refuses to start in production without these set.
        username: process.env.ADMIN_USERNAME || '',
        // scrypt hash produced by `node server/src/lib/hashPassword.js <password>` — never a plaintext password.
        passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
        sessionSecret: process.env.ADMIN_SESSION_SECRET || '',
        sessionTtlMinutes: parseInt(process.env.ADMIN_SESSION_TTL_MINUTES, 10) || 60
    },

    netopia: {
        env: process.env.NETOPIA_ENV || 'disabled', // 'disabled' | 'sandbox' | 'live'
        apiKey: process.env.NETOPIA_API_KEY || '',
        posSignature: process.env.NETOPIA_POS_SIGNATURE || '',
        publicKey: process.env.NETOPIA_PUBLIC_KEY || '',
        privateKey: process.env.NETOPIA_PRIVATE_KEY || '',
        returnUrl: process.env.NETOPIA_RETURN_URL || '',
        notifyUrl: process.env.NETOPIA_NOTIFY_URL || '',
        sandboxBaseUrl: 'https://secure.sandbox.netopia-payments.com',
        liveBaseUrl: 'https://secure.mobilpay.ro/pay'
    },

    trustProxy: bool(process.env.TRUST_PROXY, false)
};

module.exports = config;
