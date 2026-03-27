import { network } from "hardhat";

export const { ethers } = await network.connect();

export const DESCRIPTIONS = ["Design mockups", "Frontend build", "Deployment"];

export const AMOUNTS = [
    ethers.parseEther("0.2"),
    ethers.parseEther("0.5"),
    ethers.parseEther("0.3"),
];

export const TOTAL_BUDGET = ethers.parseEther("1.0");

export function days(n: number): number {
    return n * 24 * 60 * 60;
}

export async function currentTime(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
}

export async function increaseTime(seconds: number): Promise<void> {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine", []);
}

export async function getDeadlines(): Promise<number[]> {
    const now = await currentTime();
    return [now + days(7), now + days(14), now + days(21)];
}

export async function deployEscrow() {
    const [owner, client, freelancer, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("FreelanceEscrow");
    const escrow = await Factory.deploy(owner.address);
    await escrow.waitForDeployment();
    return { escrow, owner, client, freelancer, stranger };
}

export async function createProject(escrow: any, client: any, freelancer: any): Promise<bigint> {
    const deadlines = await getDeadlines();
    const tx = await escrow.connect(client).createProject(
        freelancer.address,
        DESCRIPTIONS,
        AMOUNTS,
        deadlines,
        { value: TOTAL_BUDGET }
    );
    const receipt = await tx.wait();
    const event = receipt?.logs
        .map((log: any) => {
            try { return escrow.interface.parseLog(log); }
            catch { return null; }
        })
        .find((e: any) => e?.name === "ProjectCreated");
    return event!.args.projectId;
}

export async function setupProject() {
    const ctx = await deployEscrow();
    const projectId = await createProject(ctx.escrow, ctx.client, ctx.freelancer);
    return { ...ctx, projectId };
}
