import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FreelanceEscrowModule", (m) => {
    const deployer = m.getAccount(0);
    const escrow = m.contract("FreelanceEscrow", [deployer]);
    return { escrow };
});