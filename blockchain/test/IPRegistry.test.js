const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("IPRegistry Smart Contract", function () {
  let ipRegistry;
  let owner;
  let creator1;
  let creator2;

  const sampleFingerprint1 = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";
  const sampleFingerprint2 = "b5d4045c3f466fa91fe2cc6abe79232a1a57cdf104f7a26e716e0a1e2789df78";
  const alteredFingerprint = "0000000000000000000000000000000000000000000000000000000000000000";

  beforeEach(async function () {
    [owner, creator1, creator2] = await ethers.getSigners();
    const IPRegistryFactory = await ethers.getContractFactory("IPRegistry");
    ipRegistry = await IPRegistryFactory.deploy();
    await ipRegistry.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should initialize with zero total registrations", async function () {
      expect(await ipRegistry.totalRegistrationsCount()).to.equal(0);
    });
  });

  describe("Asset Fingerprint Registration", function () {
    it("should successfully register an asset fingerprint and emit AssetRegistered event", async function () {
      const assetId = "ast-test-001";
      const versionNumber = 1;

      const tx = await ipRegistry.connect(creator1).registerAsset(
        assetId,
        versionNumber,
        sampleFingerprint1
      );

      const receipt = await tx.wait();
      expect(receipt.status).to.equal(1);

      // Verify total count
      expect(await ipRegistry.totalRegistrationsCount()).to.equal(1);

      // Verify event emission
      await expect(tx)
        .to.emit(ipRegistry, "AssetRegistered")
        .withArgs(
          ethers.keccak256(
            ethers.solidityPacked(["string", "uint256"], [assetId, versionNumber])
          ),
          assetId,
          versionNumber,
          sampleFingerprint1,
          creator1.address,
          (await ethers.provider.getBlock(receipt.blockNumber)).timestamp,
          receipt.blockNumber
        );

      // Verify retrieval
      const record = await ipRegistry.getRecord(assetId, versionNumber);
      expect(record.retrievedAssetId).to.equal(assetId);
      expect(record.retrievedVersionNumber).to.equal(versionNumber);
      expect(record.fingerprint).to.equal(sampleFingerprint1);
      expect(record.registrant).to.equal(creator1.address);
      expect(record.isRegistered).to.be.true;
    });

    it("should reject duplicate registration of the same asset version identifier", async function () {
      const assetId = "ast-test-001";
      const versionNumber = 1;

      await ipRegistry.connect(creator1).registerAsset(
        assetId,
        versionNumber,
        sampleFingerprint1
      );

      // Attempt second registration of exact same asset and version
      await expect(
        ipRegistry.connect(creator1).registerAsset(
          assetId,
          versionNumber,
          sampleFingerprint1
        )
      ).to.be.revertedWith("Asset version already registered on-chain");
    });

    it("should support multiple incremental versions of the same asset", async function () {
      const assetId = "ast-multi-ver-001";

      // Version 1
      await ipRegistry.connect(creator1).registerAsset(assetId, 1, sampleFingerprint1);
      // Version 2
      await ipRegistry.connect(creator1).registerAsset(assetId, 2, sampleFingerprint2);

      expect(await ipRegistry.totalRegistrationsCount()).to.equal(2);

      const rec1 = await ipRegistry.getRecord(assetId, 1);
      const rec2 = await ipRegistry.getRecord(assetId, 2);

      expect(rec1.fingerprint).to.equal(sampleFingerprint1);
      expect(rec2.fingerprint).to.equal(sampleFingerprint2);
    });

    it("should allow different creators to register independent claims on identical fingerprints", async function () {
      // Creator 1 registers
      await ipRegistry.connect(creator1).registerAsset("ast-claim-001", 1, sampleFingerprint1);

      // Creator 2 registers separate asset with identical fingerprint (competing claim)
      await ipRegistry.connect(creator2).registerAsset("ast-claim-002", 1, sampleFingerprint1);

      expect(await ipRegistry.totalRegistrationsCount()).to.equal(2);
      expect(await ipRegistry.getClaimsCountForFingerprint(sampleFingerprint1)).to.equal(2);

      const rec1 = await ipRegistry.getRecord("ast-claim-001", 1);
      const rec2 = await ipRegistry.getRecord("ast-claim-002", 1);

      expect(rec1.registrant).to.equal(creator1.address);
      expect(rec2.registrant).to.equal(creator2.address);
      expect(rec1.blockchainTimestamp).to.be.lte(rec2.blockchainTimestamp);
    });
  });

  describe("Fingerprint Verification", function () {
    beforeEach(async function () {
      await ipRegistry.connect(creator1).registerAsset("ast-verify-001", 1, sampleFingerprint1);
    });

    it("should confirm an exact fingerprint match", async function () {
      const result = await ipRegistry.verifyFingerprint(
        "ast-verify-001",
        1,
        sampleFingerprint1
      );

      expect(result.isMatch).to.be.true;
      expect(result.isRegistered).to.be.true;
      expect(result.registeredFingerprint).to.equal(sampleFingerprint1);
      expect(result.registrant).to.equal(creator1.address);
      expect(result.blockchainTimestamp).to.be.gt(0);
    });

    it("should flag a fingerprint mismatch when file is altered", async function () {
      const result = await ipRegistry.verifyFingerprint(
        "ast-verify-001",
        1,
        alteredFingerprint
      );

      expect(result.isMatch).to.be.false;
      expect(result.isRegistered).to.be.true;
      expect(result.registeredFingerprint).to.equal(sampleFingerprint1);
    });

    it("should report non-registration for unknown asset versions", async function () {
      const result = await ipRegistry.verifyFingerprint(
        "ast-nonexistent-999",
        1,
        sampleFingerprint1
      );

      expect(result.isMatch).to.be.false;
      expect(result.isRegistered).to.be.false;
    });
  });

  describe("Input Validation", function () {
    it("should reject empty asset ID", async function () {
      await expect(
        ipRegistry.connect(creator1).registerAsset("", 1, sampleFingerprint1)
      ).to.be.revertedWith("Asset ID cannot be empty");
    });

    it("should reject zero version number", async function () {
      await expect(
        ipRegistry.connect(creator1).registerAsset("ast-001", 0, sampleFingerprint1)
      ).to.be.revertedWith("Version number must be at least 1");
    });

    it("should reject invalid fingerprint length", async function () {
      await expect(
        ipRegistry.connect(creator1).registerAsset("ast-001", 1, "short_hash")
      ).to.be.revertedWith("Fingerprint must be a valid 64-char SHA-256 hex string");
    });
  });
});
