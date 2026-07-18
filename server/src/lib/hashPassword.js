#!/usr/bin/env node
'use strict';

// CLI helper: node src/lib/hashPassword.js "parola-mea-puternica"
// Prints a scrypt hash to paste into ADMIN_PASSWORD_HASH in your .env — never store the plain password.
const { hashPassword } = require('./passwordHash');

const password = process.argv[2];
if (!password) {
    console.error('Utilizare: node src/lib/hashPassword.js "parola-mea-puternica"');
    process.exit(1);
}
if (password.length < 12) {
    console.error('Parola trebuie să aibă cel puțin 12 caractere.');
    process.exit(1);
}

console.log(hashPassword(password));
