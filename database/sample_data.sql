-- ============================================================================
-- ChainProof - Sample Demonstration Data
-- Seeds 1 Administrator, 1 Verifier, 5 Creators, Categories, Assets, Versions,
-- Licenses, Disputes, Verifications, and Audit Logs
-- Passwords are hashed with bcrypt for "ChainProof2026!"
-- ============================================================================

-- 1. SEED CATEGORIES
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Source Code', 'Application software, smart contracts, backend scripts, algorithms'),
(2, 'Digital Art & Photography', 'Illustrations, UI designs, photographs, 3D renderings'),
(3, 'Documents & Research', 'Research papers, whitepapers, design specifications, technical documentation'),
(4, 'Music & Audio', 'Podcasts, synthesized audio, musical compositions'),
(5, 'Legal & Contracts', 'Standardized agreements, corporate bylaws, licensing templates')
ON CONFLICT (category_name) DO NOTHING;

-- 2. SEED USERS
-- bcrypt hash for "Password@123": $2b$12$e86gS7i2lR.z6K1Nn2tKMeWb2G1M94T6j3FvK4E5q.7tQx31lR/V6
INSERT INTO users (user_id, full_name, email, password_hash, role, account_status) VALUES
(1, 'System Administrator', 'admin@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'ADMINISTRATOR', 'ACTIVE'),
(2, 'Official File Verifier', 'verifier@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'VERIFIER', 'ACTIVE'),
(3, 'Alice Developer', 'alice@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'CREATOR', 'ACTIVE'),
(4, 'Bob Designer', 'bob@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'CREATOR', 'ACTIVE'),
(5, 'Carol Researcher', 'carol@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'CREATOR', 'ACTIVE'),
(6, 'David Musician', 'david@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'CREATOR', 'ACTIVE'),
(7, 'Elena Architect', 'elena@chainproof.io', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4L/qXFk8ve', 'CREATOR', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Reset sequence if needed
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('categories_category_id_seq', (SELECT MAX(category_id) FROM categories));

-- 3. SEED ASSETS
INSERT INTO assets (asset_id, creator_id, category_id, title, description, original_filename, stored_filename, file_path, file_size, mime_type, visibility, registration_status, created_at, registered_at) VALUES
('ast-8f4b2c1e-001', 3, 1, 'ChainProof Core Smart Contract', 'Solidity contract for decentralized intellectual property fingerprinting', 'IPRegistry.sol', 'ast-8f4b2c1e-001_IPRegistry.sol', 'uploads/ast-8f4b2c1e-001_IPRegistry.sol', 8192, 'text/plain', 'PUBLIC', 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '30 days'),
('ast-9a3c4d2f-002', 3, 1, 'Distributed Consensus Algorithm', 'Python implementation of Byzantine Fault Tolerance algorithm', 'bft_consensus.py', 'ast-9a3c4d2f-002_bft_consensus.py', 'uploads/ast-9a3c4d2f-002_bft_consensus.py', 16384, 'text/x-python', 'PUBLIC', 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '25 days', CURRENT_TIMESTAMP - INTERVAL '25 days'),
('ast-3e7b1a5d-003', 4, 2, 'Cyberpunk Digital Canvas 2026', 'High-resolution digital illustration rendered with raytracing', 'cyberpunk_city.png', 'ast-3e7b1a5d-003_cyberpunk_city.png', 'uploads/ast-3e7b1a5d-003_cyberpunk_city.png', 4194304, 'image/png', 'PUBLIC', 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
('ast-7a2b9c1d-006', 4, 1, 'Distributed Registry Contract Derivative', 'Independent claim containing identical smart contract file submitted at a later date', 'IPRegistry_fork.sol', 'ast-7a2b9c1d-006_IPRegistry_fork.sol', 'uploads/ast-7a2b9c1d-006_IPRegistry_fork.sol', 8192, 'text/plain', 'PUBLIC', 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('ast-5d2f8c4b-004', 5, 3, 'Quantum Cryptography Whitepaper', 'Academic research paper on post-quantum lattice-based digital signatures', 'quantum_crypto.pdf', 'ast-5d2f8c4b-004_quantum_crypto.pdf', 'uploads/ast-5d2f8c4b-004_quantum_crypto.pdf', 2097152, 'application/pdf', 'PUBLIC', 'CONFIRMED', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP - INTERVAL '15 days'),
('ast-6e1a9c3d-005', 6, 4, 'Symphony in Blockchain No. 1', 'Original electronic ambient track composed for digital rights demonstration', 'symphony_no1.wav', 'ast-6e1a9c3d-005_symphony_no1.wav', 'uploads/ast-6e1a9c3d-005_symphony_no1.wav', 12582912, 'audio/x-wav', 'PUBLIC', 'PENDING', CURRENT_TIMESTAMP - INTERVAL '2 days', NULL)
ON CONFLICT (asset_id) DO NOTHING;

-- 4. SEED ASSET VERSIONS
INSERT INTO asset_versions (version_id, asset_id, version_number, file_hash, hash_algorithm, file_path, created_at) VALUES
(1, 'ast-8f4b2c1e-001', 1, 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'SHA-256', 'uploads/ast-8f4b2c1e-001_v1.sol', CURRENT_TIMESTAMP - INTERVAL '30 days'),
(2, 'ast-8f4b2c1e-001', 2, 'b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78', 'SHA-256', 'uploads/ast-8f4b2c1e-001_v2.sol', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(3, 'ast-9a3c4d2f-002', 1, '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'SHA-256', 'uploads/ast-9a3c4d2f-002_v1.py', CURRENT_TIMESTAMP - INTERVAL '25 days'),
(4, 'ast-3e7b1a5d-003', 1, 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 'SHA-256', 'uploads/ast-3e7b1a5d-003_v1.png', CURRENT_TIMESTAMP - INTERVAL '20 days'),
(7, 'ast-7a2b9c1d-006', 1, 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'SHA-256', 'uploads/ast-7a2b9c1d-006_fork.sol', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(5, 'ast-5d2f8c4b-004', 1, 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', 'SHA-256', 'uploads/ast-5d2f8c4b-004_v1.pdf', CURRENT_TIMESTAMP - INTERVAL '15 days'),
(6, 'ast-6e1a9c3d-005', 1, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'SHA-256', 'uploads/ast-6e1a9c3d-005_v1.wav', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (version_id) DO NOTHING;

SELECT setval('asset_versions_version_id_seq', (SELECT MAX(version_id) FROM asset_versions));

-- 5. SEED BLOCKCHAIN RECORDS
INSERT INTO blockchain_records (record_id, asset_id, version_id, transaction_hash, block_number, network_name, contract_address, blockchain_timestamp, transaction_status) VALUES
(1, 'ast-8f4b2c1e-001', 1, '0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012', 104520, 'hardhat_local', '0x5FbDB2315678afecb367f032d93F642f64180aa3', CURRENT_TIMESTAMP - INTERVAL '30 days', 'CONFIRMED'),
(2, 'ast-8f4b2c1e-001', 2, '0x8b329a17c0d2e45b128f90c3d4a5b67e890123456789abcdef0123456789abcd', 104980, 'hardhat_local', '0x5FbDB2315678afecb367f032d93F642f64180aa3', CURRENT_TIMESTAMP - INTERVAL '10 days', 'CONFIRMED'),
(3, 'ast-9a3c4d2f-002', 3, '0x1c983a7f80b2d34e56c7a890123456789abcdef0123456789abcdef012345678', 104610, 'hardhat_local', '0x5FbDB2315678afecb367f032d93F642f64180aa3', CURRENT_TIMESTAMP - INTERVAL '25 days', 'CONFIRMED'),
(4, 'ast-3e7b1a5d-003', 4, '0x7e890123456789abcdef0123456789abcdef0123456789abcdef0123456789ab', 104750, 'hardhat_local', '0x5FbDB2315678afecb367f032d93F642f64180aa3', CURRENT_TIMESTAMP - INTERVAL '20 days', 'CONFIRMED'),
(5, 'ast-5d2f8c4b-004', 5, '0x3456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012', 104890, 'hardhat_local', '0x5FbDB2315678afecb367f032d93F642f64180aa3', CURRENT_TIMESTAMP - INTERVAL '15 days', 'CONFIRMED')
ON CONFLICT (record_id) DO NOTHING;

SELECT setval('blockchain_records_record_id_seq', (SELECT MAX(record_id) FROM blockchain_records));

-- 6. SEED LICENSES
INSERT INTO licenses (license_id, asset_id, creator_id, licensee_id, license_type, description, start_date, expiry_date, status) VALUES
(1, 'ast-8f4b2c1e-001', 3, 4, 'Commercial', 'Commercial software licensing for decentralized marketplace integration', CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP + INTERVAL '345 days', 'ACTIVE'),
(2, 'ast-3e7b1a5d-003', 4, 5, 'Educational', 'Academic research usage for computer graphics symposium publication', CURRENT_TIMESTAMP - INTERVAL '15 days', CURRENT_TIMESTAMP + INTERVAL '165 days', 'ACTIVE'),
(3, 'ast-9a3c4d2f-002', 3, 6, 'Personal', 'Non-commercial personal hobbyist development usage', CURRENT_TIMESTAMP - INTERVAL '60 days', CURRENT_TIMESTAMP - INTERVAL '10 days', 'EXPIRED')
ON CONFLICT (license_id) DO NOTHING;

SELECT setval('licenses_license_id_seq', (SELECT MAX(license_id) FROM licenses));

-- 7. SEED VERIFICATIONS
INSERT INTO verifications (verification_id, verifier_id, asset_id, submitted_hash, verification_result, verified_at) VALUES
(1, 2, 'ast-8f4b2c1e-001', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'EXACT_MATCH', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(2, 2, 'ast-3e7b1a5d-003', 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 'EXACT_MATCH', CURRENT_TIMESTAMP - INTERVAL '3 days'),
(3, NULL, NULL, 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'NOT_REGISTERED', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (verification_id) DO NOTHING;

SELECT setval('verifications_verification_id_seq', (SELECT MAX(verification_id) FROM verifications));

-- 8. SEED DISPUTES
INSERT INTO disputes (dispute_id, asset_id, reporter_id, description, evidence_path, dispute_status) VALUES
(1, 'ast-3e7b1a5d-003', 5, 'Claiming partial conceptual overlap in digital canvas background geometry', 'uploads/evidence_dispute_1.pdf', 'UNDER_REVIEW')
ON CONFLICT (dispute_id) DO NOTHING;

SELECT setval('disputes_dispute_id_seq', (SELECT MAX(dispute_id) FROM disputes));

-- 9. SEED AUDIT LOGS
INSERT INTO audit_logs (log_id, user_id, action, entity_type, entity_id, details) VALUES
(1, 3, 'REGISTER_ASSET', 'ASSET', 'ast-8f4b2c1e-001', 'Asset registered and initial SHA-256 fingerprint generated'),
(2, 3, 'BLOCKCHAIN_CONFIRMED', 'BLOCKCHAIN_RECORD', '0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012', 'Smart contract event emitted on block 104520'),
(3, 4, 'REGISTER_ASSET', 'ASSET', 'ast-3e7b1a5d-003', 'Digital art uploaded and submitted for confirmation')
ON CONFLICT (log_id) DO NOTHING;

SELECT setval('audit_logs_log_id_seq', (SELECT MAX(log_id) FROM audit_logs));
