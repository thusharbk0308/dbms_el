-- ============================================================================
-- ChainProof - PostgreSQL Triggers
-- Automated Integrity, Synchronization, and Audit Logging
-- ============================================================================

-- 1. Trigger Function: Log asset status changes into audit_logs automatically
CREATE OR REPLACE FUNCTION trg_fn_audit_asset_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF (OLD.registration_status IS DISTINCT FROM NEW.registration_status) THEN
        INSERT INTO audit_logs (
            user_id,
            action,
            entity_type,
            entity_id,
            details,
            created_at
        ) VALUES (
            NEW.creator_id,
            'STATUS_CHANGE',
            'ASSET',
            NEW.asset_id,
            'Asset status transitioned from ' || OLD.registration_status || ' to ' || NEW.registration_status,
            CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Attach trigger to assets table
DROP TRIGGER IF EXISTS trg_asset_status_change ON assets;
CREATE TRIGGER trg_asset_status_change
AFTER UPDATE ON assets
FOR EACH ROW
EXECUTE FUNCTION trg_fn_audit_asset_status_change();

-- 2. Trigger Function: Prevent deletion or modification of historic blockchain records
CREATE OR REPLACE FUNCTION trg_fn_prevent_blockchain_record_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Cryptographic blockchain verification records cannot be deleted.';
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.transaction_hash <> NEW.transaction_hash OR OLD.blockchain_timestamp <> NEW.blockchain_timestamp) THEN
            RAISE EXCEPTION 'Immutable blockchain audit records cannot be altered.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Attach trigger to blockchain_records table
DROP TRIGGER IF EXISTS trg_immutable_blockchain_records ON blockchain_records;
CREATE TRIGGER trg_immutable_blockchain_records
BEFORE UPDATE OR DELETE ON blockchain_records
FOR EACH ROW
EXECUTE FUNCTION trg_fn_prevent_blockchain_record_tampering();

-- 3. Trigger Function: Prevent deletion of asset versions if confirmed on blockchain
CREATE OR REPLACE FUNCTION trg_fn_prevent_confirmed_version_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_has_blockchain_record INT;
BEGIN
    SELECT COUNT(*) INTO v_has_blockchain_record
    FROM blockchain_records
    WHERE version_id = OLD.version_id;

    IF v_has_blockchain_record > 0 THEN
        RAISE EXCEPTION 'Cannot delete asset version % because it has a confirmed blockchain registration record.', OLD.version_id;
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_confirmed_version ON asset_versions;
CREATE TRIGGER trg_protect_confirmed_version
BEFORE DELETE ON asset_versions
FOR EACH ROW
EXECUTE FUNCTION trg_fn_prevent_confirmed_version_deletion();
