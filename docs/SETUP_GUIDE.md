# ChainProof - Setup and Execution Guide

This guide covers local environment setup, PostgreSQL configuration, Hardhat blockchain network setup, smart contract deployment, running the FastAPI backend, and executing automated test suites.

---

## 1. Prerequisites

- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ & npm
- PostgreSQL (or Docker for running PostgreSQL container)
- Git

---

## 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```

Key environment variables in `.env`:
```ini
# Application
PROJECT_NAME="ChainProof"
DEBUG=True
API_V1_STR="/api/v1"
SECRET_KEY="replace_with_strong_secret_key_minimum_32_chars"

# Database (PostgreSQL URL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chainproof"

# Storage
UPLOAD_DIR="uploads"
MAX_FILE_SIZE_MB=25

# Blockchain (Hardhat local network)
BLOCKCHAIN_RPC_URL="http://127.0.0.1:8545"
BLOCKCHAIN_NETWORK_NAME="hardhat_local"
CHAIN_ID=31337
CONTRACT_ADDRESS="0x5FbDB2315678afecb367f032d93F642f64180aa3"
DEPLOYER_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
```

> **Note**: For local development without a running PostgreSQL daemon, set `DATABASE_URL="sqlite:///./chainproof.db"`.

---

## 3. Blockchain Setup (Hardhat & Solidity)

### Install Blockchain Dependencies
```bash
cd blockchain
npm install
```

### Compile Smart Contracts
```bash
npx hardhat compile
```

### Run Smart Contract Tests
```bash
npx hardhat test
```
All 11 unit tests verify contract deployment, fingerprint registration, duplicate prevention, version incrementation, competing claims, and read-only verification.

### Start Local Blockchain Node
In a separate terminal window:
```bash
cd blockchain
npx hardhat node
```
This runs a local Ethereum JSON-RPC node listening at `http://127.0.0.1:8545` with 20 funded test accounts.

### Deploy IPRegistry Contract
In another terminal:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
The script deploys `IPRegistry.sol` and saves contract address and ABI into `deployed_contract.json` (auto-syncing to `backend/app/blockchain/deployed_contract.json`).

---

## 4. Backend Dependencies & Startup

### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Run Database Migrations
```bash
cd backend
python -m alembic upgrade head
```

### Launch Development Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Access the interactive API documentation at:
- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 5. Frontend Setup & Execution (React + Vite)

### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Launch Frontend Development Server
```bash
cd frontend
npm run dev
```

The React SPA will start at [http://localhost:5173](http://localhost:5173).

### Build Frontend for Production
```bash
cd frontend
npm run build
```

---

## 6. Running Automated Tests

### Run Backend & Blockchain Integration Tests
```bash
python -m pytest backend/tests -v
```

### Run Smart Contract Tests
```bash
cd blockchain
npx hardhat test
```
