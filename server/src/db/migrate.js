'use strict';

// Versioned migration runner. Applies every *.sql file in db/migrations/ that hasn't run yet,
// in filename order, tracked in a `schema_migrations` table. Safe to run repeatedly.

const fs = require('node:fs');
const path = require('node:path');
const db = require('./index');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

function ensureMigrationsTable() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename    TEXT PRIMARY KEY,
            applied_at  TEXT NOT NULL
        )
    `);
}

function getAppliedMigrations() {
    const rows = db.prepare('SELECT filename FROM schema_migrations').all();
    return new Set(rows.map((r) => r.filename));
}

function run() {
    ensureMigrationsTable();
    const applied = getAppliedMigrations();
    const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();

    let count = 0;
    for (const file of files) {
        if (applied.has(file)) continue;
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        console.log('Applying migration:', file);
        db.exec('BEGIN');
        try {
            db.exec(sql);
            db.prepare('INSERT INTO schema_migrations (filename, applied_at) VALUES (?, ?)')
                .run(file, new Date().toISOString());
            db.exec('COMMIT');
            count++;
        } catch (err) {
            db.exec('ROLLBACK');
            console.error('Migration failed:', file, err.message);
            process.exitCode = 1;
            throw err;
        }
    }

    console.log(count === 0 ? 'No pending migrations.' : `Applied ${count} migration(s).`);
}

if (require.main === module) {
    run();
}

module.exports = { run };
