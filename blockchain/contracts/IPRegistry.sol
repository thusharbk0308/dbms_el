// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPRegistry
 * @dev Academic & Production Digital Intellectual Property Fingerprint Registry.
 * Records SHA-256 asset fingerprints, unique asset/version identifiers,
 * registrant addresses, block numbers, and consensus timestamps.
 *
 * Implements immutable on-chain record keeping:
 * - Proves timestamped existence of a cryptographic digest.
 * - Prevents duplicate registrations of the same asset version.
 * - Enables public read-only integrity verification.
 */
contract IPRegistry {
    struct RegistrationRecord {
        string assetId;
        uint256 versionNumber;
        string fingerprint;       // 64-character SHA-256 hex string
        address registrant;
        uint256 blockchainTimestamp;
        uint256 blockNumber;
        bool exists;
    }

    // Version key = keccak256(abi.encodePacked(assetId, versionNumber))
    mapping(bytes32 => RegistrationRecord) private records;

    // Fingerprint -> list of version keys (tracks independent claims on identical fingerprints)
    mapping(string => bytes32[]) private fingerprintIndex;

    // Total registered records
    uint256 public totalRegistrationsCount;

    // Event emitted when a digital asset version fingerprint is anchored to the blockchain
    event AssetRegistered(
        bytes32 indexed versionKey,
        string assetId,
        uint256 indexed versionNumber,
        string fingerprint,
        address indexed registrant,
        uint256 blockchainTimestamp,
        uint256 blockNumber
    );

    /**
     * @dev Registers an asset version cryptographic fingerprint on the blockchain.
     * @param assetId Unique asset identifier from database (e.g. 'ast-8f4b2c1e89a0').
     * @param versionNumber Incremental version number (>= 1).
     * @param fingerprint 64-character hexadecimal SHA-256 digest.
     * @return versionKey The computed keccak256 hash identifying this asset version.
     */
    function registerAsset(
        string calldata assetId,
        uint256 versionNumber,
        string calldata fingerprint
    ) external returns (bytes32 versionKey) {
        require(bytes(assetId).length > 0, "Asset ID cannot be empty");
        require(versionNumber >= 1, "Version number must be at least 1");
        require(bytes(fingerprint).length == 64, "Fingerprint must be a valid 64-char SHA-256 hex string");

        versionKey = keccak256(abi.encodePacked(assetId, versionNumber));
        require(!records[versionKey].exists, "Asset version already registered on-chain");

        records[versionKey] = RegistrationRecord({
            assetId: assetId,
            versionNumber: versionNumber,
            fingerprint: fingerprint,
            registrant: msg.sender,
            blockchainTimestamp: block.timestamp,
            blockNumber: block.number,
            exists: true
        });

        fingerprintIndex[fingerprint].push(versionKey);
        totalRegistrationsCount += 1;

        emit AssetRegistered(
            versionKey,
            assetId,
            versionNumber,
            fingerprint,
            msg.sender,
            block.timestamp,
            block.number
        );

        return versionKey;
    }

    /**
     * @dev Retrieves a registered record by asset ID and version number.
     */
    function getRecord(
        string calldata assetId,
        uint256 versionNumber
    ) external view returns (
        string memory retrievedAssetId,
        uint256 retrievedVersionNumber,
        string memory fingerprint,
        address registrant,
        uint256 blockchainTimestamp,
        uint256 blockNumber,
        bool isRegistered
    ) {
        bytes32 versionKey = keccak256(abi.encodePacked(assetId, versionNumber));
        RegistrationRecord memory rec = records[versionKey];

        return (
            rec.assetId,
            rec.versionNumber,
            rec.fingerprint,
            rec.registrant,
            rec.blockchainTimestamp,
            rec.blockNumber,
            rec.exists
        );
    }

    /**
     * @dev Verifies if a submitted SHA-256 fingerprint matches the on-chain record for a given version.
     */
    function verifyFingerprint(
        string calldata assetId,
        uint256 versionNumber,
        string calldata expectedFingerprint
    ) external view returns (
        bool isMatch,
        bool isRegistered,
        string memory registeredFingerprint,
        uint256 blockchainTimestamp,
        address registrant
    ) {
        bytes32 versionKey = keccak256(abi.encodePacked(assetId, versionNumber));
        RegistrationRecord memory rec = records[versionKey];

        if (!rec.exists) {
            return (false, false, "", 0, address(0));
        }

        bool matchResult = (keccak256(bytes(rec.fingerprint)) == keccak256(bytes(expectedFingerprint)));
        return (
            matchResult,
            true,
            rec.fingerprint,
            rec.blockchainTimestamp,
            rec.registrant
        );
    }

    /**
     * @dev Returns total registered claims associated with a given fingerprint.
     */
    function getClaimsCountForFingerprint(string calldata fingerprint) external view returns (uint256) {
        return fingerprintIndex[fingerprint].length;
    }

    /**
     * @dev Checks if a specific asset version is registered on-chain.
     */
    function isVersionRegistered(string calldata assetId, uint256 versionNumber) external view returns (bool) {
        bytes32 versionKey = keccak256(abi.encodePacked(assetId, versionNumber));
        return records[versionKey].exists;
    }
}
