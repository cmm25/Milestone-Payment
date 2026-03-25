import { expect } from "chai";
import { ethers, deployEscrow, createProject, AMOUNTS, TOTAL_BUDGET } from "./helpers/fixtures.js";

describe("approveMilestone", function () {

    let escrow: any;
    let client: any;
    let freelancer: any;
    let stranger: any;
    let projectId: bigint;

    beforeEach(async function () {
        ({ escrow, client, freelancer, stranger } = await deployEscrow());
        projectId = await createProject(escrow, client, freelancer);
    });

    it("marks milestone APPROVED and sets isPaid", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(client).approveMilestone(projectId, 0);

        const milestone = await escrow.getMilestone(projectId, 0);
        expect(milestone.status).to.equal(2n);
        expect(milestone.isPaid).to.equal(true);
    });

    it("transfers the correct amount to the freelancer", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        const before = await ethers.provider.getBalance(freelancer.address);
        await escrow.connect(client).approveMilestone(projectId, 0);
        const after = await ethers.provider.getBalance(freelancer.address);

        expect(after - before).to.equal(AMOUNTS[0]);
    });

    it("reduces remainingBudget by the milestone amount", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(client).approveMilestone(projectId, 0);

        const project = await escrow.getProject(projectId);
        expect(project.remainingBudget).to.equal(TOTAL_BUDGET - AMOUNTS[0]);
    });

    it("reduces contract balance by the milestone amount", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        const before = await ethers.provider.getBalance(await escrow.getAddress());
        await escrow.connect(client).approveMilestone(projectId, 0);
        const after = await ethers.provider.getBalance(await escrow.getAddress());

        expect(before - after).to.equal(AMOUNTS[0]);
    });

    it("emits MilestoneApproved with correct arguments", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        await expect(
            escrow.connect(client).approveMilestone(projectId, 0)
        ).to.emit(escrow, "MilestoneApproved")
            .withArgs(projectId, 0n, AMOUNTS[0]);
    });

    it("approves all milestones sequentially and drains contract balance", async function () {
        let remaining = TOTAL_BUDGET;

        for (let i = 0; i < 3; i++) {
            await escrow.connect(freelancer).submitMilestone(projectId, i);
            await escrow.connect(client).approveMilestone(projectId, i);
            remaining -= AMOUNTS[i];

            const project = await escrow.getProject(projectId);
            expect(project.remainingBudget).to.equal(remaining);
        }

        const contractBalance = await ethers.provider.getBalance(await escrow.getAddress());
        expect(contractBalance).to.equal(0n);
    });

    it("closes project and emits ProjectCompleted after final approval", async function () {
        for (let i = 0; i < 2; i++) {
            await escrow.connect(freelancer).submitMilestone(projectId, i);
            await escrow.connect(client).approveMilestone(projectId, i);
        }

        await escrow.connect(freelancer).submitMilestone(projectId, 2);

        await expect(
            escrow.connect(client).approveMilestone(projectId, 2)
        ).to.emit(escrow, "ProjectCompleted").withArgs(projectId);

        const project = await escrow.getProject(projectId);
        expect(project.isActive).to.equal(false);
    });

    it("does not close project while milestones remain PENDING", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(client).approveMilestone(projectId, 0);

        const project = await escrow.getProject(projectId);
        expect(project.isActive).to.equal(true);
    });

    it("reverts if called by the freelancer", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        await expect(
            escrow.connect(freelancer).approveMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if called by a stranger", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        await expect(
            escrow.connect(stranger).approveMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if milestone is still PENDING (never submitted)", async function () {
        await expect(
            escrow.connect(client).approveMilestone(projectId, 0)
        ).to.be.revertedWith("Milestone not submitted");
    });

    it("reverts if milestone is already APPROVED (double approval)", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(client).approveMilestone(projectId, 0);

        await expect(
            escrow.connect(client).approveMilestone(projectId, 0)
        ).to.be.revertedWith("Milestone not submitted");
    });

    it("reverts if project does not exist", async function () {
        await expect(
            escrow.connect(client).approveMilestone(999n, 0)
        ).to.be.revertedWithCustomError(escrow, "ProjectNotFound");
    });

    it("reverts if milestone ID is out of range", async function () {
        await expect(
            escrow.connect(client).approveMilestone(projectId, 99)
        ).to.be.revertedWithCustomError(escrow, "MilestoneNotFound");
    });

});
