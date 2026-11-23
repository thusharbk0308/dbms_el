"""
ChainProof - Repeatable Academic Demo Seeder
Seeds Users (Admin, Verifier, Creators), Categories, Assets, Versions,
Blockchain Records, Licenses, Disputes, Verifications, and Ownership History.
Includes multi-version assets and competing fingerprint claims.
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.database.session import SessionLocal, engine
from app.database.models import (
    Base,
    User,
    Category,
    Asset,
    AssetVersion,
    BlockchainRecord,
    License,
    Verification,
    Dispute,
    OwnershipHistory,
    AuditLog,
)
from app.core.security import get_password_hash

def seed():
    print("=" * 60)
    print("ChainProof: Seeding Academic Demonstration Dataset")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Categories
        categories_data = [
            (1, "Source Code", "Application software, smart contracts, backend scripts, algorithms"),
            (2, "Digital Art & Photography", "Illustrations, UI designs, photographs, 3D renderings"),
            (3, "Documents & Research", "Research papers, whitepapers, design specifications, technical documentation"),
            (4, "Music & Audio", "Podcasts, synthesized audio, musical compositions"),
            (5, "Legal & Contracts", "Standardized agreements, corporate bylaws, licensing templates"),
        ]
        for cat_id, name, desc in categories_data:
            existing = db.query(Category).filter((Category.category_id == cat_id) | (Category.category_name == name)).first()
            if not existing:
                db.add(Category(category_id=cat_id, category_name=name, description=desc))
        db.commit()
        print("✓ Categories seeded.")

        # 2. Users (Admin, Verifier, 3 Creators)
        # Default password for all demo accounts: SecurePassword123!
        demo_password_hash = get_password_hash("SecurePassword123!")

        users_data = [
            (1, "System Administrator", "admin@chainproof.io", "ADMINISTRATOR"),
            (2, "Official File Verifier", "verifier@chainproof.io", "VERIFIER"),
            (3, "Alice Developer", "alice@chainproof.io", "CREATOR"),
            (4, "Bob Designer", "bob@chainproof.io", "CREATOR"),
            (5, "Carol Researcher", "carol@chainproof.io", "CREATOR"),
        ]
        for u_id, name, email, role in users_data:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                db.add(User(
                    user_id=u_id,
                    full_name=name,
                    email=email,
                    password_hash=demo_password_hash,
                    role=role,
                    account_status="ACTIVE"
                ))
        db.commit()
        print("✓ Users seeded (admin, verifier, 3 creators).")

        now = datetime.now(timezone.utc)

        # 3. Assets & Versions
        # Asset 1: Alice's Core Library (Multi-version: v1 and v2)
        hash_v1 = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3"
        hash_v2 = "b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78"

        if not db.query(Asset).filter(Asset.asset_id == "ast-8f4b2c1e-001").first():
            a1 = Asset(
                asset_id="ast-8f4b2c1e-001",
                creator_id=3,  # Alice
                category_id=1,
                title="ChainProof Core Smart Contract",
                description="Solidity smart contract for decentralized intellectual property fingerprinting",
                original_filename="IPRegistry.sol",
                stored_filename="seed_IPRegistry_v1.sol",
                file_path="uploads/seed_IPRegistry_v1.sol",
                file_size=8192,
                mime_type="text/plain",
                visibility="PUBLIC",
                registration_status="CONFIRMED",
                created_at=now - timedelta(days=30),
                registered_at=now - timedelta(days=30),
            )
            db.add(a1)
            db.flush()

            v1 = AssetVersion(
                version_id=1,
                asset_id="ast-8f4b2c1e-001",
                version_number=1,
                file_hash=hash_v1,
                hash_algorithm="SHA-256",
                file_path="uploads/seed_IPRegistry_v1.sol",
                created_at=now - timedelta(days=30),
            )
            db.add(v1)
            db.flush()

            b1 = BlockchainRecord(
                record_id=1,
                asset_id="ast-8f4b2c1e-001",
                version_id=1,
                transaction_hash="0x4f128e67a9b1c034a71b2d56a310a120014ef06b02a884e910cd052ff3789012",
                block_number=104520,
                network_name="hardhat_local",
                contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
                blockchain_timestamp=now - timedelta(days=30),
                transaction_status="CONFIRMED"
            )
            db.add(b1)

            # Version 2
            v2 = AssetVersion(
                version_id=2,
                asset_id="ast-8f4b2c1e-001",
                version_number=2,
                file_hash=hash_v2,
                hash_algorithm="SHA-256",
                file_path="uploads/seed_IPRegistry_v2.sol",
                created_at=now - timedelta(days=10),
            )
            db.add(v2)
            db.flush()

            b2 = BlockchainRecord(
                record_id=2,
                asset_id="ast-8f4b2c1e-001",
                version_id=2,
                transaction_hash="0x8b329a17c0d2e45b128f90c3d4a5b67e890123456789abcdef0123456789abcd",
                block_number=104980,
                network_name="hardhat_local",
                contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
                blockchain_timestamp=now - timedelta(days=10),
                transaction_status="CONFIRMED"
            )
            db.add(b2)
            db.commit()

        # Asset 2: Bob's Competing Claim (Same SHA-256 hash as Alice's v1!)
        if not db.query(Asset).filter(Asset.asset_id == "ast-7a2b9c1d-002").first():
            a2 = Asset(
                asset_id="ast-7a2b9c1d-002",
                creator_id=4,  # Bob
                category_id=1,
                title="Distributed Registry Contract Derivative",
                description="Independent claim containing identical smart contract file submitted at a later date",
                original_filename="IPRegistry_fork.sol",
                stored_filename="seed_IPRegistry_fork.sol",
                file_path="uploads/seed_IPRegistry_fork.sol",
                file_size=8192,
                mime_type="text/plain",
                visibility="PUBLIC",
                registration_status="CONFIRMED",
                created_at=now - timedelta(days=15),
                registered_at=now - timedelta(days=15),
            )
            db.add(a2)
            db.flush()

            v_compete = AssetVersion(
                version_id=3,
                asset_id="ast-7a2b9c1d-002",
                version_number=1,
                file_hash=hash_v1,  # IDENTICAL HASH TO ALICE'S ASSET!
                hash_algorithm="SHA-256",
                file_path="uploads/seed_IPRegistry_fork.sol",
                created_at=now - timedelta(days=15),
            )
            db.add(v_compete)
            db.flush()

            b_compete = BlockchainRecord(
                record_id=3,
                asset_id="ast-7a2b9c1d-002",
                version_id=3,
                transaction_hash="0x3456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012",
                block_number=104890,
                network_name="hardhat_local",
                contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
                blockchain_timestamp=now - timedelta(days=15),
                transaction_status="CONFIRMED"
            )
            db.add(b_compete)
            db.commit()

        # Asset 3: Carol's Research Whitepaper
        if not db.query(Asset).filter(Asset.asset_id == "ast-5d2f8c4b-003").first():
            a3 = Asset(
                asset_id="ast-5d2f8c4b-003",
                creator_id=5,  # Carol
                category_id=3,
                title="Quantum-Resistant Consensus Specifications",
                description="Theoretical design specifications for post-quantum cryptographic verification lattices",
                original_filename="quantum_consensus.pdf",
                stored_filename="seed_quantum_consensus.pdf",
                file_path="uploads/seed_quantum_consensus.pdf",
                file_size=2097152,
                mime_type="application/pdf",
                visibility="PUBLIC",
                registration_status="CONFIRMED",
                created_at=now - timedelta(days=20),
                registered_at=now - timedelta(days=20),
            )
            db.add(a3)
            db.flush()

            v3 = AssetVersion(
                version_id=4,
                asset_id="ast-5d2f8c4b-003",
                version_number=1,
                file_hash="ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
                hash_algorithm="SHA-256",
                file_path="uploads/seed_quantum_consensus.pdf",
                created_at=now - timedelta(days=20),
            )
            db.add(v3)
            db.flush()

            b3 = BlockchainRecord(
                record_id=4,
                asset_id="ast-5d2f8c4b-003",
                version_id=4,
                transaction_hash="0x7e890123456789abcdef0123456789abcdef0123456789abcdef0123456789ab",
                block_number=104750,
                network_name="hardhat_local",
                contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3",
                blockchain_timestamp=now - timedelta(days=20),
                transaction_status="CONFIRMED"
            )
            db.add(b3)
            db.commit()

        print("✓ Assets & versions seeded (including multi-version and competing claim).")

        # 4. Licenses (Active, Expired, Revoked)
        licenses_data = [
            (1, "ast-8f4b2c1e-001", 3, 4, "Commercial", "Worldwide commercial deployment authorization", now - timedelta(days=20), now + timedelta(days=345), "ACTIVE"),
            (2, "ast-8f4b2c1e-001", 3, 5, "Educational", "Academic research and university study use", now - timedelta(days=15), now + timedelta(days=165), "ACTIVE"),
            (3, "ast-5d2f8c4b-003", 5, 3, "Personal", "Non-commercial individual reading license", now - timedelta(days=60), now - timedelta(days=5), "EXPIRED"),
            (4, "ast-7a2b9c1d-002", 4, 5, "Custom", "Special derivative prototyping license", now - timedelta(days=10), now + timedelta(days=90), "REVOKED"),
        ]
        for lic_id, ast_id, c_id, l_id, l_type, terms, s_date, e_date, status in licenses_data:
            if not db.query(License).filter(License.license_id == lic_id).first():
                db.add(License(
                    license_id=lic_id,
                    asset_id=ast_id,
                    creator_id=c_id,
                    licensee_id=l_id,
                    license_type=l_type,
                    description=terms,
                    start_date=s_date,
                    expiry_date=e_date,
                    status=status
                ))
        db.commit()
        print("✓ Licenses seeded (Active, Expired, Revoked).")

        # 5. Disputes (Pending, Resolved)
        disputes_data = [
            (1, "ast-7a2b9c1d-002", 3, "Alice claiming prior authorship on IPRegistry smart contract over Bob's later claim.", "uploads/alice_prior_claim_evidence.pdf", "UNDER_REVIEW"),
        ]
        for d_id, ast_id, rep_id, desc, ev_path, status in disputes_data:
            if not db.query(Dispute).filter(Dispute.dispute_id == d_id).first():
                db.add(Dispute(
                    dispute_id=d_id,
                    asset_id=ast_id,
                    reporter_id=rep_id,
                    description=desc,
                    evidence_path=ev_path,
                    dispute_status=status,
                    created_at=now - timedelta(days=5)
                ))
        db.commit()
        print("✓ Disputes seeded.")

        # 6. Verifications
        verifications_data = [
            (1, 2, "ast-8f4b2c1e-001", hash_v1, "EXACT_MATCH", now - timedelta(days=4)),
            (2, 2, "ast-5d2f8c4b-003", "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d", "EXACT_MATCH", now - timedelta(days=2)),
            (3, None, None, "0000000000000000000000000000000000000000000000000000000000000000", "NOT_REGISTERED", now - timedelta(days=1)),
        ]
        for v_id, ver_id, ast_id, sub_hash, res, v_time in verifications_data:
            if not db.query(Verification).filter(Verification.verification_id == v_id).first():
                db.add(Verification(
                    verification_id=v_id,
                    verifier_id=ver_id,
                    asset_id=ast_id,
                    submitted_hash=sub_hash,
                    verification_result=res,
                    verified_at=v_time
                ))
        db.commit()
        print("✓ Verifications seeded.")

        # 7. Ownership History
        if not db.query(OwnershipHistory).filter(OwnershipHistory.asset_id == "ast-8f4b2c1e-001").first():
            db.add(OwnershipHistory(
                asset_id="ast-8f4b2c1e-001",
                previous_owner_id=None,
                new_owner_id=3,
                transaction_reference="INITIAL_REGISTRATION_TX_104520",
                changed_at=now - timedelta(days=30)
            ))
            db.commit()
        print("✓ Ownership history seeded.")

        # 8. Audit Logs
        if not db.query(AuditLog).filter(AuditLog.log_id == 1).first():
            db.add(AuditLog(
                log_id=1,
                user_id=3,
                action="ASSET_REGISTRATION",
                entity_type="ASSET",
                entity_id="ast-8f4b2c1e-001",
                details="Initial asset registration and on-chain confirmation",
                created_at=now - timedelta(days=30)
            ))
            db.add(AuditLog(
                log_id=2,
                user_id=4,
                action="ASSET_REGISTRATION",
                entity_type="ASSET",
                entity_id="ast-7a2b9c1d-002",
                details="Competing claim asset registration flagged for potential overlap",
                created_at=now - timedelta(days=15)
            ))
            db.commit()
        print("✓ Audit logs seeded.")

        print("=" * 60)
        print("Seeding Complete! Demo credentials:")
        print("  Admin:     admin@chainproof.io   / SecurePassword123!")
        print("  Verifier:  verifier@chainproof.io / SecurePassword123!")
        print("  Creator:   alice@chainproof.io    / SecurePassword123!")
        print("  Creator:   bob@chainproof.io      / SecurePassword123!")
        print("  Creator:   carol@chainproof.io    / SecurePassword123!")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed()
