import os
import json
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ROOT_DIR = BASE_DIR.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "ChainProof"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "chainproof_super_secret_jwt_key_replace_in_production_min32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite:///./chainproof.db"

    # Storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    MAX_FILE_SIZE_MB: int = 25

    # Blockchain
    BLOCKCHAIN_RPC_URL: str = "http://127.0.0.1:8545"
    BLOCKCHAIN_NETWORK_NAME: str = "hardhat_local"
    CHAIN_ID: int = 31337
    CONTRACT_ADDRESS: str = ""
    DEPLOYER_PRIVATE_KEY: str = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]

    class Config:
        env_file = (
            str(ROOT_DIR / ".env")
            if (ROOT_DIR / ".env").exists()
            else str(BASE_DIR / ".env")
        )
        extra = "ignore"

settings = Settings()

# Dynamically populate contract address from deployment file if not configured in environment
if not settings.CONTRACT_ADDRESS:
    contract_json_paths = [
        BASE_DIR / "app" / "blockchain" / "deployed_contract.json",
        ROOT_DIR / "blockchain" / "deployed_contract.json"
    ]
    for p in contract_json_paths:
        if p.exists():
            try:
                with open(p, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "contractAddress" in data and data["contractAddress"]:
                        settings.CONTRACT_ADDRESS = data["contractAddress"]
                        break
            except Exception:
                pass
