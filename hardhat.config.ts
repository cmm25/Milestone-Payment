import type { HardhatUserConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatMocha from "@nomicfoundation/hardhat-mocha";
import hardhatChaiMatchers from "@nomicfoundation/hardhat-ethers-chai-matchers";
import hardhatNetworkHelpers from "@nomicfoundation/hardhat-network-helpers";
import * as dotenv from "dotenv";

dotenv.config();

const RSK_TESTNET_RPC = process.env.RSK_TESTNET_RPC || "https://public-node.testnet.rsk.co";
const RSK_MAINNET_RPC = process.env.RSK_MAINNET_RPC || "https://public-node.rsk.co";

const accounts = process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
    plugins: [
        hardhatEthers,
        hardhatMocha,
        hardhatChaiMatchers,
        hardhatNetworkHelpers,
    ],
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
            accounts,
            gasPrice: 60000000
        },
        rskMainnet: {
            type: "http",
            url: RSK_MAINNET_RPC,
            chainId: 30,
            accounts,
            gasPrice: 60000000
        }
    },
    paths: {
        sources: "./contracts",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};

export default config;