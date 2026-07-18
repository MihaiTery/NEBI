'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hashPassword, verifyPassword } = require('../src/lib/passwordHash');

test('verifies a correct password against its hash', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    assert.equal(verifyPassword('correct-horse-battery-staple', hash), true);
});

test('rejects an incorrect password', () => {
    const hash = hashPassword('correct-horse-battery-staple');
    assert.equal(verifyPassword('wrong-password', hash), false);
});

test('two hashes of the same password differ (random salt) but both verify', () => {
    const a = hashPassword('same-password');
    const b = hashPassword('same-password');
    assert.notEqual(a, b);
    assert.equal(verifyPassword('same-password', a), true);
    assert.equal(verifyPassword('same-password', b), true);
});

test('never stores or compares the plaintext password directly', () => {
    const hash = hashPassword('super-secret');
    assert.equal(hash.includes('super-secret'), false);
});

test('rejects malformed/empty stored hash gracefully instead of throwing', () => {
    assert.equal(verifyPassword('anything', ''), false);
    assert.equal(verifyPassword('anything', null), false);
    assert.equal(verifyPassword('anything', 'not-a-valid-hash'), false);
});
