'use strict';

const db = require('../db');

function recordAudit({ adminUsername, action, entity, entityId, oldValue, newValue }) {
    db.prepare(`
        INSERT INTO audit_log (admin_username, action, entity, entity_id, old_value_json, new_value_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
        adminUsername,
        action,
        entity,
        String(entityId),
        oldValue === undefined ? null : JSON.stringify(oldValue),
        newValue === undefined ? null : JSON.stringify(newValue),
        new Date().toISOString()
    );
}

module.exports = { recordAudit };
