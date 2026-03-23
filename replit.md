# Rootstock Project

A decentralized, milestone-based payment escrow system built with Hardhat and Solidity, designed for the Rootstock (RSK) blockchain network.

## Project Overview

This project implements a smart contract (`FreelanceEscrow`) that enables trustless project management between clients and freelancers:
- Clients lock the full budget upfront in the contract
- Funds are released per milestone upon approval
- Funds are refunded if deadlines are missed

## Tech Stack

- **Smart Contract Language:** Solidity 0.8.20
- **Framework:** Hardhat 3.x
- **Libraries:** OpenZeppelin v5 (ReentrancyGuard, Ownable, Pausable)
- **Blockchain Interaction:** Ethers.js v6
- **Testing:** Mocha/Chai
- **Language:** TypeScript
- **Package Manager:** npm (with `--legacy-peer-deps` due to peer dependency conflicts)
- **Runtime:** Node.js 22

## Project Structure

```
contracts/
  FreeLance.sol              # Main FreelanceEscrow contract
  base/Escrow.sol            # Abstract base contract
  interfaces/MilestoneInterface.sol
  libraries/MilestoneLib.sol
ignition/modules/            # Hardhat Ignition deployment modules
scripts/                     # Utility scripts
test/                        # Test files
hardhat.config.ts            # Hardhat configuration
```

## Configuration Changes from Upstream

- `hardhat.config.ts`: Changed Solidity version from `0.8.19` to `0.8.20` (required by OpenZeppelin v5)
- `hardhat.config.ts`: Changed import from `@nomicfoundation/hardhat-toolbox` to `@nomicfoundation/hardhat-toolbox-mocha-ethers` (the installed package)
- `hardhat.config.ts`: Changed localhost network port from 8545 to 8000 (Replit supported port)
- Node.js upgraded from 20 to 22 (required by Hardhat 3.x)

## Workflow

- **Start application**: Runs a local Hardhat node (`npx hardhat node --port 8000`)

## Networks

- **Hardhat (local):** Port 8000, Chain ID 31337
- **RSK Testnet:** Chain ID 31, RPC from `RSK_TESTNET_RPC` env var
- **RSK Mainnet:** Chain ID 30, RPC from `RSK_MAINNET_RPC` env var

## Environment Variables

- `PRIVATE_KEY`: Wallet private key for RSK deployments (defaults to Hardhat test key)
- `RSK_TESTNET_RPC`: RSK Testnet RPC URL
- `RSK_MAINNET_RPC`: RSK Mainnet RPC URL

## Common Commands

```bash
npm run compile   # Compile contracts
npm run test      # Run tests
npm run node      # Start local node on port 8000
npx hardhat node --port 8000   # Same as above
```
