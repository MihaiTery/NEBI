'use strict';

const express = require('express');
const config = require('./config');
const ordersRouter = require('./routes/orders');
const paymentsNetopiaRouter = require('./routes/payments-netopia');
const adminRouter = require('./routes/admin');

const app = express();

if (config.trustProxy) app.set('trust proxy', 1);

// Basic security headers, without pulling in a dependency for it.
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Paths that must never be reachable through the static file server, even though they live
// inside the same repo root as the public site (the server, its DB, and dev/config files).
const BLOCKED_STATIC_PREFIXES = ['/server', '/.git', '/.env', '/.claude', '/.impeccable', '/.idea', '/node_modules'];
app.use((req, res, next) => {
    if (BLOCKED_STATIC_PREFIXES.some((prefix) => req.path === prefix || req.path.startsWith(prefix + '/'))) {
        res.status(404).end();
        return;
    }
    next();
});

// JSON body parsing for the whole API, EXCEPT the NETOPIA IPN route, which needs the raw
// body (see routes/payments-netopia.js) to compute a stable idempotency hash before parsing.
app.use((req, res, next) => {
    if (req.path === '/api/payments/netopia/ipn') { next(); return; }
    express.json({ limit: '1mb' })(req, res, next);
});

app.use('/api', ordersRouter);
app.use('/api', paymentsNetopiaRouter);
app.use('/api', adminRouter);

// The existing static frontend (index.html, magazin.html, all legal pages, /checkout/, /admin/,
// /plata/*, /livrare-si-plata/) — unchanged design, served exactly as GitHub Pages would.
app.use(express.static(config.siteRoot, { dotfiles: 'ignore', extensions: ['html'] }));

app.use((req, res) => {
    res.status(404).type('text/plain').send('Pagina nu a fost găsită.');
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'A apărut o eroare neașteptată.' });
});

module.exports = app;
