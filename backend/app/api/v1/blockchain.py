from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User
from app.database.models.blockchain_record import BlockchainRecord
from app.schemas.asset import BlockchainRecordSummary
from app.services.asset_service import AssetService
from app.services.blockchain_service import blockchain_service
from app.core.dependencies import get_current_user, require_roles
from app.core.config import settings

router = APIRouter(prefix="/blockchain", tags=["Blockchain Integration"])

@router.get(
    "/status",
    summary="Check local blockchain RPC connectivity and contract configuration"
)
def get_blockchain_status():
    """
    Checks if the local Ethereum RPC node is connected, current block number,
    and smart contract deployment configuration.
    """
    is_connected = blockchain_service.is_connected()
    current_block = None
    if is_connected:
        try:
            current_block = blockchain_service.w3.eth.block_number
        except Exception:
            pass

    return {
        "connected": is_connected,
        "rpc_url": settings.BLOCKCHAIN_RPC_URL,
        "network_name": settings.BLOCKCHAIN_NETWORK_NAME,
        "chain_id": settings.CHAIN_ID,
        "contract_address": settings.CONTRACT_ADDRESS or "NOT_CONFIGURED",
        "current_block_number": current_block
    }

@router.get(
    "/records/{asset_id}",
    response_model=List[BlockchainRecordSummary],
    summary="Retrieve all blockchain registration records for an asset"
)
def get_asset_blockchain_records(
    asset_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves confirmed on-chain transaction hashes, block numbers, and timestamps
    associated with each registered version of the specified asset.
    """
    # Ensure asset exists
    AssetService.get_asset_by_id(db, asset_id)
    records = db.query(BlockchainRecord).filter(
        BlockchainRecord.asset_id == asset_id
    ).order_by(BlockchainRecord.created_at.asc()).all()

    return records

@router.get(
    "/verify/{version_id}",
    summary="Verify an asset version fingerprint directly against the Solidity smart contract"
)
def verify_version_on_chain(
    version_id: int,
    db: Session = Depends(get_db)
):
    """
    Reads the SHA-256 fingerprint from PostgreSQL and queries the IPRegistry smart contract
    to confirm whether the cryptographic digest matches the immutable blockchain record.
    """
    return AssetService.verify_version_on_chain(db, version_id)

@router.post(
    "/retry/{asset_id}",
    summary="Retry blockchain registration for an asset with pending or failed status"
)
def retry_blockchain_registration(
    asset_id: str,
    version_number: int = Query(1, ge=1, description="Version number to submit on-chain"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("CREATOR", "ADMINISTRATOR"))
):
    """
    Retries submitting an unconfirmed or failed asset version fingerprint to the smart contract.
    Idempotent: verifies on-chain existence before broadcasting new transactions.
    """
    return AssetService.retry_blockchain_submission(db, asset_id, version_number)
