import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("FreelanceEscrowModule", (m) => {
    const escrow = m.contract("FreelanceEscrow");
    return { escrow };
});
