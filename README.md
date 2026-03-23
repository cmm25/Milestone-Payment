# Milestone Payment Escrow on Rootstock

A trustless milestone-based payment system for freelancers built on Rootstock Testnet. Clients lock a full project budget upfront. Payments release per milestone on approval. Missed deadlines automatically refund the client. No middleman required.

---

## Contract Architecture

The system is four Solidity files, each with one job:

```
contracts/
├── interfaces/
│   └── IMilestoneEscrow.sol    ← defines the public API
├── libraries/
│   └── MilestoneLib.sol        ← stateless validation logic
├── base/
│   └── EscrowBase.sol          ← security, storage, modifiers
└── FreelanceEscrow.sol         ← the deployed contract
```

**IMilestoneEscrow.sol**
Interface that declares all functions, events, and the `MilestoneStatus` enum. Any external contract can interact with this system by importing only this file.

**MilestoneLib.sol**
A Solidity library with pure validation functions — array length checks, budget validation, deadline range checks, expiry detection. No state, no funds, no side effects.

**EscrowBase.sol**
Abstract base contract. Inherits OpenZeppelin's `ReentrancyGuard`, `Ownable`, and `Pausable`. Defines the `Project` and `Milestone` structs, storage mappings, access control modifiers, and the internal transfer helper.

**FreelanceEscrow.sol**
The only deployed contract. Implements the four core functions on top of everything `EscrowBase` provides.

---

## Milestone Lifecycle

Each milestone moves through four possible states:

```
PENDING → SUBMITTED → APPROVED   (freelancer receives payment)
PENDING →             EXPIRED    (client receives refund)
SUBMITTED →           EXPIRED    (client receives refund if deadline passes)
```

States are enforced on-chain. No state can be skipped or reversed.

---

## Core Functions

| Function | Who calls it | What it does |
|----------|-------------|--------------|
| `createProject()` | Client | Locks full RBTC budget, stores milestones |
| `submitMilestone()` | Freelancer | Marks a milestone as submitted |
| `approveMilestone()` | Client | Approves work, releases payment to freelancer |
| `claimExpired()` | Client | Reclaims funds for a deadline-missed milestone |
| `getProject()` | Anyone | Reads project state |
| `getMilestone()` | Anyone | Reads a specific milestone state |

---

## Project Structure

```
├── contracts/
│   ├── interfaces/
│   │   └── IMilestoneEscrow.sol
│   ├── libraries/
│   │   └── MilestoneLib.sol
│   ├── base/
│   │   └── EscrowBase.sol
│   └── FreelanceEscrow.sol
├── test/
│   └── FreelanceEscrow.test.ts
├── scripts/
│   └── deploy.ts
├── hardhat.config.ts
├── .env
└── README.md
```

---

## Getting Started

**Install dependencies**
```bash
npm install
```

**Compile**
```bash
npx hardhat compile
```

**Test**
```bash
npx hardhat test
```

**Test with gas report**
```bash
REPORT_GAS=true npx hardhat test
```

**Deploy to Rootstock Testnet**
```bash
npx hardhat run scripts/deploy.ts --network rskTestnet
```

---

## Environment Variables

Create a `.env` file in the project root:

```
PRIVATE_KEY=your_wallet_private_key
RSK_TESTNET_RPC=https://public-node.testnet.rsk.co
```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Solidity 0.8.19 | Smart contract language |
| Hardhat | Development and testing |
| OpenZeppelin | Security primitives |
| Ethers.js | Blockchain interaction |
| Rootstock Testnet | Deployment network |

---
