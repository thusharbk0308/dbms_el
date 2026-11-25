import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def create_report_docx(output_path):
    doc = docx.Document()
    
    # Page Margins
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        
    def add_title(text, level=1, space_before=12, space_after=6):
        h = doc.add_heading(text, level=level)
        h.paragraph_format.space_before = Pt(space_before)
        h.paragraph_format.space_after = Pt(space_after)
        return h

    def add_p(text, bold_prefix=None, space_after=6, line_spacing=1.15):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = line_spacing
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.bold = True
        p.add_run(text)
        return p

    # --- TITLE PAGE ---
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("RV COLLEGE OF ENGINEERING®\nBENGALURU – 560059\n")
    r_inst.bold = True
    r_inst.font.size = Pt(16)
    r_sub = p_inst.add_run("(Autonomous Institution Affiliated to VTU, Belagavi)\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n\n")
    r_sub.font.size = Pt(12)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("ChainProof: Blockchain-Based Digital Intellectual Property Registration and Verification System\n\n")
    r_title.bold = True
    r_title.font.size = Pt(18)
    r_title.font.color.rgb = RGBColor(0x19, 0x1B, 0x20)
    
    p_subm = doc.add_paragraph()
    p_subm.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_subm.add_run("Mini - Project Report\nSubmitted in partial fulfillment for the requirement of 5th Semester\nDATABASE MANAGEMENT SYSTEMS (CD252IA)\nAcademic Year 2025 – 2026\n\n").font.size = Pt(11)
    
    p_guide = doc.add_paragraph()
    p_guide.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_g1 = p_guide.add_run("Under the Guidance of\n")
    r_g1.font.size = Pt(11)
    r_g2 = p_guide.add_run("Dr. Sneha M\n")
    r_g2.bold = True
    r_g2.font.size = Pt(13)
    p_guide.add_run("Associate Professor, Department of CSE\nR.V. College of Engineering, Bengaluru – 560059\n\n").font.size = Pt(11)
    
    doc.add_page_break()
    
    # --- CERTIFICATE ---
    p_cert_hdr = doc.add_paragraph()
    p_cert_hdr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_hdr.add_run("RV COLLEGE OF ENGINEERING®\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\n\n").bold = True
    
    h_cert = doc.add_heading("CERTIFICATE", level=1)
    h_cert.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    add_p(
        "Certified that the project work titled ‘ChainProof: Blockchain-Based Digital Intellectual Property Registration and Verification System’ "
        "is carried out by bonafide students of R. V. College of Engineering, Bengaluru, in partial fulfillment of the curriculum requirement of "
        "5th Semester Database Management Systems (CD252IA) Laboratory Mini Project during the academic year 2025-2026. "
        "It is certified that all corrections/suggestions indicated for the internal Assessment have been incorporated in the report. "
        "The report has been approved as it satisfies the academic requirements in all respects for the laboratory mini-project work prescribed by the institution."
    )
    
    doc.add_paragraph("\n\nSignature of Faculty In-charge: Dr. Sneha M              Head of the Department: Dr. Shanta Rangaswamy")
    doc.add_paragraph("Dept. of CSE, RVCE                                             Dept. of CSE, RVCE\n\n")
    doc.add_paragraph("External Examination Examiners:\n1. ___________________________________\n2. ___________________________________")
    
    doc.add_page_break()
    
    # --- ACKNOWLEDGEMENT ---
    h_ack = doc.add_heading("ACKNOWLEDGEMENT", level=1)
    h_ack.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p("Any achievement, be it scholastic or otherwise, does not depend solely on individual efforts but on the guidance, encouragement, and cooperation of intellectuals, elders, and mentors.")
    add_p("We deeply express our sincere gratitude to our esteemed guide Dr. Sneha M, Associate Professor, Department of CSE, RVCE, Bengaluru, for her able guidance, continuous encouragement, and valuable assistance throughout the project.")
    add_p("We would like to thank Dr. Shanta Rangaswamy, Head of Department, Computer Science & Engineering, RVCE, Bengaluru, for her valuable suggestions, department infrastructure, and expert advice.")
    add_p("First and foremost, we would like to thank Dr. Subramanya K. N, Principal, RVCE, Bengaluru, for his moral support towards completing our curriculum requirements.")
    add_p("We thank our parents, faculty members, and peers of the Department of Computer Science & Engineering for their constant support and encouragement.")
    
    doc.add_page_break()
    
    # --- ABSTRACT ---
    h_abs = doc.add_heading("ABSTRACT", level=1)
    h_abs.alignment = WD_ALIGN_PARAGRAPH.CENTER
    add_p(
        "Digital creators face significant challenges in asserting ownership, establishing chronological precedence, and proving file integrity in decentralized digital environments. "
        "Traditional copyright registries are centralized, geographically restricted, bureaucratically slow, and cost-prohibitive. Conversely, naive blockchain implementations either attempt to upload prohibitive binary file payloads onto high-cost ledgers or conflate cryptographic existence with statutory legal copyright."
    )
    add_p(
        "ChainProof addresses these challenges through a hybrid architecture combining an enterprise-grade Relational Database Management System (PostgreSQL) normalized to Third Normal Form (3NF) with a decentralized Ethereum Virtual Machine (EVM) smart contract layer. The platform implements a dual-layer storage model: raw media files and rich transactional metadata reside within an ACID-compliant relational schema, while deterministic, chunked SHA-256 cryptographic digests (computed in 64KB buffers to maintain strict O(1) constant memory utilization) are anchored immutably to a Solidity smart contract (IPRegistry.sol)."
    )
    add_p(
        "Core capabilities include Role-Based Access Control (RBAC) across Creator, Verifier, and Admin roles, multi-version asset progression trees, public dual-mode verification (raw file upload or 64-hex SHA-256 lookup), competing claim preservation, smart contract licensing, and administrative dispute resolution queues. The user interface adheres to a polished Neo-Brutalist and Editorial design language with tactile borders and interactive Recharts visualizations."
    )
    
    doc.add_page_break()
    
    # --- CHAPTER 1 ---
    add_title("CHAPTER 1: INTRODUCTION", level=1)
    add_title("1.1 Objective", level=2)
    add_p("The primary objective of ChainProof is to engineer an enterprise-grade academic platform fusing normalized relational DBMS principles with decentralized blockchain consensus for digital intellectual property protection.")
    add_p("1. Cryptographic Fingerprinting: Generate deterministic, collision-resistant SHA-256 digests using streaming chunk buffers.")
    add_p("2. Decentralized Proof-of-Existence: Anchor cryptographic hashes immutably to an Ethereum smart contract with block numbers and timestamps.")
    add_p("3. Normalized Relational Architecture: Enforce a strict 3NF/BCNF relational schema in PostgreSQL ensuring zero data redundancy.")
    add_p("4. Multi-Version Lineage Tracking: Preserve complete ancestral version trees with independent on-chain records for every revision.")
    add_p("5. Objective Dual-Mode Verification: Allow instant verification via raw file upload or 64-char hex hash lookup.")
    add_p("6. Competing Claim Preservation: Preserve chronologically ordered competing claims when identical files are submitted.")
    
    add_title("1.2 Scope", level=2)
    add_p("The project scope encompasses arbitrary digital file types (images, documents, archives, multimedia up to 25MB), 10 normalized PostgreSQL tables, an audited Solidity smart contract deployed via Hardhat, and a responsive Neo-Brutalist client interface.")
    
    # --- CHAPTER 2 ---
    add_title("CHAPTER 2: SOFTWARE REQUIREMENT SPECIFICATION (SRS)", level=1)
    add_title("2.1 Software Requirements", level=2)
    add_p("• Operating System: Windows 11 / Linux (Ubuntu 22.04 LTS) / macOS")
    add_p("• Database Management System: PostgreSQL 15.0+ (with SQLite 3.39+ local dev support)")
    add_p("• Backend Runtime & Framework: Python 3.10+, FastAPI v0.110+, Uvicorn ASGI server")
    add_p("• ORM & Migrations: SQLAlchemy 2.0, Alembic 1.13")
    add_p("• Blockchain: Solidity 0.8.20, Hardhat 2.22, Web3.py 6.15")
    add_p("• Frontend: React 18.2, TypeScript 5.2, Vite 5.1, Tailwind CSS v4, Recharts, Lucide-React")
    
    add_title("2.2 Hardware Requirements", level=2)
    add_p("• Processor: Dual-Core 2.0 GHz minimum (Octa-Core 3.2 GHz recommended)")
    add_p("• Memory (RAM): 4 GB minimum (16 GB recommended)")
    add_p("• Storage: 20 GB free space (SSD recommended)")
    
    add_title("2.3 Functional Requirements", level=2)
    add_p("• FR-01 Authentication & RBAC: JWT HS256 tokens and bcrypt (12 salt rounds) password hashing across Creator, Verifier, and Admin roles.")
    add_p("• FR-02 Streaming Hashing: Fixed 64KB chunk buffer generating SHA-256 hex digests with O(1) constant memory.")
    add_p("• FR-03 Smart Contract Anchoring: Automated Web3.py invocation of IPRegistry.sol recording txHash, blockNumber, and blockTimestamp.")
    add_p("• FR-04 Public Verification: Classifies files into EXACT_MATCH, NOT_REGISTERED, BLOCKCHAIN_VERIFICATION_FAILED, or COMPETING_CLAIMS.")
    add_p("• FR-05 Licensing & Disputes: Granular usage grants and dispute arbitration with evidence attachments.")
    
    # --- CHAPTER 3 ---
    add_title("CHAPTER 3: ENTITY RELATIONSHIP DIAGRAM", level=1)
    add_p("The system architecture models 10 distinct entities: USERS, CATEGORIES, ASSETS, ASSET_VERSIONS, BLOCKCHAIN_RECORDS, LICENSES, VERIFICATIONS, DISPUTES, OWNERSHIP_HISTORY, and AUDIT_LOGS.")
    add_p("Key Relationships:")
    add_p("• USERS to ASSETS (1:N, ON DELETE RESTRICT): Prevents deleting creators with registered assets.")
    add_p("• CATEGORIES to ASSETS (1:N, ON DELETE RESTRICT): Active categories cannot be deleted.")
    add_p("• ASSETS to ASSET_VERSIONS (1:N, ON DELETE CASCADE): Maintains incremental revisions.")
    add_p("• ASSET_VERSIONS to BLOCKCHAIN_RECORDS (1:1, ON DELETE RESTRICT): Blockchain audit proofs cannot be orphaned.")
    add_p("• ASSETS to LICENSES (1:N): Supports Personal, Commercial, Educational, and Custom licenses.")
    add_p("• USERS to AUDIT_LOGS (1:N, ON DELETE SET NULL): Audit trails are permanently preserved.")
    
    # --- CHAPTER 4 ---
    add_title("CHAPTER 4: DATA FLOW DIAGRAM (DFD)", level=1)
    add_title("4.1 DFD Level 0 (Context Diagram)", level=2)
    add_p("The Level 0 Context Diagram depicts the holistic boundary of the ChainProof system with external entities: Digital Creators, Public Verifiers, System Administrators, and the Ethereum Blockchain (Hardhat / Testnet Node). Creators transmit multipart asset media and metadata, receiving signed JWT tokens and deterministic SHA-256 fingerprints. Verifiers submit files or 64-hex strings and receive provenance reports. Administrators manage dispute reviews and audit logs. The Ethereum smart contract acts as an external decentralized consensus witness via JSON-RPC.")
    
    add_title("4.2 DFD Level 1 (Major System Processes)", level=2)
    add_p("The Level 1 diagram decomposes the system into six core functional subsystems interacting with the normalized PostgreSQL data stores (USERS, CATEGORIES, ASSETS, ASSET_VERSIONS, BLOCKCHAIN_RECORDS, LICENSES, VERIFICATIONS, DISPUTES, AUDIT_LOGS):")
    add_p("• Process 1.0 (Authentication & RBAC): Validates credentials, issues JWT tokens, and enforces role access.")
    add_p("• Process 2.0 (Asset Ingestion & Hashing): Ingests media streams, computes streaming SHA-256 digests, and executes atomic DB transactions.")
    add_p("• Process 3.0 (Blockchain Anchoring Service): Submits registerAsset transactions to IPRegistry.sol and records mined receipts.")
    add_p("• Process 4.0 (Public Verification Engine): Ingests candidate hashes/files, queries database versions, verifies on-chain contracts, and classifies verdicts.")
    add_p("• Process 5.0 (Licensing Management): Manages issuance, expiry bounds, and revocation of digital licenses.")
    add_p("• Process 6.0 (Dispute & Audit Adjudication): Handles contested ownership claims and administrative audit logging.")

    add_title("4.3 DFD Level 2 (Sub-Process Decomposition)", level=2)
    add_p("The Level 2 diagrams provide deep functional breakdowns of the four most critical sub-processes:")
    add_p("4.3.1 Process 2.0: Asset Ingestion & Streaming SHA-256 Hashing Pipeline", bold_prefix="• ")
    add_p("  1. Ingest multipart upload stream in bounded 64KB chunks to guarantee strict O(1) constant memory usage.\n"
          "  2. Incrementally accumulate bytes into hashlib.sha256() without buffering the full file into server RAM.\n"
          "  3. Persist file payload to protected off-chain storage with a sanitized UUID filename.\n"
          "  4. Open an ACID database transaction: insert metadata into ASSETS, version 1 into ASSET_VERSIONS, and an audit trail entry into AUDIT_LOGS.\n"
          "  5. If the transaction succeeds, dispatch an asynchronous Web3 task; if it fails, roll back database state and delete the physical file.")
    add_p("4.3.2 Process 3.0: Blockchain Anchoring & Transaction Receipt Pipeline", bold_prefix="• ")
    add_p("  1. Retrieve pending asset ID, version number, and 64-character SHA-256 hex digest.\n"
          "  2. Connect to the local Hardhat or external EVM node via Web3.py JSON-RPC.\n"
          "  3. Invoke registerAsset(assetId, versionNumber, fileHash) on IPRegistry.sol.\n"
          "  4. Await transaction mining, parse transaction receipt (blockNumber, blockTimestamp, txHash).\n"
          "  5. Commit BLOCKCHAIN_RECORDS tuple and update ASSETS registration_status to 'CONFIRMED'. If node is unavailable, set status to 'PENDING' for background retry.")
    add_p("4.3.3 Process 4.0: Dual-Mode Public Verification & Competing Claims Engine", bold_prefix="• ")
    add_p("  1. Accept verification input: raw multipart file upload or 64-character hexadecimal SHA-256 string.\n"
          "  2. Normalize hash (via streaming computation or strict regex validation ^[a-fA-F0-9]{64}$).\n"
          "  3. Query ASSET_VERSIONS for matching file_hash values.\n"
          "  4. If zero rows match: Return 'NOT_REGISTERED'.\n"
          "  5. If multiple rows match: Return 'COMPETING_CLAIMS' ordered chronologically by created_at.\n"
          "  6. If exactly one row matches: Cross-examine on-chain state via IPRegistry.sol. If verified, return 'EXACT_MATCH'; if reverted/mismatched, return 'BLOCKCHAIN_VERIFICATION_FAILED'.\n"
          "  7. Record the verification query into the VERIFICATIONS table for analytics and security auditing.")
    add_p("4.3.4 Process 6.0: Dispute Adjudication & Administrative Resolution Lifecycle", bold_prefix="• ")
    add_p("  1. Stakeholder files dispute citing asset_id, infringement justification, and optional evidence attachment.\n"
          "  2. Validate asset existence and persist dispute entry with status 'PENDING'.\n"
          "  3. Notify administrator console dispute review queue.\n"
          "  4. Administrator inspects timestamps, on-chain block proofs, and submitted evidence documents.\n"
          "  5. Admin updates dispute status to 'RESOLVED' or 'REJECTED', appending an immutable record to AUDIT_LOGS.")
    
    # --- CHAPTER 5 ---
    add_title("CHAPTER 5: RELATIONAL SCHEMA AND NORMALIZATION", level=1)
    add_p("The database strictly adheres to Third Normal Form (3NF) and BCNF:")
    add_p("• 1NF: Atomic column values; no repeating groups; explicit primary keys across all 10 tables.")
    add_p("• 2NF: No partial functional dependencies. In ASSET_VERSIONS, version_id is a surrogate key with UNIQUE(asset_id, version_number).")
    add_p("• 3NF: Elimination of transitive dependencies. Creator metadata resides exclusively in USERS; category descriptions reside exclusively in CATEGORIES; blockchain transaction receipts reside exclusively in BLOCKCHAIN_RECORDS.")
    add_p("• BCNF: All functional dependency determinants are superkeys.")
    
    # --- CHAPTER 6 ---
    add_title("CHAPTER 6: DESIGN OF FORMS, SECURITY AND VALIDATION", level=1)
    add_p("• Design of Forms: Neo-Brutalist design tokens (warm off-white #F8F6F2, 2px borders, 4px hard offset shadows, Coral/Teal/Blue accents).")
    add_p("• Security & Validation: SQLAlchemy 2.0 parameterized queries eliminate SQL injection. Pydantic v2 validates regex patterns and input types. bcrypt with 12 salt rounds protects credentials.")
    add_p("• Cryptographic Integrity: Constant-memory 64KB chunked SHA-256 reader prevents memory exhaustion attacks.")
    
    # --- CHAPTER 7 ---
    add_title("CHAPTER 7: CONCLUSION", level=1)
    add_p("ChainProof delivers a practical, academically verified hybrid architecture combining relational database guarantees (PostgreSQL 3NF) with trustless decentralized immutability (Ethereum EVM). The system satisfies all functional requirements with 51 passing pytest suites and 11 Hardhat test suites.")
    
    # --- CHAPTER 8 ---
    add_title("CHAPTER 8: REFERENCES", level=1)
    add_p("[1] R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Pearson, 2016.")
    add_p("[2] A. Silberschatz, H. F. Korth, and S. Sudarshan, Database System Concepts, 7th ed. McGraw-Hill, 2020.")
    add_p("[3] S. Nakamoto, 'Bitcoin: A Peer-to-Peer Electronic Cash System', 2008.")
    add_p("[4] G. Wood, 'Ethereum: A Secure Decentralised Generalised Transaction Ledger', Ethereum Yellow Paper, 2014.")
    add_p("[5] NIST, 'Secure Hash Standard (SHS)', FIPS PUB 180-4, 2015.")
    add_p("[6] Hardhat Documentation, 'Ethereum Development Environment', Nomic Foundation, 2024.")
    add_p("[7] FastAPI Documentation, 'High Performance Python Web Framework', 2024.")
    
    doc.add_page_break()
    
    # --- CHAPTER 9: APPENDIX WITH SCREENSHOTS ---
    add_title("CHAPTER 9: APPENDIX: SYSTEM SNAPSHOTS", level=1)
    
    screenshots = [
        ("Figure 10: Landing Page & Blockchain Network Health", "docs/screenshots/01_landing_page.png",
         "The landing page showcases the Neo-Brutalist editorial aesthetic, warm off-white background (#F8F6F2), 2px solid dark borders, hard 4px offset drop-shadows, and the live Blockchain Network Status widget."),
        ("Figure 11: Creator Dashboard & Performance Statistics", "docs/screenshots/02_dashboard.png",
         "The Creator Dashboard displays statistical metric cards for registered assets, blockchain transactions, and licenses, followed by the recent registrations table."),
        ("Figure 12: Asset Registration Portal & Drag-and-Drop SHA-256 Hashing Form", "docs/screenshots/03_asset_registration.png",
         "The upload studio features a drag-and-drop file ingestion zone with real-time SHA-256 calculation, metadata fields, and blockchain broadcast indicators."),
        ("Figure 13: Asset Details, Monospace Fingerprint & Blockchain Provenance Proof", "docs/screenshots/04_asset_details.png",
         "The Asset Details view presents the SHA-256 fingerprint in a monospace panel, the on-chain blockchain proof card, version release history, and licensing actions."),
        ("Figure 14: Public Verification Portal with Exact Match & Competing Claims", "docs/screenshots/05_verification.png",
         "The public verification engine displays an EXACT MATCH result panel with confirmed creator identity, timestamp, and competing claims analysis."),
        ("Figure 15: Interactive Platform Analytics with Recharts", "docs/screenshots/06_analytics.png",
         "Interactive analytics dashboard featuring registration trends, category distribution pies, and verification activity charts styled with the Neo-Brutalist palette."),
        ("Figure 16: Administrator Console & Audit Trail Viewer", "docs/screenshots/07_admin_dashboard.png",
         "The administrative interface provides dispute review workflows, asset moderation tools, and the append-only system audit log viewer.")
    ]
    
    for title, img_path, desc in screenshots:
        add_title(title, level=2)
        if os.path.exists(img_path):
            doc.add_picture(img_path, width=Inches(5.8))
        add_p(desc)
        doc.add_paragraph()
        
    doc.save(output_path)
    print(f"Successfully generated DOCX report at: {output_path}")

if __name__ == "__main__":
    out = os.path.join("docs", "DBMS_MINI_PROJECT_REPORT.docx")
    create_report_docx(out)
