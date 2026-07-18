'use strict';

// Reuses the exact same commerce rules the browser uses — see /pricing-config.js at the repo root.
// This is the actual single source of truth: the server never re-implements 2490/200/300/12/20.
module.exports = require('../../pricing-config.js');
