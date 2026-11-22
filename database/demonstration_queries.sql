-- ============================================================================
-- ChainProof - Academic DBMS Demonstration SQL Queries
-- Demonstrating Advanced Relational DBMS Concepts:
-- Joins, Nested Queries, Correlated Subqueries, GROUP BY/HAVING,
-- Aggregations, Window Functions, Transactions, Constraints & Index Usage
-- ============================================================================

-- ----------------------------------------------------------------------------
-- CONCEPT 1: COMPLEX MULTI-TABLE JOINS (INNER, LEFT, RIGHT)
-- Retrieves confirmed assets with creator identity, category, and blockchain record
-- ----------------------------------------------------------------------------
SELECT 
    a.asset_id,
    a.title,
    c.category_name,
    u.full_name AS creator_name,
    u.email AS creator_email,
    av.version_number,
    av.file_hash,
    br.transaction_hash,
    br.block_number,
    br.blockchain_timestamp
FROM assets a
INNER JOIN users u ON a.creator_id = u.user_id
INNER JOIN categories c ON a.category_id = c.category_id
INNER JOIN asset_versions av ON a.asset_id = av.asset_id
LEFT OUTER JOIN blockchain_records br ON av.version_id = br.version_id
WHERE a.registration_status = 'CONFIRMED'
ORDER BY br.block_number DESC;

-- ----------------------------------------------------------------------------
-- CONCEPT 2: GROUP BY WITH AGGREGATIONS AND HAVING CLAUSE
-- Finds creators who have registered more than 1 asset with total storage used
-- ----------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(a.asset_id) AS total_assets,
    SUM(a.file_size) / 1024.0 / 1024.0 AS total_megabytes_stored,
    AVG(a.file_size) AS avg_file_size_bytes,
    MAX(a.created_at) AS most_recent_upload
FROM users u
JOIN assets a ON u.user_id = a.creator_id
GROUP BY u.user_id, u.full_name, u.email
HAVING COUNT(a.asset_id) >= 1
ORDER BY total_assets DESC;

-- ----------------------------------------------------------------------------
-- CONCEPT 3: NESTED NON-CORRELATED SUBQUERY
-- Finds all assets that belong to the category having the highest asset count
-- ----------------------------------------------------------------------------
SELECT 
    asset_id,
    title,
    category_id,
    created_at
FROM assets
WHERE category_id IN (
    SELECT category_id 
    FROM assets 
    GROUP BY category_id 
    ORDER BY COUNT(*) DESC 
    LIMIT 1
);

-- ----------------------------------------------------------------------------
-- CONCEPT 4: CORRELATED SUBQUERY
-- Identifies the latest version for each asset using a correlated subquery
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
-- CONCEPT 5: CORRELATED SUBQUERY WITH EXISTS
-- Selects creators who have at least one active commercial license issued
-- ----------------------------------------------------------------------------
SELECT 
    u.user_id,
    u.full_name,
    u.email
FROM users u
WHERE u.role = 'CREATOR'
  AND EXISTS (
      SELECT 1 
      FROM licenses l
      WHERE l.creator_id = u.user_id 
        AND l.license_type = 'Commercial'
        AND l.status = 'ACTIVE'
  );

-- ----------------------------------------------------------------------------
-- CONCEPT 6: WINDOW FUNCTIONS (OVER, PARTITION BY, RANK/ROW_NUMBER)
-- Ranks versions within each asset by creation date
-- ----------------------------------------------------------------------------
SELECT 
    asset_id,
    version_id,
    version_number,
    file_hash,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY version_number ASC) AS version_sequence,
    COUNT(*) OVER (PARTITION BY asset_id) AS total_asset_versions
FROM asset_versions;

-- ----------------------------------------------------------------------------
-- CONCEPT 7: COMMON TABLE EXPRESSION (CTE) WITH CONDITIONAL AGGREGATION
-- Monthly registration breakdown categorized by status
-- ----------------------------------------------------------------------------
WITH monthly_breakdown AS (
    SELECT 
        DATE_TRUNC('month', created_at) AS reg_month,
        registration_status,
        file_size
    FROM assets
)
SELECT 
    TO_CHAR(reg_month, 'YYYY-MM') AS registration_month,
    COUNT(*) AS total_uploaded,
    COUNT(*) FILTER (WHERE registration_status = 'CONFIRMED') AS confirmed_count,
    COUNT(*) FILTER (WHERE registration_status = 'PENDING') AS pending_count,
    ROUND(SUM(file_size) / 1024.0 / 1024.0, 2) AS total_mb
FROM monthly_breakdown
GROUP BY reg_month
ORDER BY reg_month DESC;

-- ----------------------------------------------------------------------------
-- CONCEPT 8: TRANSACTIONAL INTEGRITY & ACID DEMONSTRATION (COMMIT / ROLLBACK)
-- Demonstrates atomic registration rollback on failure
-- ----------------------------------------------------------------------------
BEGIN;

-- Step 1: Savepoints allow partial rollbacks within complex transactions
SAVEPOINT before_test_registration;

INSERT INTO assets (
    asset_id, creator_id, category_id, title, description,
    original_filename, stored_filename, file_path, file_size,
    mime_type, visibility, registration_status
) VALUES (
    'test-atomic-001', 3, 1, 'Transactional Test File', 'Testing ACID properties',
    'test.py', 'test-atomic-001_test.py', 'uploads/test.py', 1024,
    'text/x-python', 'PUBLIC', 'PENDING'
);

INSERT INTO asset_versions (
    asset_id, version_number, file_hash, file_path
) VALUES (
    'test-atomic-001', 1, 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890', 'uploads/test.py'
);

-- Rollback the savepoint to demonstrate undo of partial state without corrupting database
ROLLBACK TO SAVEPOINT before_test_registration;

-- Commit clean transaction
COMMIT;

-- ----------------------------------------------------------------------------
-- CONCEPT 9: QUERY OPTIMIZATION & INDEX UTILIZATION (EXPLAIN ANALYZE)
-- Verification lookup query using indexed file_hash
-- ----------------------------------------------------------------------------
EXPLAIN ANALYZE
SELECT 
    av.file_hash,
    av.version_number,
    a.asset_id,
    a.title,
    u.full_name AS creator_name,
    br.transaction_hash
FROM asset_versions av
JOIN assets a ON av.asset_id = a.asset_id
JOIN users u ON a.creator_id = u.user_id
LEFT JOIN blockchain_records br ON av.version_id = br.version_id
WHERE av.file_hash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
