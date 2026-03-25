# Rootstock Project

A decentralized, milestone-based payment escrow system built with Hardhat and Solidity, designed for the Rootstock (RSK) blockchain network.

## Project Overview

`FreelanceEscrow` enables trustless project management between clients and freelancers:
- Clients lock the full budget upfront in the contract
- Funds are released per milestone upon client approval
- Funds are refunded per milestone if deadlines are missed
- Owner can pause all operations in an emergency

## Tech Stack

- **Smart Contract Language:** Solidity 0.8.20
- **Framework:** Hardhat 3.x
- **Libraries:** OpenZeppelin v5 (ReentrancyGuard, Ownable, Pausable)
- **Blockchain Interaction:** Ethers.js v6
- **Testing:** Mocha + Chai (via `@nomicfoundation/hardhat-mocha` and `hardhat-ethers-chai-matchers`)
- **Language:** TypeScript
- **Package Manager:** npm (with `--legacy-peer-deps`)
- **Runtime:** Node.js 22

## Project Structure

```
contracts/
  FreeLance.sol                   # Main FreelanceEscrow contract
  base/Escrow.sol                 # Abstract base (storage, modifiers, pause/unpause)
  interfaces/MilestoneInterface.sol
  libraries/MilestoneLib.sol

test/
  helpers/
    fixtures.ts                   # Shared setup: deploy, signers, constants, time helpers
  deployment.test.ts              # Deployment tests
  createProject.test.ts           # Project creation tests
  submitMilestone.test.ts         # Milestone submission tests
  approveMilestone.test.ts        # Milestone approval + payment tests
  claimExpired.test.ts            # Expired milestone refund tests
  pause.test.ts                   # Pause / unpause tests
  views.test.ts                   # View function tests

hardhat.config.ts                 # Hardhat configuration with explicit plugins
```

## Plugin Configuration (Hardhat 3)

In Hardhat 3, plugins must be declared in `config.plugins` (not just imported):

```ts
plugins: [
    hardhatEthers,
    hardhatMocha,
    hardhatChaiMatchers,
    hardhatNetworkHelpers,
]
```

## Changes from Upstream

- Solidity: `0.8.19` → `0.8.20` (required by OpenZeppelin v5)
- Plugin import: `hardhat-toolbox` → explicit minimal plugin list
- Plugin registration: `import "..."` → `config.plugins: [...]` (Hardhat 3 requirement)
- Localhost port: `8545` → `8000` (Replit supported port)
- Node.js: upgraded from 20 to 22 (required by Hardhat 3)
- `contracts/base/Escrow.sol`: Added public `pause()` / `unpause()` (OZ v5 makes them internal)
- `contracts/FreeLance.sol`: Added `_allMilestonesResolved` check to `claimExpired` (bug fix)

## Test Suite (78 tests, all passing)

```
Deployment          (3)  — owner, unpaused state, zero balance
createProject      (14)  — happy path, 9 validation failures
submitMilestone     (8)  — status change, access control, edge cases
approveMilestone   (14)  — payment, budget, project completion, access control
claimExpired       (13)  — refund, time checks, project closure, access control
Pause / Unpause    (10)  — owner control, blocks all operations, unpause recovery
View functions     (11)  — getProject and getMilestone across all state changes
```

## Workflow

- **Start application**: Runs local Hardhat node (`npx hardhat node --port 8000`)

## Common Commands

```bash
npm run compile   # Compile contracts
npm test          # Run all 78 tests
npm run node      # Start local node on port 8000
```

## Networks

- **Hardhat (local):** Port 8000, Chain ID 31337
- **RSK Testnet:** Chain ID 31, RPC from `RSK_TESTNET_RPC` env var
- **RSK Mainnet:** Chain ID 30, RPC from `RSK_MAINNET_RPC` env var

## Environment Variables

- `PRIVATE_KEY`: Wallet private key for RSK deployments
- `RSK_TESTNET_RPC`: RSK Testnet RPC URL
- `RSK_MAINNET_RPC`: RSK Mainnet RPC URL
