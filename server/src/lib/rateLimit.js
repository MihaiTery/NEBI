'use strict';

// Minimal in-memory fixed-window rate limiter (per process). Resets on restart —
// acceptable at this stage; see README for the documented limitation.
function rateLimit({ windowMs, max, keyFn }) {
    const hits = new Map(); // key -> { count, resetAt }

    return function rateLimitMiddleware(req, res, next) {
        const key = keyFn ? keyFn(req) : req.ip;
        const now = Date.now();
        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count++;

        if (entry.count > max) {
            res.status(429).json({ error: 'Prea multe încercări. Încearcă din nou mai târziu.' });
            return;
        }

        next();
    };
}

module.exports = { rateLimit };
