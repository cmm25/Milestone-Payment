import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RSK_TESTNET_RPC = process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co";
const RSK_MAINNET_RPC = process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
      hardhat: {
          type: "edr-simulated",
          chainId: 31337
      },
      localhost: {
          type: "http",
          url: "http://127.0.0.1:8000",
          chainId: 31337,
      },
      rskTestnet: {
          type: "http",
          url: RSK_TESTNET_RPC,
          chainId: 31,
          accounts: [PRIVATE_KEY],
          gasPrice: 60000000
      },
      rskMainnet: {
          type: "http",
          url: RSK_MAINNET_RPC,
          chainId: 30,
          accounts: [PRIVATE_KEY],
          gasPrice: 60000000
      }
  },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};

export default config;
