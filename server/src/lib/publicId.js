'use strict';

const crypto = require('node:crypto');

// Public order numbers must be hard to guess/enumerate without exposing the internal integer id.
// 32^8 ≈ 1.1e12 combinations, Crockford base32 (no 0/O/1/I ambiguity).
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

function generatePublicOrderNumber() {
    const bytes = crypto.randomBytes(8);
    let out = '';
    for (let i = 0; i < 8; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return 'NEBI-' + out;
}

module.exports = { generatePublicOrderNumber };
