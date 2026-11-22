# ChainProof - REST API Documentation (v1)

Base URL: `http://localhost:8000/api/v1`  
Interactive Swagger UI: `http://localhost:8000/docs`  
ReDoc: `http://localhost:8000/redoc`

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Request Body**:
```json
{
  "full_name": "Alice Developer",
  "email": "alice@chainproof.io",
  "password": "SecurePassword123!",
  "role": "CREATOR"
}
```
- **Responses**:
  - `201 Created`: User successfully registered.
  - `409 Conflict`: Email already in use.
  - `422 Unprocessable Entity`: Validation failure.

### Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Request Body**:
```json
{
  "email": "alice@chainproof.io",
  "password": "SecurePassword123!"
}
```
- **Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "CREATOR",
  "email": "alice@chainproof.io"
}
```

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `200 OK` with User object.

---

## 2. Category Endpoints

### List Categories
- **Method**: `GET`
- **Path**: `/categories`
- **Response**: `200 OK` with array of category objects.

### Create Category (Admin Only)
- **Method**: `POST`
- **Path**: `/categories`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "category_name": "3D Models & CAD",
  "description": "3D meshes, CAD drawings, and architectural blueprints"
}
```

---

## 3. Digital Asset Endpoints

### Register Digital Asset
- **Method**: `POST`
- **Path**: `/assets/register`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (binary file)
  - `title`: `string` (min 2, max 255)
  - `category_id`: `integer`
  - `description`: `string` (optional)
  - `visibility`: `PUBLIC` | `PRIVATE` | `UNLISTED`
- **Response**:
```json
{
  "asset_id": "ast-8f4b2c1e89a0",
  "creator_id": 1,
  "category_id": 1,
  "title": "ChainProof Core Library",
  "description": "Source code asset",
  "original_filename": "main.py",
  "stored_filename": "a1b2c3d4e5f6...py",
  "file_size": 1024,
  "mime_type": "text/x-python",
  "visibility": "PUBLIC",
  "registration_status": "CONFIRMED",
  "created_at": "2026-11-23T00:00:00Z",
  "registered_at": "2026-11-23T00:00:05Z"
}
```

### List Assets
- **Method**: `GET`
- **Path**: `/assets`
- **Query Parameters**:
  - `creator_id`: `integer` (optional)
  - `category_id`: `integer` (optional)
  - `visibility`: `string` (optional)
  - `skip`: `integer` (default 0)
  - `limit`: `integer` (default 50, max 100)

### Get Asset Details
- **Method**: `GET`
- **Path**: `/assets/{asset_id}`
- **Response**: Full asset metadata, including creator information, versions list, and blockchain records.

### Get Asset Versions
- **Method**: `GET`
- **Path**: `/assets/{asset_id}/versions`
- **Response**: List of all versions, containing version number, SHA-256 fingerprint, and timestamp.

### Get Asset Ownership History
- **Method**: `GET`
- **Path**: `/assets/{asset_id}/history`
- **Response**: Complete log of ownership claim events.

---

## 4. Blockchain Endpoints

### Blockchain Status
- **Method**: `GET`
- **Path**: `/blockchain/status`
- **Response**:
```json
{
  "connected": true,
  "rpc_url": "http://127.0.0.1:8545",
  "network_name": "hardhat_local",
  "chain_id": 31337,
  "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "current_block_number": 12
}
```

### Get Blockchain Records for Asset
- **Method**: `GET`
- **Path**: `/blockchain/records/{asset_id}`
- **Response**:
```json
[
  {
    "record_id": 1,
    "transaction_hash": "0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012",
    "block_number": 104520,
    "network_name": "hardhat_local",
    "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "blockchain_timestamp": "2026-11-23T00:00:05Z",
    "transaction_status": "CONFIRMED"
  }
]
```

### Verify Version Fingerprint On-Chain
- **Method**: `GET`
- **Path**: `/blockchain/verify/{version_id}`
- **Response**:
```json
{
  "version_id": 1,
  "asset_id": "ast-8f4b2c1e89a0",
  "version_number": 1,
  "database_fingerprint": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "blockchain_fingerprint": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "blockchain_verification_result": "EXACT_MATCH",
  "is_match": true,
  "is_registered": true,
  "blockchain_timestamp": "2026-11-23T00:00:05Z",
  "contract_address": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  "registrant": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

### Retry Blockchain Submission
- **Method**: `POST`
- **Path**: `/blockchain/retry/{asset_id}?version_number=1`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Response**:
```json
{
  "asset_id": "ast-8f4b2c1e89a0",
  "version_number": 1,
  "status": "CONFIRMED",
  "transaction_hash": "0x8b329a17c0d2e45b128f90c3d4a5b67e890123456789abcdef0123456789abcd",
  "block_number": 104521,
  "blockchain_timestamp": "2026-11-23T00:05:00Z",
  "message": "Blockchain registration successfully confirmed."
}
```

---

## 5. File Verification Endpoints

### Upload File for Exact Match Verification
- **Method**: `POST`
- **Path**: `/verification/exact`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (binary file)
- **Response**:
```json
{
  "verification_id": 1,
  "submitted_filename": "source_code.py",
  "submitted_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
  "verification_result": "EXACT_MATCH",
  "is_match": true,
  "matched_asset": {
    "asset_id": "ast-8f4b2c1e89a0",
    "title": "Pricing Calculation Library",
    "creator_name": "Alice Developer",
    "category_name": "Source Code",
    "registered_at": "2026-11-23T00:00:00Z"
  },
  "matched_version": {
    "version_id": 1,
    "version_number": 1,
    "file_hash": "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3",
    "created_at": "2026-11-23T00:00:00Z"
  },
  "blockchain_verification": {
    "verified": true,
    "transaction_hash": "0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012",
    "block_number": 104520,
    "blockchain_timestamp": "2026-11-23T00:00:05Z",
    "registrant": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  "competing_claim_count": 0,
  "competing_claims": [],
  "verified_at": "2026-11-23T01:00:00Z",
  "legal_disclaimer": "Cryptographic verification confirms exact file integrity and timestamped blockchain registration. It does not independently establish copyright ownership or legal rights."
}
```

### Direct SHA-256 Hash Verification
- **Method**: `POST`
- **Path**: `/verification/hash`
- **Content-Type**: `application/x-www-form-urlencoded`
- **Form Fields**:
  - `submitted_hash`: `string` (64 hexadecimal characters)
- **Response**: Same structured `VerificationResponse` payload as `/verification/exact`.

### Get Verification Record by ID
- **Method**: `GET`
- **Path**: `/verification/{verification_id}`
- **Response**: Details of the audit verification log and results.

---

## 6. Version Management & Ownership Transfer

### Create New Asset Version
- **Method**: `POST`
- **Path**: `/assets/{asset_id}/versions`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: (binary file of updated version)
  - `changelog`: `string` (optional version notes)
- **Response**: `201 Created` with updated `AssetDetailResponse` and new incremental version number registered on blockchain.

### Transfer Registered Ownership Claim
- **Method**: `POST`
- **Path**: `/assets/{asset_id}/transfer-claim`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Request Body**:
```json
{
  "new_creator_id": 2,
  "transfer_reason": "Intellectual property assignment agreement dated Nov 2026",
  "document_reference": "DOC-REF-AGREEMENT-2026-09"
}
```
- **Response**: `200 OK` with updated `AssetDetailResponse`, retaining complete immutable historical claim records in `ownership_history`.

---

## 7. Licensing Management Endpoints

### Issue / Create License
- **Method**: `POST`
- **Path**: `/licenses`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Request Body**:
```json
{
  "asset_id": "ast-8f4b2c1e89a0",
  "licensee_id": 2,
  "license_type": "Commercial",
  "terms": "Worldwide, non-exclusive commercial software deployment right.",
  "start_date": "2026-11-23T00:00:00Z",
  "expiry_date": "2027-11-23T00:00:00Z"
}
```
- **Response**: `201 Created` with `LicenseResponse` object.

### List Licenses
- **Method**: `GET`
- **Path**: `/licenses`
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `asset_id`: `string` (optional)
  - `creator_id`: `integer` (optional)
  - `licensee_id`: `integer` (optional)
  - `status`: `ACTIVE` | `EXPIRED` | `REVOKED` (optional)

### Update License Status (Revoke / Terminate)
- **Method**: `PATCH`
- **Path**: `/licenses/{license_id}/status`
- **Headers**: `Authorization: Bearer <creator_token>`
- **Request Body**:
```json
{
  "status": "REVOKED"
}
```

---

## 8. Dispute Management Endpoints

### Submit Dispute
- **Method**: `POST`
- **Path**: `/disputes`
- **Headers**: `Authorization: Bearer <token>`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `asset_id`: `string`
  - `description`: `string`
  - `evidence_file`: (optional file attachment)
- **Response**: `201 Created` with `DisputeResponse` object in `PENDING` status.

### Review and Resolve Dispute (Admin Only)
- **Method**: `PATCH`
- **Path**: `/disputes/{dispute_id}/resolve`
- **Headers**: `Authorization: Bearer <admin_token>`
- **Request Body**:
```json
{
  "dispute_status": "RESOLVED",
  "resolution_notes": "Prior claim verified by external timestamp evidence and blockchain registration."
}
```

---

## 9. Analytics & Administration

### System Analytics Overview
- **Method**: `GET`
- **Path**: `/analytics/overview`
- **Response**: Platform totals (assets, verified assets, total creators, active licenses, open disputes, verifications).

### Category Distribution
- **Method**: `GET`
- **Path**: `/analytics/categories`
- **Response**: Asset counts grouped by registered category.

### Monthly Registration Trends
- **Method**: `GET`
- **Path**: `/analytics/trends`
- **Response**: Time-series monthly aggregates of registrations.

### Creator Activity Leaderboard
- **Method**: `GET`
- **Path**: `/analytics/creators`
- **Response**: Creators ranked by volume of registered assets and licenses issued.

### Verification Accuracy Statistics
- **Method**: `GET`
- **Path**: `/analytics/verifications`
- **Response**: Ratio of exact matches, unregistered files, and mismatches.

### Admin User & Audit Log Management
- **Method**: `GET /admin/users`: List users with role/status filters.
- **Method**: `GET /admin/assets`: List all assets with version and blockchain metadata.
- **Method**: `GET /admin/disputes`: List open/pending dispute review queue.
- **Method**: `GET /admin/audit-logs`: Query immutable administrative audit logs with filtering.
