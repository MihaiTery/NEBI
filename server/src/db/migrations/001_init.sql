-- NEBI commerce schema. Money columns are always integer bani (1 RON = 100 bani).
-- Timestamps are ISO 8601 UTC strings (TEXT), written by the application, never SQL localtime.

CREATE TABLE orders (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    public_number           TEXT NOT NULL UNIQUE,       -- hard-to-guess public order number (e.g. NEBI-8K3F9QZ2)

    customer_type           TEXT NOT NULL CHECK (customer_type IN ('individual', 'company')),
    customer_first_name     TEXT,
    customer_last_name      TEXT,
    customer_company_name   TEXT,
    customer_cui            TEXT,
    customer_reg_com        TEXT,
    customer_email          TEXT NOT NULL,
    customer_phone          TEXT NOT NULL,

    shipping_county         TEXT NOT NULL,
    shipping_city           TEXT NOT NULL,
    shipping_address        TEXT NOT NULL,
    shipping_postal_code    TEXT NOT NULL,

    billing_same_as_shipping INTEGER NOT NULL DEFAULT 1 CHECK (billing_same_as_shipping IN (0, 1)),
    billing_company_name    TEXT,
    billing_cui             TEXT,
    billing_reg_com         TEXT,
    billing_county          TEXT,
    billing_city             TEXT,
    billing_address         TEXT,
    billing_postal_code     TEXT,
    billing_contact_name    TEXT,
    billing_contact_email   TEXT,
    billing_contact_phone   TEXT,

    notes                   TEXT,

    currency                TEXT NOT NULL DEFAULT 'RON',
    subtotal_bani           INTEGER NOT NULL,
    vat_included            INTEGER NOT NULL DEFAULT 1 CHECK (vat_included IN (0, 1)),
    shipping_included       INTEGER NOT NULL DEFAULT 1 CHECK (shipping_included IN (0, 1)),
    total_bani              INTEGER NOT NULL,

    config_json             TEXT NOT NULL,               -- snapshot of {extraLevels, sisalCount, ropeCount}

    payment_status          TEXT NOT NULL DEFAULT 'pending'
                             CHECK (payment_status IN ('pending','processing','paid','failed','cancelled','expired','partially_refunded','refunded')),
    order_status             TEXT NOT NULL DEFAULT 'new'
                             CHECK (order_status IN ('new','confirmed','in_production','ready_for_shipping','shipped','completed','cancelled','returned')),
    shipping_status          TEXT NOT NULL DEFAULT 'not_prepared'
                             CHECK (shipping_status IN ('not_prepared','ready','handed_to_gls','in_transit','delivered','delivery_exception','returned')),

    carrier                 TEXT NOT NULL DEFAULT 'GLS',
    awb                     TEXT,
    tracking_url            TEXT,
    shipped_at              TEXT,
    delivered_at            TEXT,

    terms_version            TEXT NOT NULL,
    refund_policy_version     TEXT NOT NULL,
    consent_accepted_at      TEXT NOT NULL,
    consent_ip               TEXT,
    consent_user_agent       TEXT,

    created_at               TEXT NOT NULL,
    paid_at                  TEXT,
    cancelled_at              TEXT,
    updated_at                TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_orders_public_number ON orders (public_number);
CREATE INDEX idx_orders_payment_status ON orders (payment_status);
CREATE INDEX idx_orders_order_status ON orders (order_status);
CREATE INDEX idx_orders_shipping_status ON orders (shipping_status);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_orders_customer_email ON orders (customer_email);

CREATE TABLE order_items (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id            INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    item_type           TEXT NOT NULL CHECK (item_type IN ('base_package', 'extra_level', 'special_sisal', 'special_rope')),
    name_snapshot        TEXT NOT NULL,
    quantity             INTEGER NOT NULL,
    unit_price_bani       INTEGER NOT NULL,
    line_total_bani       INTEGER NOT NULL,
    config_snapshot_json  TEXT NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);

CREATE TABLE payments (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id                 INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    provider                 TEXT NOT NULL DEFAULT 'netopia',
    external_transaction_id   TEXT,                       -- NETOPIA ntpID
    status                    TEXT NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','processing','paid','failed','cancelled','expired','partially_refunded','refunded')),
    amount_bani               INTEGER NOT NULL,
    currency                  TEXT NOT NULL DEFAULT 'RON',
    initiated_at              TEXT NOT NULL,
    confirmed_at              TEXT,
    failed_at                 TEXT,
    technical_reason          TEXT,                       -- sanitized only — never raw card/payload data
    attempt_count              INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_external_transaction_id ON payments (external_transaction_id);

CREATE TABLE payment_events (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    event_uid            TEXT NOT NULL UNIQUE,             -- idempotency key for duplicate IPN detection
    provider              TEXT NOT NULL DEFAULT 'netopia',
    external_transaction_id TEXT,
    order_id              INTEGER REFERENCES orders (id) ON DELETE SET NULL,
    event_type            TEXT NOT NULL,
    payload_hash           TEXT NOT NULL,                  -- sha256 of the raw payload — never the payload itself
    received_at            TEXT NOT NULL,
    processed_at            TEXT,
    processing_result       TEXT
);

CREATE UNIQUE INDEX idx_payment_events_event_uid ON payment_events (event_uid);
CREATE INDEX idx_payment_events_order_id ON payment_events (order_id);

CREATE TABLE audit_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_username   TEXT NOT NULL,
    action            TEXT NOT NULL,
    entity            TEXT NOT NULL,
    entity_id         TEXT NOT NULL,
    old_value_json     TEXT,
    new_value_json     TEXT,
    created_at         TEXT NOT NULL
);

CREATE INDEX idx_audit_log_entity ON audit_log (entity, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log (created_at);

CREATE TABLE admin_sessions (
    id            TEXT PRIMARY KEY,           -- random session id (the cookie holds this value)
    admin_username TEXT NOT NULL,
    created_at     TEXT NOT NULL,
    expires_at     TEXT NOT NULL
);

CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions (expires_at);
