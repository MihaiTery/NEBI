'use strict';

const crypto = require('node:crypto');
const db = require('../db');
const config = require('../config');

const SESSION_COOKIE_NAME = 'nebi_admin_session';

function parseCookies(req) {
    const header = req.headers.cookie;
    const out = {};
    if (!header) return out;
    header.split(';').forEach((part) => {
        const idx = part.indexOf('=');
        if (idx === -1) return;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (key) out[key] = decodeURIComponent(value);
    });
    return out;
}

function createSession(username) {
    const id = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + config.admin.sessionTtlMinutes * 60_000);

    db.prepare('INSERT INTO admin_sessions (id, admin_username, created_at, expires_at) VALUES (?, ?, ?, ?)')
        .run(id, username, now.toISOString(), expiresAt.toISOString());

    return { id, expiresAt };
}

function destroySession(id) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(id);
}

function getValidSession(id) {
    if (!id) return null;
    const row = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(id);
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
        destroySession(id);
        return null;
    }
    return row;
}

function setSessionCookie(res, id, expiresAt) {
    const parts = [
        `${SESSION_COOKIE_NAME}=${id}`,
        'Path=/api/admin',
        'HttpOnly',
        'SameSite=Strict',
        `Expires=${expiresAt.toUTCString()}`
    ];
    if (config.isProduction) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
    const parts = [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/api/admin',
        'HttpOnly',
        'SameSite=Strict',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT'
    ];
    if (config.isProduction) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
}

function requireAdmin(req, res, next) {
    const cookies = parseCookies(req);
    const session = getValidSession(cookies[SESSION_COOKIE_NAME]);
    if (!session) {
        res.status(401).json({ error: 'Autentificare necesară.' });
        return;
    }
    req.admin = { username: session.admin_username, sessionId: session.id };
    next();
}

module.exports = {
    SESSION_COOKIE_NAME,
    parseCookies,
    createSession,
    destroySession,
    getValidSession,
    setSessionCookie,
    clearSessionCookie,
    requireAdmin
};
