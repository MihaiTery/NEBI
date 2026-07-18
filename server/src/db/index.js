'use strict';

const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

fs.mkdirSync(path.dirname(config.db.file), { recursive: true });

const db = new DatabaseSync(config.db.file);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

module.exports = db;
