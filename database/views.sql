-- ============================================================================
-- ChainProof - Database Views
-- Relational Abstractions & Analytical Projections
-- ============================================================================

-- 1. Complete Asset Registry View
-- Flattens asset metadata, creator info, category, latest version, and blockchain status
CREATE OR REPLACE VIEW view_asset_registry_details AS
SELECT 
    a.asset_id,
    a.title,
    a.description,
    a.original_filename,
    a.file_size,
    a.mime_type,
    a.visibility,
    a.registration_status,
    a.created_at AS asset_created_at,
    a.registered_at AS blockchain_registered_at,
    u.user_id AS creator_id,
    u.full_name AS creator_name,
    u.email AS creator_email,
    c.category_id,
    c.category_name,
    av.version_id AS current_version_id,
    av.version_number AS current_version_number,
    av.file_hash AS current_file_hash,
    br.transaction_hash,
    br.block_number,
    br.network_name,
    br.blockchain_timestamp
FROM assets a
JOIN users u ON a.creator_id = u.user_id
JOIN categories c ON a.category_id = c.category_id
LEFT JOIN asset_versions av ON a.asset_id = av.asset_id 
    AND av.version_number = (
        SELECT MAX(v2.version_number) 
        FROM asset_versions v2 
        WHERE v2.asset_id = a.asset_id
    )
LEFT JOIN blockchain_records br ON av.version_id = br.version_id;

-- 2. Creator Analytics View
-- Aggregated statistics for each creator platform participant
CREATE OR REPLACE VIEW view_creator_analytics AS
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    COUNT(DISTINCT a.asset_id) AS total_assets,
    COUNT(DISTINCT CASE WHEN a.registration_status = 'CONFIRMED' THEN a.asset_id END) AS confirmed_assets,
    COUNT(DISTINCT CASE WHEN a.registration_status = 'PENDING' THEN a.asset_id END) AS pending_assets,
    COUNT(DISTINCT l.license_id) AS total_licenses_issued,
    COUNT(DISTINCT d.dispute_id) AS total_disputes_against_assets
FROM users u
LEFT JOIN assets a ON u.user_id = a.creator_id
LEFT JOIN licenses l ON a.asset_id = l.asset_id
LEFT JOIN disputes d ON a.asset_id = d.asset_id
WHERE u.role = 'CREATOR'
GROUP BY u.user_id, u.full_name, u.email;

-- 3. Verification Activity Summary View
CREATE OR REPLACE VIEW view_verification_summary AS
SELECT 
    verification_result,
    COUNT(*) AS total_verifications,
    MIN(verified_at) AS first_verification_at,
    MAX(verified_at) AS latest_verification_at
FROM verifications
GROUP BY verification_result;

-- 4. Active & Expired Licensing Summary View
CREATE OR REPLACE VIEW view_licensing_summary AS
SELECT 
    l.license_id,
    l.license_type,
    l.status,
    l.start_date,
    l.expiry_date,
    CASE 
        WHEN l.expiry_date IS NOT NULL AND l.expiry_date < CURRENT_TIMESTAMP THEN 'EXPIRED'
        ELSE l.status 
    END AS computed_status,
    a.asset_id,
    a.title AS asset_title,
    c.full_name AS creator_name,
    li.full_name AS licensee_name
FROM licenses l
JOIN assets a ON l.asset_id = a.asset_id
JOIN users c ON l.creator_id = c.user_id
JOIN users li ON l.licensee_id = li.user_id;
