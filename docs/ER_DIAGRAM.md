# ChainProof - Entity-Relationship (ER) Diagram & Architecture

ChainProof implements a normalized relational database design (3NF compliant) tailored for an academic DBMS project. The primary source of truth is PostgreSQL, storing user accounts, categories, asset metadata, cryptographic fingerprints, license agreements, verification logs, disputes, and audit trails.

---

## 1. Entity-Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ASSETS : "registers / authors"
    USERS ||--o{ LICENSES : "issues (creator)"
    USERS ||--o{ LICENSES : "receives (licensee)"
    USERS ||--o{ VERIFICATIONS : "performs"
    USERS ||--o{ DISPUTES : "reports"
    USERS ||--o{ OWNERSHIP_HISTORY : "previous / new claimant"
    USERS ||--o{ AUDIT_LOGS : "triggers"

    CATEGORIES ||--o{ ASSETS : "classifies"

    ASSETS ||--|{ ASSET_VERSIONS : "has versions"
    ASSETS ||--o{ BLOCKCHAIN_RECORDS : "linked records"
    ASSETS ||--o{ LICENSES : "licensed under"
    ASSETS ||--o{ VERIFICATIONS : "verified against"
    ASSETS ||--o{ DISPUTES : "subject of"
    ASSETS ||--o{ OWNERSHIP_HISTORY : "claim transfers"

    ASSET_VERSIONS ||--o{ BLOCKCHAIN_RECORDS : "anchored to block"

    USERS {
        int user_id PK
        string full_name
        string email UK
        string password_hash
        string role
        string account_status
        timestamp created_at
    }

    CATEGORIES {
        int category_id PK
        string category_name UK
        text description
    }

    ASSETS {
        string asset_id PK
        int creator_id FK
        int category_id FK
        string title
        text description
        string original_filename
        string stored_filename UK
        string file_path
        bigint file_size
        string mime_type
        string visibility
        string registration_status
        timestamp created_at
        timestamp registered_at
    }

    ASSET_VERSIONS {
        int version_id PK
        string asset_id FK
        int version_number
        string file_hash
        string hash_algorithm
        string file_path
        timestamp created_at
    }

    BLOCKCHAIN_RECORDS {
        int record_id PK
        string asset_id FK
        int version_id FK
        string transaction_hash UK
        bigint block_number
        string network_name
        string contract_address
        timestamp blockchain_timestamp
        string transaction_status
        timestamp created_at
    }

    LICENSES {
        int license_id PK
        string asset_id FK
        int creator_id FK
        int licensee_id FK
        string license_type
        text description
        timestamp start_date
        timestamp expiry_date
        string status
        timestamp created_at
    }

    VERIFICATIONS {
        int verification_id PK
        int verifier_id FK
        string asset_id FK
        string submitted_hash
        string verification_result
        timestamp verified_at
    }

    DISPUTES {
        int dispute_id PK
        string asset_id FK
        int reporter_id FK
        text description
        string evidence_path
        string dispute_status
        timestamp created_at
        timestamp resolved_at
    }

    OWNERSHIP_HISTORY {
        int history_id PK
        string asset_id FK
        int previous_owner_id FK
        int new_owner_id FK
        string transaction_reference
        timestamp changed_at
    }

    AUDIT_LOGS {
        int log_id PK
        int user_id FK
        string action
        string entity_type
        string entity_id
        text details
        timestamp created_at
    }
```

---

## 2. Cardinality & Relationship Breakdown

1. **USERS to ASSETS (1:N)**: A registered creator user can register zero, one, or multiple digital assets. Each asset is registered by exactly one creator.
2. **CATEGORIES to ASSETS (1:N)**: Each category classifies zero to many assets. Every asset must belong to exactly one category (`ON DELETE RESTRICT`).
3. **ASSETS to ASSET_VERSIONS (1:N)**: Every asset possesses at least one version (`version_number = 1`), with subsequent updates incrementing the version number. Historical versions are preserved.
4. **ASSET_VERSIONS to BLOCKCHAIN_RECORDS (1:1 / 1:N)**: Each confirmed version has a corresponding blockchain transaction record anchoring its cryptographic fingerprint.
5. **ASSETS to LICENSES (1:N)**: A creator can grant multiple licenses (commercial, personal, educational) to different licensee users for a registered asset.
6. **ASSETS to VERIFICATIONS (1:N)**: An asset may be verified zero or multiple times by verifiers submitting files or fingerprints.
7. **ASSETS to DISPUTES (1:N)**: Users can file disputes regarding authorship, unauthorized re-registration, or copyright infringements on an asset.
8. **ASSETS to OWNERSHIP_HISTORY (1:N)**: Any transfer of ownership claim is logged as an immutable history record, preserving complete audit trails.
9. **USERS to AUDIT_LOGS (1:N)**: Critical state transitions (logins, uploads, status changes, dispute reviews) are tracked against user accounts.
