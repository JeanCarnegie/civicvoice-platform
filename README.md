# CivicVoice

CivicVoice is a privacy-preserving civic feedback platform that enables citizens to anonymously rate public services using Fully Homomorphic Encryption (FHE) technology. The platform aggregates satisfaction scores across multiple service categories while protecting individual feedback privacy.

## Features

- **Anonymous Rating Submission**: Citizens can submit encrypted satisfaction scores for various public service categories
- **Encrypted Aggregation**: FHE-based computation ensures individual feedback remains private during aggregation
- **City-Wide Reports**: Generate average satisfaction scores and trend analysis across all categories
- **Public Visualization**: Anonymous public dashboard with radar charts and trend visualizations
- **Wallet Integration**: Seamless MetaMask and EIP-6963 wallet support with persistent connection

## Architecture

The project consists of two main components:

### Smart Contracts (`fhevm-hardhat-template/`)

FHEVM-based Solidity smart contracts for encrypted score submission and aggregation:

- **CivicVoiceFeedback.sol**: Main contract handling encrypted score submissions and aggregations
- Uses FHEVM v0.9 with `euint32` for encrypted integer operations
- Supports 5 service categories: Transportation, Utilities, Safety, Sanitation, and Custom
- Batch authorization and decryption for efficient data access

### Frontend (`civicvoice-frontend/`)

Next.js 15 static export application with:

- **Dual Development Modes**: 
  - `dev:mock`: Local development with `@fhevm/mock-utils`
  - `dev`: Production mode with `@zama-fhe/relayer-sdk`
- **Wallet Integration**: EIP-6963 wallet discovery with silent reconnection
- **Data Visualization**: Radar charts and trend analysis using Recharts
- **Static Export**: Fully static site deployable to any hosting platform

## Tech Stack

- **Smart Contracts**: Solidity, Hardhat, FHEVM v0.9.1
- **Frontend**: Next.js 15, React 19, TypeScript
- **Encryption**: FHEVM v0.9.1, Relayer SDK 0.3.0-5
- **State Management**: Zustand, TanStack Query
- **Visualization**: Recharts
- **Wallet**: Ethers.js v6, EIP-6963

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- MetaMask or compatible Web3 wallet
- For local development: Hardhat node running on localhost:8545

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd civicvoice
   ```

2. **Install contract dependencies**

   ```bash
   cd fhevm-hardhat-template
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../civicvoice-frontend
   npm install
   ```

### Development

#### Smart Contracts

1. **Start local Hardhat node**

   ```bash
   cd fhevm-hardhat-template
   npx hardhat node
   ```

2. **Deploy contracts**

   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Run tests**

   ```bash
   npx hardhat test
   ```

#### Frontend

1. **Generate ABI and address mappings**

   ```bash
   cd civicvoice-frontend
   npm run genabi
   ```

2. **Start development server (Mock mode)**

   ```bash
   npm run dev:mock
   ```

   This will:
   - Check if Hardhat node is running
   - Generate ABI files from deployments
   - Start Next.js dev server with mock FHEVM

3. **Start development server (Relayer mode)**

   ```bash
   npm run dev
   ```

   This uses the real Relayer SDK for production-like testing.

### Building

#### Frontend Static Export

```bash
cd civicvoice-frontend
npm run build
```

This will:
- Run static export checks
- Generate ABI files
- Build Next.js static export
- Verify output directory

The static site will be in `civicvoice-frontend/out/` and can be deployed to any static hosting service.

## Project Structure

```
civicvoice/
├── fhevm-hardhat-template/     # Smart contracts
│   ├── contracts/               # Solidity contracts
│   ├── deploy/                  # Deployment scripts
│   ├── test/                    # Contract tests
│   └── tasks/                   # Hardhat tasks
├── civicvoice-frontend/         # Next.js frontend
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   ├── hooks/                   # Custom React hooks
│   ├── fhevm/                   # FHEVM integration
│   ├── lib/                     # Utilities
│   └── abi/                     # Generated ABI files
└── README.md
```

## Deployment

### Smart Contracts

Deploy to Sepolia testnet:

```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### Frontend

The frontend is configured for static export and can be deployed to:

- Vercel (recommended)
- Netlify
- GitHub Pages
- Any static hosting service

See `civicvoice-frontend/next.config.ts` for static export configuration.

## Usage

1. **Connect Wallet**: Click "Connect Wallet" in the navigation bar
2. **Submit Feedback**: Navigate to `/submit` and select a category, enter a score (1-10), and optionally add a comment
3. **View Reports**: Navigate to `/reports` to see aggregated scores across all categories
4. **Authorize & Decrypt**: Click "Authorize all categories" then "Decrypt all averages" to view decrypted results

## Security Considerations

- All scores are encrypted using FHEVM before submission
- Individual feedback cannot be decrypted by anyone except authorized users
- Aggregated averages require explicit authorization via `allowDecryptAll`
- Wallet connection uses EIP-6963 for secure wallet discovery
- Decryption signatures are stored securely and bound to accounts

## License

See LICENSE files in respective directories.

## Support

For issues and questions:
- Check the [FHEVM Documentation](https://docs.zama.ai/fhevm)
- Review contract tests in `fhevm-hardhat-template/test/`
- Check frontend implementation in `civicvoice-frontend/`

---

Built with FHEVM by Zama


