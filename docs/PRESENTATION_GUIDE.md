# ChainProof – Academic Presentation & Viva Examination Guide

This document contains:
1. **8–10 Minute Live Demonstration Script**
2. **Academic Presentation Slide Deck Outline**
3. **Comprehensive Viva Examination Questions & Answers (15 Questions)**

---

## 1. Live Demonstration Script (8–10 Minutes)

### Phase 1: Problem Introduction & Architecture (Minutes 0:00 – 1:30)
- **Action**: Open browser at `http://localhost:5173`.
- **Narration**:
  > "Good morning, professors and examiners. Today, digital creators face two major challenges: centralized server timestamps can easily be backdated or manipulated, while naive blockchain solutions misrepresent tokens as legal copyright titles.
  > ChainProof addresses this through a hybrid architecture: an enterprise 3NF PostgreSQL database manages complex metadata, licensing, versions, and disputes, while an EVM Solidity smart contract on Hardhat acts as an immutable, timestamped cryptographic witness.
  > Notice on our landing page the live Hardhat node status badge: Block #104520 is actively connected, and our legal banner clearly establishes that cryptographic proof of existence $\neq$ legal copyright ownership."

### Phase 2: Creator Authentication & Asset Ingestion (Minutes 1:30 – 3:30)
- **Action**: Click "Sign In", click "Creator (Alice)" quick-fill demo button, submit login.
- **Narration**:
  > "We authenticate using JWT HS256 tokens and bcrypt-hashed passwords. In the creator dashboard, Alice can view her personal portfolio.
  > Let's register a new intellectual asset. We navigate to 'Register New IP Asset', select category 'Source Code', title it 'Decentralized Oracle Engine v1.0', and select our file.
  > Notice that our frontend Web Crypto API instantly computes a client-side SHA-256 preview: `a665a459...`.
  > When we submit, FastAPI validates file size and MIME type, streams the file in 64KB chunks to generate the definitive SHA-256 fingerprint, stores the metadata in PostgreSQL, and automatically transmits a signed transaction to our Solidity smart contract `IPRegistry.sol`."
- **Action**: Show success confirmation modal with the confirmed Transaction Hash, Block Number, and Contract Address.

### Phase 3: Cryptographic File Verification (Minutes 3:30 – 5:00)
- **Action**: Navigate to `/verify` in an incognito window (unauthenticated public verification).
- **Test 1 (Exact Match)**:
  - Upload the identical file.
  - **Result**: Immediate Green **EXACT MATCH** banner, displaying Alice's registered title, matching version number, on-chain block timestamp, transaction hash, and statutory legal disclaimer.
- **Test 2 (Tampered / Modified File)**:
  - Open the file in Notepad, add a single punctuation character (`# modified`), save, and upload.
  - **Result**: Immediate Amber **FINGERPRINT NOT FOUND IN REGISTRY** banner.
  - **Narration**:
    > "Demonstrating the cryptographic avalanche effect: altering even a single bit in the file completely changes the SHA-256 digest, preventing tampered files from claiming false registration."
- **Test 3 (Competing Claims Demonstration)**:
  - Verify `IPRegistry.sol` (which Bob also submitted later).
  - **Result**: The UI surfaces the **Competing Claims Notice** showing Alice's prior registration 30 days ago and Bob's subsequent registration 15 days ago.
  - **Narration**:
    > "ChainProof does not discard duplicate submissions. Both claims are preserved with distinct blockchain timestamps, providing objective evidence of who possessed the file first."

### Phase 4: Version Progression & Ownership Claims (Minutes 5:00 – 6:30)
- **Action**: Return to Alice's Asset Details page (`/assets/ast-8f4b2c1e-001`).
- **Narration**:
  > "Digital assets evolve. Alice can click 'New Version' to upload an updated release. The system automatically queries `MAX(version_number) + 1`, generates a new SHA-256 fingerprint, and registers Version 2 on the blockchain while preserving Version 1 immutably.
  > Next, Alice can transfer her registered claim using 'Transfer Claim'. This writes an audit record into `ownership_history` while atomically updating the current claimant in PostgreSQL."

### Phase 5: Licensing, Disputes, & Administrator Portal (Minutes 6:30 – 8:00)
- **Action**: Log in as `admin@chainproof.io`.
- **Narration**:
  > "Under 'License Management', creators issue Commercial, Educational, or Personal licenses with automated expiration dates.
  > Creators can also file disputes with attached evidence files.
  > As Administrator, we access the protected Admin Portal (`/admin`). Here we review the Dispute Queue, inspect evidence, and record formal resolution findings.
  > We can also inspect the immutable platform `audit_logs` table, which captures every registration, verification, and status change."

### Phase 6: Database Analytics & Conclusion (Minutes 8:00 – 9:30)
- **Action**: Navigate to `/analytics`.
- **Narration**:
  > "All analytics shown here are computed in real time from PostgreSQL queries:
  > - Assets by category using Recharts bar charts.
  > - Verification outcome ratios (exact matches vs. unregistrations vs. mismatches) via pie charts.
  > - Monthly registration time-series using SQL CTEs.
  > In conclusion, ChainProof achieves a balanced synergy between relational DBMS integrity and blockchain immutability, establishing a realistic foundation for digital IP protection."

---

## 2. Academic Slide Deck Outline

- **Slide 1: Title Slide**:
  - Title: ChainProof: Blockchain-Based Digital Intellectual Property Registration and Verification System
  - Presenter Name, Department, Academic Year, Guide/Supervisor Name
- **Slide 2: Problem Statement & Motivation**:
  - Centralized timestamp vulnerability
  - Legal confusion around blockchain NFTs
  - Lack of multi-version provenance in digital assets
- **Slide 3: Hybrid Architecture Overview**:
  - Diagram showing React Frontend $\to$ FastAPI Backend $\to$ PostgreSQL 3NF DBMS $\leftrightarrow$ Solidity Smart Contract (Hardhat EVM)
- **Slide 4: Cryptographic Fingerprinting & Avalanche Effect**:
  - SHA-256 mathematical properties, chunked streaming ingestion
  - Formula: $\text{Digest} = \text{SHA-256}(\text{FileByteStream})$
- **Slide 5: Smart Contract Design (`IPRegistry.sol`)**:
  - Nested mapping: `registry[keccak256(assetId)][versionNumber]`
  - Zero-gas view verification: `verifyFingerprint()`
  - Competing claim timestamping
- **Slide 6: Database Architecture & 3NF Normalization**:
  - 10 Relational tables, candidate keys, foreign key constraints
  - Elimination of insertion, update, and deletion anomalies
- **Slide 7: Advanced DBMS Demonstrations**:
  - Multi-table JOINs, correlated subqueries, window functions, CTEs
  - Triggers for immutable audit trails and status transitions
  - ACID transaction savepoints and rollbacks
- **Slide 8: Key Features & Verification Outcomes**:
  - Dual-mode verification (File vs. Hash)
  - Outcome classification: `EXACT_MATCH`, `NOT_REGISTERED`, `BLOCKCHAIN_VERIFICATION_FAILED`
  - Version progression lifecycle
- **Slide 9: Security, Reliability, & Legal Boundaries**:
  - Bcrypt hashing, JWT authorization, path traversal sanitization
  - Explicit distinction: Cryptographic proof of existence $\neq$ copyright ownership
- **Slide 10: Conclusion & Future Scope**:
  - Ethereum Layer 2 integration, Zero-Knowledge Proofs (ZKP), decentralized identity (DID)

---

## 3. Comprehensive Viva Voce Questions & Answers

### Q1: Why did you use a hybrid database-blockchain architecture instead of storing all data on the blockchain?
**Answer**:
> "Storing large files or rich relational metadata on a blockchain is prohibitively expensive and computationally inefficient. On Ethereum, storing 1 MB of raw data can cost tens of thousands of dollars in gas and degrades network scalability. Furthermore, blockchains lack indexing, sorting, aggregation, and relational querying capabilities.
> In ChainProof, we store only a 32-byte SHA-256 fingerprint on-chain, which costs minimal gas and provides permanent, tamper-proof proof of existence. All complex relational data (users, categories, licensing agreements, dispute evidence, and version trees) is managed in a 3NF PostgreSQL database, optimizing performance, cost, and query flexibility."

### Q2: Does blockchain registration prove that a user is the legal copyright owner of an asset?
**Answer**:
> "No. Blockchain registration proves **cryptographic possession of a specific digital bitstream at a verifiable point in time**; it does not independently prove original authorship or legal copyright title. If an unauthorized party uploads someone else's unreleased manuscript, the blockchain will record their possession timestamp, but it does not grant legal copyright.
> ChainProof explicitly highlights this distinction throughout the UI and API, providing timestamp evidence to support legal proceedings without claiming to replace statutory copyright law."

### Q3: How does ChainProof handle competing claims where two different creators upload the exact same file?
**Answer**:
> "Rather than silently rejecting or overwriting subsequent submissions, ChainProof preserves both claims. In PostgreSQL, each creator receives a distinct `asset_id` referencing the identical `file_hash`. In `IPRegistry.sol`, both transactions are mined into distinct blocks.
> When a verifier uploads that file, the verification service identifies multiple claims, displays `competing_claim_count: 1`, and presents both registrations chronologically. Because blockchain timestamps are immutable and cryptographically ordered, the true prior claimant can be proven objectively."

### Q4: Explain the normalization level of your database. Why is it in 3NF?
**Answer**:
> "Our database satisfies Third Normal Form (3NF):
> 1. **1NF**: All attributes are atomic and indivisible; no multi-valued attributes or repeating groups exist.
> 2. **2NF**: It is in 1NF, and every non-key attribute is fully functionally dependent on the primary key. In `asset_versions`, attributes depend on the composite key `(asset_id, version_number)`.
> 3. **3NF**: It is in 2NF, and there are no transitive dependencies. For example, creator details (name, email) are not stored in the `assets` table; `assets` references `creator_id`, and creator attributes reside strictly in `users`."

### Q5: How do you prevent SQL injection and Path Traversal attacks?
**Answer**:
> "1. **SQL Injection**: We use SQLAlchemy ORM and parameterized queries for all database transactions. User inputs are never concatenated directly into raw SQL strings.
> 2. **Path Traversal**: When files are uploaded, their original names are discarded for storage purposes. The file is saved using a cryptographically random UUID (`uuid4().hex + safe_extension`), preventing attackers from submitting relative directory sequences such as `../../etc/passwd`."

### Q6: What happens if the blockchain node goes down or network latency causes a transaction timeout?
**Answer**:
> "ChainProof isolates database transactions from blockchain submissions. If the Web3 RPC node is offline or times out, the asset registration in PostgreSQL commits with a `PENDING` status. The system does not crash or leave partial state.
> The backend and frontend provide an idempotent retry endpoint (`POST /blockchain/retry/{asset_id}`) that can be invoked once connectivity is restored, ensuring no duplicate database records are created."

### Q7: What is the Avalanche Effect in hashing, and how does ChainProof demonstrate it?
**Answer**:
> "The avalanche effect is a fundamental property of cryptographic hash functions like SHA-256 where modifying a single bit in the input produces a completely uncorrelated, unpredictable change in the output digest (typically affecting over 50% of the bits).
> In ChainProof, we demonstrate this during verification: if a user uploads an original document, it matches with 100% accuracy (`EXACT_MATCH`). If even a single whitespace or punctuation mark is altered, the generated SHA-256 digest is entirely different, returning `NOT_REGISTERED`."

### Q8: How is password hashing handled, and why not use plain MD5 or SHA-256?
**Answer**:
> "We use `bcrypt` via the `passlib` cryptographic library. Simple SHA-256 or MD5 hashes are vulnerable to rainbow table lookups and brute-force GPU attacks because they are designed to be fast. `bcrypt` incorporates automatic salt generation and an adaptive work factor (cost parameter) that intentionally slows down hash computation, providing strong resistance against modern parallelized cracking."

### Q9: Explain the purpose and implementation of the database triggers in ChainProof.
**Answer**:
> "We implemented three PostgreSQL triggers:
> 1. `trg_asset_status_change`: Automatically inserts an audit record into `audit_logs` whenever an asset transitions between `PENDING`, `CONFIRMED`, or `FAILED`.
> 2. `trg_immutable_blockchain_records`: Prevents `UPDATE` or `DELETE` operations on `blockchain_records`, throwing a PL/pgSQL exception if tampering is attempted.
> 3. `trg_protect_confirmed_version`: Prevents deletion of any `asset_versions` record that already possesses a confirmed on-chain transaction hash."

### Q10: What are Window Functions, and where did you use them in this project?
**Answer**:
> "Window functions perform calculations across a set of table rows that are related to the current row, without collapsing the rows into a single group like `GROUP BY` does.
> In our DBMS demonstration query #12, we use `ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY version_number ASC)` to dynamically calculate the chronological sequence of version iterations within each asset while simultaneously returning individual version hashes and timestamps."

### Q11: How does ChainProof manage versioning, and why not just overwrite old files?
**Answer**:
> "Overwriting files destroys historical provenance and breaks on-chain verification for earlier releases.
> In ChainProof, each digital asset has a 1-to-Many relationship with `asset_versions`. When version 2 is uploaded, it receives a new `version_id`, an incremented `version_number`, and a unique SHA-256 fingerprint anchored in a new blockchain transaction. Previous versions remain permanently available and verifiable."

### Q12: How are Common Table Expressions (CTEs) utilized in your analytics queries?
**Answer**:
> "A CTE (using the `WITH` clause) creates a temporary, named result set that can be referenced within a subsequent `SELECT` statement.
> In query #11, we use a CTE to first normalize creation dates using `DATE_TRUNC('month', created_at)` and project file sizes. The outer query then groups by the truncated month and applies conditional aggregation (`COUNT(*) FILTER (WHERE registration_status = 'CONFIRMED')`), providing a clean, readable, and optimized two-stage monthly breakdown."

### Q13: How does the licensing module distinguish between active and expired licenses?
**Answer**:
> "Licenses maintain a relational `status` attribute (`ACTIVE`, `EXPIRED`, `REVOKED`) along with `start_date` and `expiry_date` timestamps.
> In addition to physical status column values, our SQL view `view_licensing_summary` computes a real-time dynamic status using a `CASE` statement: if `expiry_date < CURRENT_TIMESTAMP`, it dynamically classifies the computed status as `EXPIRED`, ensuring that expired permissions are immediately visible even before a scheduled batch update."

### Q14: What is the purpose of the Solidity event `AssetRegistered`?
**Answer**:
> "In Ethereum, events are efficient, low-cost data structures stored in transaction receipts rather than in contract storage variables.
> By emitting `event AssetRegistered(string indexed assetId, uint256 indexed versionNumber, string fingerprint, uint256 timestamp, address registrant)`, external off-chain indexers and Web3.py listeners can subscribe to registration logs and audit the blockchain without paying gas to read storage variables."

### Q15: If an attacker modifies an asset fingerprint directly inside PostgreSQL, how does ChainProof detect it?
**Answer**:
> "ChainProof implements cross-layer verification. When a user verifies a file or asset, the system reads the fingerprint from PostgreSQL and simultaneously queries the smart contract via `verifyFingerprint(assetId, versionNumber, expectedFingerprint)`.
> If an attacker maliciously altered the hash inside PostgreSQL, the on-chain view call fails the equality check, and the system raises a `BLOCKCHAIN_VERIFICATION_FAILED` alert, demonstrating how the blockchain serves as an immutable watchdog over the database."
