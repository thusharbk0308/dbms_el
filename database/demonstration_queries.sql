-- ============================================================================
-- ChainProof - Academic DBMS Demonstration SQL Queries
-- Demonstrating 16 Core Relational DBMS Concepts on the Actual Relational Schema
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SIMPLE SELECT QUERY
-- Basic attribute projection from assets
-- ----------------------------------------------------------------------------
SELECT asset_id, title, original_filename, file_size, visibility, registration_status
FROM assets;

-- ----------------------------------------------------------------------------
-- 2. WHERE AND ORDER BY
-- Filter confirmed digital assets sorted chronologically by creation timestamp
-- ----------------------------------------------------------------------------
SELECT asset_id, title, file_size, created_at, registration_status
FROM assets
WHERE registration_status = 'CONFIRMED' AND file_size > 4096
ORDER BY created_at DESC;

-- ----------------------------------------------------------------------------
-- 3. AGGREGATE FUNCTIONS (COUNT, SUM, AVG, MIN, MAX)
-- Platform-wide aggregate storage metrics across all registered assets
-- ----------------------------------------------------------------------------
SELECT 
    COUNT(asset_id) AS total_assets_count,
    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) AS total_storage_mb,
    ROUND(AVG(file_size) / 1024.0, 2) AS avg_asset_size_kb,
    MIN(file_size) AS smallest_file_bytes,
    MAX(file_size) AS largest_file_bytes,
    MIN(created_at) AS earliest_registration,
    MAX(created_at) AS latest_registration
FROM assets;

-- ----------------------------------------------------------------------------
-- 4. GROUP BY AND HAVING
-- Aggregate asset statistics per category, filtering for active categories
-- ----------------------------------------------------------------------------
SELECT 
    c.category_name,
    COUNT(a.asset_id) AS asset_count,
    ROUND(SUM(a.file_size) / 1024.0 / 1024.0, 2) AS total_mb,
    ROUND(AVG(a.file_size) / 1024.0, 2) AS avg_kb
FROM categories c
JOIN assets a ON c.category_id = a.category_id
GROUP BY c.category_id, c.category_name
HAVING COUNT(a.asset_id) >= 1
ORDER BY asset_count DESC;

-- ----------------------------------------------------------------------------
-- 5. INNER JOIN
-- Relates each registered asset directly to its creator profile
-- ----------------------------------------------------------------------------
SELECT 
    a.asset_id,
    a.title,
    u.full_name AS creator_name,
    u.email AS creator_email,
    u.role AS creator_role
FROM assets a
INNER JOIN users u ON a.creator_id = u.user_id;

-- ----------------------------------------------------------------------------
-- 6. LEFT OUTER JOIN
-- Preserves all assets and surfaces blockchain records where confirmed
-- ----------------------------------------------------------------------------
SELECT 
    a.asset_id,
    a.title,
    a.registration_status,
    br.transaction_hash,
    br.block_number,
    br.blockchain_timestamp
FROM assets a
LEFT OUTER JOIN blockchain_records br ON a.asset_id = br.asset_id;

-- ----------------------------------------------------------------------------
-- 7. MULTI-TABLE JOIN (4+ TABLES)
-- Full provenance path: Assets -> Creators -> Versions -> Blockchain Records -> Categories
-- ----------------------------------------------------------------------------
SELECT 
    a.asset_id,
    a.title,
    c.category_name,
    u.full_name AS creator_name,
    av.version_number,
    av.file_hash,
    br.transaction_hash,
    br.block_number
FROM assets a
INNER JOIN users u ON a.creator_id = u.user_id
INNER JOIN categories c ON a.category_id = c.category_id
INNER JOIN asset_versions av ON a.asset_id = av.asset_id
LEFT OUTER JOIN blockchain_records br ON av.version_id = br.version_id
ORDER BY a.created_at DESC;

-- ----------------------------------------------------------------------------
-- 8. NESTED NON-CORRELATED SUBQUERY
-- Retrieves assets belonging to the category with the highest registration count
-- ----------------------------------------------------------------------------
SELECT asset_id, title, category_id, file_size
FROM assets
WHERE category_id = (
    SELECT category_id 
    FROM assets 
    GROUP BY category_id 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
);

-- ----------------------------------------------------------------------------
-- 9. CORRELATED SUBQUERY
-- Retrieves only the latest incremental version for each asset
-- ----------------------------------------------------------------------------
SELECT 
    av.asset_id,
    av.version_number,
    av.file_hash,
    av.created_at
FROM asset_versions av
WHERE av.version_number = (
    SELECT MAX(sub.version_number)
    FROM asset_versions sub
    WHERE sub.asset_id = av.asset_id
);

-- ----------------------------------------------------------------------------
-- 10. EXISTS AND NOT EXISTS
-- 10a. Creators who have issued at least one commercial license (EXISTS)
-- 10b. Registered assets that have zero filed disputes (NOT EXISTS)
-- ----------------------------------------------------------------------------
-- 10a: EXISTS
SELECT u.user_id, u.full_name, u.email
FROM users u
WHERE u.role = 'CREATOR'
  AND EXISTS (
      SELECT 1 
      FROM licenses l
      WHERE l.creator_id = u.user_id 
        AND l.license_type = 'Commercial'
        AND l.status = 'ACTIVE'
  );

-- 10b: NOT EXISTS
SELECT a.asset_id, a.title
FROM assets a
WHERE NOT EXISTS (
    SELECT 1 
    FROM disputes d 
    WHERE d.asset_id = a.asset_id
);

-- ----------------------------------------------------------------------------
-- 11. COMMON TABLE EXPRESSION (CTE) WITH CONDITIONAL AGGREGATION
-- Multi-stage analytical query calculating monthly upload volume and confirmation rate
-- ----------------------------------------------------------------------------
WITH monthly_metrics AS (
    SELECT 
        DATE_TRUNC('month', created_at) AS reg_month,
        registration_status,
        file_size
    FROM assets
)
SELECT 
    TO_CHAR(reg_month, 'YYYY-MM') AS month_label,
    COUNT(*) AS total_registrations,
    COUNT(*) FILTER (WHERE registration_status = 'CONFIRMED') AS confirmed_count,
    COUNT(*) FILTER (WHERE registration_status = 'PENDING') AS pending_count,
    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) AS total_mb
FROM monthly_metrics
GROUP BY reg_month
ORDER BY reg_month DESC;

-- ----------------------------------------------------------------------------
-- 12. WINDOW FUNCTIONS (ROW_NUMBER, COUNT OVER, PARTITION BY)
-- Ranks versions within each asset and computes cumulative version statistics
-- ----------------------------------------------------------------------------
SELECT 
    asset_id,
    version_id,
    version_number,
    file_hash,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY version_number ASC) AS version_sequence,
    COUNT(*) OVER (PARTITION BY asset_id) AS total_versions_for_asset
FROM asset_versions;

-- ----------------------------------------------------------------------------
-- 13. VIEWS (QUERYING PRE-BUILT DATABASE VIEWS)
-- Query the comprehensive asset registry view and creator summary view
-- ----------------------------------------------------------------------------
SELECT asset_id, title, creator_name, category_name, current_version_number, current_file_hash, transaction_hash
FROM view_asset_registry_details
LIMIT 5;

SELECT user_id, full_name, total_assets, confirmed_assets, total_licenses_issued
FROM view_creator_analytics;

-- ----------------------------------------------------------------------------
-- 14. TRIGGER EXECUTION DEMONSTRATION
-- Demonstrates automatic audit log creation when an asset's registration status changes
-- ----------------------------------------------------------------------------
-- Update asset status to trigger trg_asset_status_change
UPDATE assets 
SET registration_status = 'CONFIRMED'
WHERE asset_id = 'ast-6e1a9c3d-005';

-- Verify the trigger generated an automated audit_logs entry
SELECT log_id, user_id, action, entity_type, entity_id, details, created_at
FROM audit_logs
WHERE entity_id = 'ast-6e1a9c3d-005' AND action = 'STATUS_CHANGE';

-- ----------------------------------------------------------------------------
-- 15. STORED FUNCTION INVOCATION
-- Demonstrates calling fn_register_new_version to atomically increment and insert version
-- ----------------------------------------------------------------------------
SELECT fn_register_new_version(
    'ast-5d2f8c4b-004',
    '3333333333333333333333333333333333333333333333333333333333333333',
    'uploads/quantum_v2.pdf',
    'SHA-256'
) AS generated_version_id;

-- Verify the new incremental version was assigned version_number = 2
SELECT version_id, asset_id, version_number, file_hash, created_at
FROM asset_versions
WHERE asset_id = 'ast-5d2f8c4b-004'
ORDER BY version_number DESC;

-- ----------------------------------------------------------------------------
-- 16. TRANSACTION INTEGRITY & ACID DEMONSTRATION (SAVEPOINT, ROLLBACK, COMMIT)
-- Demonstrates atomicity: partial failure triggers safe rollback to savepoint
-- ----------------------------------------------------------------------------
BEGIN;

-- Create savepoint before experimental modification
SAVEPOINT test_acid_savepoint;

-- Perform valid insertion
INSERT INTO assets (
    asset_id, creator_id, category_id, title, description,
    original_filename, stored_filename, file_path, file_size,
    mime_type, visibility, registration_status
) VALUES (
    'ast-acid-demo-001', 3, 1, 'Transactional Integrity Demo', 'Testing ACID properties',
    'demo.py', 'ast-acid-demo-001_demo.py', 'uploads/demo.py', 4096,
    'text/x-python', 'PUBLIC', 'PENDING'
);

-- Roll back to savepoint to revert changes cleanly
ROLLBACK TO SAVEPOINT test_acid_savepoint;

-- Commit empty transaction preserving database consistency
COMMIT;

-- Confirm rolled-back asset was not persisted
SELECT COUNT(*) AS asset_persisted_count
FROM assets
WHERE asset_id = 'ast-acid-demo-001';
