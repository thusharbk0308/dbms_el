import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Tuple, Dict, Any
from web3 import Web3
from web3.exceptions import Web3Exception
from app.core.config import settings

logger = logging.getLogger("chainproof.blockchain")

class BlockchainError(Exception):
    """Base exception for blockchain integration errors."""
    pass

class BlockchainConnectionError(BlockchainError):
    """Raised when the Ethereum RPC provider is unreachable."""
    pass

class BlockchainTransactionError(BlockchainError):
    """Raised when a blockchain transaction fails or reverts."""
    pass

class BlockchainConfigurationError(BlockchainError):
    """Raised when contract address or private key is missing."""
    pass

class BlockchainService:
    def __init__(self):
        self._w3: Optional[Web3] = None
        self._contract = None
        self._abi = None
        self._load_abi()

    def _load_abi(self):
        json_paths = [
            Path(__file__).resolve().parent.parent / "blockchain" / "deployed_contract.json",
            Path(__file__).resolve().parent.parent.parent.parent / "blockchain" / "deployed_contract.json"
        ]
        for path in json_paths:
            if path.exists():
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        self._abi = data.get("abi")
                        if not settings.CONTRACT_ADDRESS and data.get("contractAddress"):
                            settings.CONTRACT_ADDRESS = data.get("contractAddress")
                        break
                except Exception as e:
                    logger.warning(f"Could not load ABI from {path}: {e}")

    @property
    def w3(self) -> Web3:
        if self._w3 is None:
            self._w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        return self._w3

    def is_connected(self) -> bool:
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def get_contract(self):
        if not settings.CONTRACT_ADDRESS:
            self._load_abi()
        if not settings.CONTRACT_ADDRESS:
            raise BlockchainConfigurationError(
                "Smart contract address is not configured. Deploy the contract or set CONTRACT_ADDRESS."
            )
        if not self._abi:
            raise BlockchainConfigurationError(
                "Smart contract ABI is not loaded. Ensure deployed_contract.json exists."
            )
        return self.w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=self._abi
        )

    def is_version_registered_on_chain(self, asset_id: str, version_number: int) -> bool:
        """Checks whether the asset version is already anchored on the blockchain."""
        if not self.is_connected():
            raise BlockchainConnectionError(f"Cannot connect to blockchain RPC at {settings.BLOCKCHAIN_RPC_URL}")
        contract = self.get_contract()
        return contract.functions.isVersionRegistered(asset_id, version_number).call()

    def register_fingerprint_on_chain(
        self,
        asset_id: str,
        version_number: int,
        fingerprint: str
    ) -> Dict[str, Any]:
        """
        Submits an asset version SHA-256 fingerprint to the IPRegistry smart contract.
        Idempotent: if already registered on-chain, retrieves existing block details safely.
        """
        if not self.is_connected():
            raise BlockchainConnectionError(
                f"Cannot connect to blockchain RPC node at {settings.BLOCKCHAIN_RPC_URL}. "
                "Ensure local Hardhat node is running ('npx hardhat node')."
            )

        if not settings.DEPLOYER_PRIVATE_KEY:
            raise BlockchainConfigurationError("DEPLOYER_PRIVATE_KEY is not configured.")

        contract = self.get_contract()
        account = self.w3.eth.account.from_key(settings.DEPLOYER_PRIVATE_KEY)

        # Idempotency check: if already registered, fetch on-chain metadata directly
        if contract.functions.isVersionRegistered(asset_id, version_number).call():
            logger.info(f"Asset '{asset_id}' v{version_number} is already registered on-chain. Fetching existing record.")
            rec = contract.functions.getRecord(asset_id, version_number).call()
            # rec returns: (assetId, versionNumber, fingerprint, registrant, timestamp, blockNumber, exists)
            block_number = rec[5]
            timestamp_val = rec[4]
            return {
                "transaction_hash": f"0x_already_registered_on_chain_block_{block_number}",
                "block_number": block_number,
                "network_name": settings.BLOCKCHAIN_NETWORK_NAME,
                "contract_address": contract.address,
                "blockchain_timestamp": datetime.fromtimestamp(timestamp_val, tz=timezone.utc),
                "transaction_status": "CONFIRMED",
                "already_existed": True
            }

        # Build and sign transaction
        try:
            nonce = self.w3.eth.get_transaction_count(account.address, "pending")
            gas_price = self.w3.eth.gas_price

            tx_func = contract.functions.registerAsset(asset_id, version_number, fingerprint)
            estimated_gas = tx_func.estimate_gas({"from": account.address})

            tx_data = tx_func.build_transaction({
                "from": account.address,
                "nonce": nonce,
                "gas": int(estimated_gas * 1.2),
                "gasPrice": gas_price,
                "chainId": settings.CHAIN_ID
            })

            signed_tx = self.w3.eth.account.sign_transaction(tx_data, private_key=settings.DEPLOYER_PRIVATE_KEY)
            # Web3.py v6/v7 compatible raw transaction attribute
            raw_tx = getattr(signed_tx, "raw_transaction", None) or getattr(signed_tx, "rawTransaction")
            tx_hash_bytes = self.w3.eth.send_raw_transaction(raw_tx)
            tx_hash_hex = tx_hash_bytes.hex()
            if not tx_hash_hex.startswith("0x"):
                tx_hash_hex = f"0x{tx_hash_hex}"

            # Wait for receipt confirmation
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=60)
            if receipt.status != 1:
                raise BlockchainTransactionError(f"Blockchain transaction {tx_hash_hex} reverted.")

            # Retrieve block timestamp
            block = self.w3.eth.get_block(receipt.blockNumber)
            block_timestamp = datetime.fromtimestamp(block.timestamp, tz=timezone.utc)

            return {
                "transaction_hash": tx_hash_hex,
                "block_number": receipt.blockNumber,
                "network_name": settings.BLOCKCHAIN_NETWORK_NAME,
                "contract_address": contract.address,
                "blockchain_timestamp": block_timestamp,
                "transaction_status": "CONFIRMED",
                "already_existed": False
            }

        except Web3Exception as e:
            raise BlockchainTransactionError(f"Web3 transaction error: {str(e)}")
        except Exception as e:
            if isinstance(e, BlockchainError):
                raise
            raise BlockchainTransactionError(f"Failed to submit blockchain registration: {str(e)}")

    def verify_fingerprint_on_chain(
        self,
        asset_id: str,
        version_number: int,
        expected_fingerprint: str
    ) -> Dict[str, Any]:
        """
        Queries the smart contract directly to verify file integrity against on-chain timestamped record.
        """
        if not self.is_connected():
            raise BlockchainConnectionError(
                f"Cannot connect to blockchain RPC node at {settings.BLOCKCHAIN_RPC_URL}"
            )

        contract = self.get_contract()
        # verifyFingerprint returns: (isMatch, isRegistered, registeredFingerprint, timestamp, registrant)
        result = contract.functions.verifyFingerprint(asset_id, version_number, expected_fingerprint).call()

        is_match = result[0]
        is_registered = result[1]
        registered_fingerprint = result[2]
        timestamp_int = result[3]
        registrant = result[4]

        block_dt = datetime.fromtimestamp(timestamp_int, tz=timezone.utc) if timestamp_int > 0 else None

        return {
            "is_match": is_match,
            "is_registered": is_registered,
            "registered_fingerprint": registered_fingerprint,
            "blockchain_timestamp": block_dt,
            "registrant": registrant,
            "contract_address": contract.address
        }

blockchain_service = BlockchainService()
