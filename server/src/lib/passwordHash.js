'use strict';

const crypto = require('node:crypto');

const KEYLEN = 64;
const SALT_BYTES = 16;

function hashPassword(password) {
    const salt = crypto.randomBytes(SALT_BYTES);
    const hash = crypto.scryptSync(password, salt, KEYLEN);
    return `scrypt:${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
    if (!stored || typeof stored !== 'string') return false;
    const parts = stored.split(':');
    if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

    const salt = Buffer.from(parts[1], 'hex');
    const expected = Buffer.from(parts[2], 'hex');
    const actual = crypto.scryptSync(password, salt, expected.length);

    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
