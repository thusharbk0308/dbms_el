# ChainProof - Database Design & Normalization Specifications

## 1. Relational Schema Architecture

ChainProof utilizes PostgreSQL as its primary transactional database. The schema is normalized up to Third Normal Form (3NF) to eliminate data redundancy, prevent update anomalies, and maintain strict referential integrity.

---

## 2. Normalization Analysis

### First Normal Form (1NF)
- **Atomic Values**: Every table attribute contains atomic, indivisible values. No repeating groups or arrays are stored in core relational columns.
- **Unique Identification**: Every table defines an explicit primary key (`user_id`, `category_id`, `asset_id`, `version_id`, etc.).

### Second Normal Form (2NF)
- **Full Functional Dependency**: All non-key attributes are fully dependent on the entire primary key. In `ASSET_VERSIONS`, where the natural key could be `(asset_id, version_number)`, a surrogate primary key `version_id` is used alongside a unique constraint `uq_asset_version`. All attributes (`file_hash`, `file_path`, `created_at`) depend on `version_id`.

### Third Normal Form (3NF)
- **Elimination of Transitive Dependencies**: Non-key attributes depend only on the primary key, not on other non-key attributes.
  - Creator metadata (e.g., creator's name, email) is not repeated in `ASSETS`; instead, `creator_id` references `USERS`.
  - Category descriptions are maintained exclusively in `CATEGORIES`, referenced via `category_id`.
  - Blockchain transaction details (e.g., `block_number`, `contract_address`, `network_name`) reside in `BLOCKCHAIN_RECORDS` rather than bloating `ASSETS` or `ASSET_VERSIONS`.

---

## 3. Referential Integrity and Deletion Rules

| Parent Table | Child Table | Foreign Key | Action on Delete | Rationale |
| :--- | :--- | :--- | :--- | :--- |
| `USERS` | `ASSETS` | `creator_id` | `RESTRICT` | Creators with registered assets cannot be deleted to protect integrity of historical registrations. |
| `CATEGORIES` | `ASSETS` | `category_id` | `RESTRICT` | Prevents deletion of active categories containing digital assets. |
| `ASSETS` | `ASSET_VERSIONS` | `asset_id` | `CASCADE` | If an unconfirmed draft asset is purged, its version records are cleared. |
| `ASSETS` | `BLOCKCHAIN_RECORDS` | `asset_id` | `RESTRICT` | Confirmed blockchain audit records cannot be orphaned. |
| `ASSET_VERSIONS` | `BLOCKCHAIN_RECORDS` | `version_id` | `RESTRICT` | Version records anchored to a block cannot be deleted. |
| `USERS` | `VERIFICATIONS` | `verifier_id` | `SET NULL` | Verification records remain valid historical evidence even if a verifier account is removed. |
| `USERS` | `AUDIT_LOGS` | `user_id` | `SET NULL` | Audit logs persist permanently regardless of user account lifecycle. |

---

## 4. Performance Indexes

- `idx_users_email`: High-speed B-tree index for credential lookup during authentication.
- `idx_assets_creator_id`: Accelerated filtering for creator dashboard asset queries.
- `idx_assets_status`: Rapid filtering for pending vs confirmed asset processing.
- `idx_asset_versions_file_hash`: Indexed SHA-256 hex string enabling $O(1)$ duplicate fingerprint detection and instant verification.
- `idx_blockchain_records_tx_hash`: Unique index for fast Ethereum/Hardhat transaction receipt lookups.
- `idx_audit_logs_entity`: Composite index `(entity_type, entity_id)` for tracing the audit history of specific assets or users.

---

## 5. ACID Compliance & Transaction Boundaries

1. **Atomicity**: During asset upload, file persistence, asset metadata creation, version record generation, ownership claim logging, and audit tracking are executed inside an atomic transaction. If database insertion fails, the uploaded file is discarded from disk and all changes are rolled back.
2. **Consistency**: Check constraints (`file_size > 0`, `version_number >= 1`, `expiry_date >= start_date`, status enumerations) guarantee that invalid data is rejected at the database level.
3. **Isolation**: PostgreSQL `READ COMMITTED` default isolation level prevents dirty reads. Savepoints are supported for staged rollback workflows.
4. **Durability**: All committed transactions are written to write-ahead logs (WAL) prior to confirmation.
