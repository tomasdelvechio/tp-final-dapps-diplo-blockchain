# Project: UNLu Academic Credentials Verification (TP Final)

This project is a decentralized application (dApp) for issuing and verifying academic credentials at the Universidad Nacional de Luján (UNLu). It uses "Soulbound" tokens (non-transferable NFTs) to represent academic achievements.

## 🏗 Architecture & Tech Stack

The project is structured as a monorepo:

- **`blockchain/`**: Smart contract development using **Foundry**.
  - **Framework**: Foundry (Forge, Cast, Anvil, Script).
  - **Contracts**: Solidity, OpenZeppelin (AccessControl, ERC721URIStorage).
  - **Network**: Base Sepolia (Layer 2).
- **`frontend/`**: Web interface using **Next.js**.
  - **Libraries**: Wagmi, Viem, React.
  - **Styling**: Vanilla CSS (based on the starter template).

## 🚀 Key Commands (Inferred from Planning)

### Blockchain (Inside `blockchain/` folder)

- **Initialize**: `forge init`
- **Install Dependencies**: `forge install openzeppelin/openzeppelin-contracts`
- **Build**: `forge build`
- **Test**: `forge test`
- **Coverage**: `forge coverage --report lcov`
- **Security Audit**: `slither .`
- **Deploy**: `source .env && forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY`

### Frontend (Inside `frontend/` folder)

- **Install Dependencies**: `npm install`
- **Run Development Server**: `npm run dev`
- **Build**: `npm run build`

## 📋 Development Conventions

- **Soulbound Tokens**: Credentials MUST be non-transferable. The `_update` function in Solidity is overridden to revert on transfers.
- **Role-Based Access Control**: 
  - `DEFAULT_ADMIN_ROLE`: Manage issuers.
  - `ISSUER_ROLE`: Issue new credentials.
- **Metadata**: Credentials store a hash (`keccak256`) of the student's name and ID, along with an optional URI (e.g., IPFS) for the full certificate.
- **Security**: Mandatory local audit using Slither before deployment.
- **Testing**: Minimum 80% coverage required. Include unit tests for "happy path", revert on transfer, and basic fuzzing.

## 📂 Directory Structure Overview

- `docs/`: Academic material and lessons from the Diploma course.
- `planning/`: Project requirements and execution plans.
- `blockchain/`: (To be created) Smart contract source, tests, and scripts.
- `frontend/`: (To be created) Next.js application.

## 📝 Next Steps (Roadmap)

1. Initialize the monorepo structure.
2. Set up the `blockchain/` folder with Foundry.
3. Implement `AcademicCredentials.sol` with OpenZeppelin.
4. Set up the `frontend/` folder with the provided starter.
5. Deploy to Base Sepolia and connect the UI.
