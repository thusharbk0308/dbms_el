-- ============================================================================
-- ChainProof - Digital Intellectual Property Registration & Verification System
-- PostgreSQL Relational Database Schema (3NF Compliant)
-- ============================================================================

-- Drop tables in reverse dependency order if resetting
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS ownership_history CASCADE;
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS licenses CASCADE;
DROP TABLE IF EXISTS blockchain_records CASCADE;
DROP TABLE IF EXISTS asset_versions CASCADE;
DROP TABLE IF EXISTS assets CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CREATOR', 'VERIFIER', 'ADMINISTRATOR')),
    account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 3. ASSETS TABLE
CREATE TABLE assets (
    asset_id VARCHAR(64) PRIMARY KEY,
    creator_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    category_id INT NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL UNIQUE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'UNLISTED')),
    registration_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (registration_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    registered_at TIMESTAMPTZ NULL
);

-- 4. ASSET_VERSIONS TABLE
CREATE TABLE asset_versions (
    version_id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    version_number INT NOT NULL CHECK (version_number >= 1),
    file_hash CHAR(64) NOT NULL,
    hash_algorithm VARCHAR(32) NOT NULL DEFAULT 'SHA-256',
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_asset_version UNIQUE (asset_id, version_number)
);

-- 5. BLOCKCHAIN_RECORDS TABLE
CREATE TABLE blockchain_records (
    record_id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id) ON DELETE RESTRICT,
    version_id INT NOT NULL REFERENCES asset_versions(version_id) ON DELETE RESTRICT,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT NOT NULL CHECK (block_number >= 0),
    network_name VARCHAR(100) NOT NULL,
    contract_address VARCHAR(42) NOT NULL,
    blockchain_timestamp TIMESTAMPTZ NOT NULL,
    transaction_status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED' CHECK (transaction_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. LICENSES TABLE
CREATE TABLE licenses (
    license_id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id) ON DELETE CASCADE,
    creator_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    licensee_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    license_type VARCHAR(50) NOT NULL CHECK (license_type IN ('Personal', 'Educational', 'Commercial', 'Custom')),
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMPTZ NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_license_dates CHECK (expiry_date IS NULL OR expiry_date >= start_date)
);

-- 7. VERIFICATIONS TABLE
CREATE TABLE verifications (
    verification_id SERIAL PRIMARY KEY,
    verifier_id INT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    asset_id VARCHAR(64) NULL REFERENCES assets(asset_id) ON DELETE SET NULL,
    submitted_hash CHAR(64) NOT NULL,
    verification_result VARCHAR(50) NOT NULL CHECK (verification_result IN ('EXACT_MATCH', 'HASH_MISMATCH', 'NOT_REGISTERED', 'BLOCKCHAIN_VERIFICATION_FAILED')),
    verified_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. DISPUTES TABLE
CREATE TABLE disputes (
    dispute_id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id) ON DELETE RESTRICT,
    reporter_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    evidence_path VARCHAR(500) NULL,
    dispute_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (dispute_status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMPTZ NULL
);

-- 9. OWNERSHIP_HISTORY TABLE
CREATE TABLE ownership_history (
    history_id SERIAL PRIMARY KEY,
    asset_id VARCHAR(64) NOT NULL REFERENCES assets(asset_id) ON DELETE RESTRICT,
    previous_owner_id INT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    new_owner_id INT NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    transaction_reference VARCHAR(100) NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. AUDIT_LOGS TABLE
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PERFORMANCE & INTEGRITY INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_status ON assets(registration_status);

CREATE INDEX idx_asset_versions_asset_id ON asset_versions(asset_id);
CREATE INDEX idx_asset_versions_file_hash ON asset_versions(file_hash);

CREATE INDEX idx_blockchain_records_tx_hash ON blockchain_records(transaction_hash);
CREATE INDEX idx_blockchain_records_version_id ON blockchain_records(version_id);

CREATE INDEX idx_licenses_asset_id ON licenses(asset_id);
CREATE INDEX idx_licenses_licensee_id ON licenses(licensee_id);

CREATE INDEX idx_verifications_submitted_hash ON verifications(submitted_hash);
CREATE INDEX idx_disputes_asset_id ON disputes(asset_id);
CREATE INDEX idx_disputes_status ON disputes(dispute_status);

CREATE INDEX idx_ownership_history_asset_id ON ownership_history(asset_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
