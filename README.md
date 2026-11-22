# ChainProof
## Blockchain-Based Digital Intellectual Property Registration and Verification System

ChainProof is a Digital Intellectual Property Registry enabling creators to register digital works, generate deterministic SHA-256 cryptographic fingerprints, establish timestamped blockchain verification records, manage multi-version releases, issue licensing permissions, and maintain transparent ownership claims.

This is an academic DBMS application demonstrating practical relational database architecture (3NF), robust integrity constraints, and genuine blockchain integration.

---

## Current Status: Phase 1, Phase 2 & Phase 3 Completed

- [x] **Phase 1 – Database and Backend Foundation** (Completed)
- [x] **Phase 2 – Blockchain Integration** (Completed)
- [x] **Phase 3 – Complete Application Functionality** (Completed - Verification, Versioning, Licensing, Ownership History, Disputes, Analytics, Audit Logs)
- [ ] **Phase 4 – Frontend Dashboard** (React, Vite, Tailwind CSS)
- [ ] **Phase 5 – Final Testing and Academic Package**

---

## 1. System Architecture

```
ChainProof/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application & lifecycle startup
│   │   ├── core/                # Configuration, security, dependencies
│   │   ├── database/            # Session, declarative Base, ORM models (10 normalized tables)
│   │   ├── schemas/             # Pydantic v2 validation schemas
│   │   ├── api/v1/              # API routes (auth, categories, assets, blockchain, verification, licenses, disputes, analytics, admin)
│   │   ├── services/            # Business logic (hashing, storage, auth, assets, blockchain, verification, licensing, disputes, ownership, analytics)
│   │   ├── repositories/        # Database access layer
│   │   └── utils/               # File validation and safe naming
│   ├── alembic/                 # Database migration scripts
│   ├── tests/                   # Automated pytest test suite (39 tests)
│   ├── uploads/                 # Protected file storage
│   └── requirements.txt
├── blockchain/                  # Solidity & Hardhat environment
│   ├── contracts/
│   │   └── IPRegistry.sol       # Solidity smart contract
│   ├── scripts/
│   │   └── deploy.js            # Deployment & ABI export script
│   ├── test/
│   │   └── IPRegistry.test.js   # 11 Hardhat unit tests
│   ├── hardhat.config.js        # Hardhat configuration
│   └── package.json
├── database/                    # Pure PostgreSQL SQL scripts
│   ├── schema.sql               # DDL with constraints, keys & indexes
│   ├── views.sql                # Analytical and operational database views
│   ├── functions.sql            # Stored functions and procedures
│   ├── triggers.sql             # Audit and immutability triggers
│   ├── sample_data.sql          # Seed dataset (users, categories, assets)
│   └── demonstration_queries.sql# Academic DBMS demonstration queries
├── docs/                        # Technical documentation
│   ├── ER_DIAGRAM.md            # Mermaid ER diagram & cardinality breakdown
│   ├── DATABASE_DESIGN.md       # Normalization analysis up to 3NF & ACID properties
│   ├── API_DOCUMENTATION.md     # REST endpoint contracts & payloads
│   └── SETUP_GUIDE.md           # Setup and running instructions
├── docker-compose.yml           # PostgreSQL container setup
├── .env.example                 # Environment configuration template
└── README.md
```

---

## 2. Technology Stack

- **Backend**: Python 3.10+ / FastAPI, Pydantic v2
- **ORM & Migrations**: SQLAlchemy 2.0, Alembic
- **Database**: PostgreSQL (with SQLite zero-config local development compatibility)
- **Blockchain**: Solidity (`^0.8.20`), Hardhat, local Ethereum RPC node, Web3.py
- **Security**: JWT (`PyJWT`), `bcrypt` password hashing, RBAC (`CREATOR`, `VERIFIER`, `ADMINISTRATOR`)
- **Cryptography**: SHA-256 chunked streaming fingerprint generation (`hashlib`)
- **Testing**: `pytest`, `httpx`, `chai`, `ethers`

---

## 3. Blockchain Architecture (IPRegistry.sol)

The `IPRegistry` smart contract provides:
1. `registerAsset(string assetId, uint256 versionNumber, string fingerprint)`:
   - Records cryptographic SHA-256 digest on-chain.
   - Anchors block number, block timestamp, and caller address.
   - Prevents duplicate registration of the same asset version (`assetId + versionNumber`).
   - Emits `AssetRegistered` event.
2. `getRecord(string assetId, uint256 versionNumber)`:
   - Reads registered record by asset ID and version number.
3. `verifyFingerprint(string assetId, uint256 versionNumber, string expectedFingerprint)`:
   - Public read-only verification comparing submitted hash with on-chain record.
4. Competing Claim Preservation:
   - Independent creators can register separate asset claims containing identical fingerprints. Both timestamps are preserved on-chain to determine prior claim objectively.

---

## 4. Setup and Execution

### 1. Configure Environment
```bash
cp .env.example .env
```

### 2. Blockchain Setup
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
```
To run local blockchain node & deploy:
```bash
# Terminal 1: Run local node
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

### 3. Backend Setup & Migrations
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
```

### 4. Launch Backend
```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Interactive API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 5. Run Test Suites
```bash
# Backend & integration tests (27 tests)
cd backend
python -m pytest -v

# Smart contract tests (11 tests)
cd blockchain
npx hardhat test
```
**Total: 38 automated tests (100% passing).**
