-- ============================================================================
-- ChainProof - PostgreSQL Stored Functions & Procedures
-- ============================================================================

-- 1. Function to safely register a new version of an asset
CREATE OR REPLACE FUNCTION fn_register_new_version(
    p_asset_id VARCHAR(64),
    p_file_hash CHAR(64),
    p_file_path VARCHAR(500),
    p_hash_algorithm VARCHAR(32) DEFAULT 'SHA-256'
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_version INT;
    v_new_version_id INT;
BEGIN
    -- Determine the next incremental version number for this asset
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO v_next_version
    FROM asset_versions
    WHERE asset_id = p_asset_id;

    -- Insert new version record
    INSERT INTO asset_versions (
        asset_id,
        version_number,
        file_hash,
        hash_algorithm,
        file_path,
        created_at
    ) VALUES (
        p_asset_id,
        v_next_version,
        p_file_hash,
        p_hash_algorithm,
        p_file_path,
        CURRENT_TIMESTAMP
    )
    RETURNING version_id INTO v_new_version_id;

    -- Return the newly generated version identifier
    RETURN v_new_version_id;
END;
$$;

-- 2. Procedure / Function to transfer registered ownership claim atomically
CREATE OR REPLACE FUNCTION fn_transfer_asset_claim(
    p_asset_id VARCHAR(64),
    p_new_owner_id INT,
    p_transaction_reference VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_previous_owner_id INT;
BEGIN
    -- Retrieve current registered owner
    SELECT creator_id INTO v_previous_owner_id
    FROM assets
    WHERE asset_id = p_asset_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Asset with ID % does not exist.', p_asset_id;
    END IF;

    IF v_previous_owner_id = p_new_owner_id THEN
        RAISE EXCEPTION 'New owner cannot be the same as current owner.';
    END IF;

    -- Update asset owner
    UPDATE assets
    SET creator_id = p_new_owner_id
    WHERE asset_id = p_asset_id;

    -- Insert into ownership history
    INSERT INTO ownership_history (
        asset_id,
        previous_owner_id,
        new_owner_id,
        transaction_reference,
        changed_at
    ) VALUES (
        p_asset_id,
        v_previous_owner_id,
        p_new_owner_id,
        p_transaction_reference,
        CURRENT_TIMESTAMP
    );

    -- Log audit entry
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        details,
        created_at
    ) VALUES (
        p_new_owner_id,
        'TRANSFER_CLAIM',
        'ASSET',
        p_asset_id,
        'Transferred claim from user ' || v_previous_owner_id || ' to ' || p_new_owner_id,
        CURRENT_TIMESTAMP
    );

    RETURN TRUE;
END;
$$;

-- 3. Function to get platform overview analytics
CREATE OR REPLACE FUNCTION fn_get_platform_metrics()
RETURNS TABLE (
    metric_name VARCHAR,
    metric_value BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'total_users'::VARCHAR, COUNT(*)::BIGINT FROM users
    UNION ALL
    SELECT 'total_creators'::VARCHAR, COUNT(*)::BIGINT FROM users WHERE role = 'CREATOR'
    UNION ALL
    SELECT 'total_assets'::VARCHAR, COUNT(*)::BIGINT FROM assets
    UNION ALL
    SELECT 'confirmed_assets'::VARCHAR, COUNT(*)::BIGINT FROM assets WHERE registration_status = 'CONFIRMED'
    UNION ALL
    SELECT 'total_verifications'::VARCHAR, COUNT(*)::BIGINT FROM verifications
    UNION ALL
    SELECT 'successful_verifications'::VARCHAR, COUNT(*)::BIGINT FROM verifications WHERE verification_result = 'EXACT_MATCH'
    UNION ALL
    SELECT 'active_licenses'::VARCHAR, COUNT(*)::BIGINT FROM licenses WHERE status = 'ACTIVE'
    UNION ALL
    SELECT 'pending_disputes'::VARCHAR, COUNT(*)::BIGINT FROM disputes WHERE dispute_status = 'PENDING';
END;
$$;
