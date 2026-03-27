import { expect } from "chai";
import { ethers, deployEscrow, createProject, AMOUNTS, days, increaseTime } from "./helpers/fixtures.js";

describe("claimExpired", function () {

    let escrow: any;
    let client: any;
    let freelancer: any;
    let stranger: any;
    let projectId: bigint;

    beforeEach(async function () {
        ({ escrow, client, freelancer, stranger } = await deployEscrow());
        projectId = await createProject(escrow, client, freelancer);
    });

    it("marks milestone EXPIRED and sets isPaid after deadline passes", async function () {
        await increaseTime(days(8));

        await escrow.connect(client).claimExpired(projectId, 0);

        const milestone = await escrow.getMilestone(projectId, 0);
        expect(milestone.status).to.equal(3n);
        expect(milestone.isPaid).to.equal(true);
    });

    it("refunds the correct amount to the client", async function () {
        await increaseTime(days(8));

        const before = await ethers.provider.getBalance(client.address);
        const tx = await escrow.connect(client).claimExpired(projectId, 0);
        const receipt = await tx.wait();
        const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
        const after = await ethers.provider.getBalance(client.address);

        expect(after - before + gasUsed).to.equal(AMOUNTS[0]);
    });

    it("reduces remainingBudget by the refunded amount", async function () {
        await increaseTime(days(8));
        await escrow.connect(client).claimExpired(projectId, 0);

        const project = await escrow.getProject(projectId);
        const expected = AMOUNTS[1] + AMOUNTS[2];
        expect(project.remainingBudget).to.equal(expected);
    });

    it("emits MilestoneExpired with correct arguments", async function () {
        await increaseTime(days(8));

        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.emit(escrow, "MilestoneExpired")
            .withArgs(projectId, 0n, AMOUNTS[0]);
    });

    it("can also expire a SUBMITTED milestone whose deadline passed", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await increaseTime(days(8));

        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.emit(escrow, "MilestoneExpired");
    });

    it("closes project and emits ProjectCompleted when last milestone expires", async function () {
        for (let i = 0; i < 2; i++) {
            await escrow.connect(freelancer).submitMilestone(projectId, i);
            await escrow.connect(client).approveMilestone(projectId, i);
        }

        await increaseTime(days(22));

        await expect(
            escrow.connect(client).claimExpired(projectId, 2)
        ).to.emit(escrow, "ProjectCompleted").withArgs(projectId);

        const project = await escrow.getProject(projectId);
        expect(project.isActive).to.equal(false);
    });

    it("does not close project when only some milestones are resolved", async function () {
        await increaseTime(days(8));
        await escrow.connect(client).claimExpired(projectId, 0);

        const project = await escrow.getProject(projectId);
        expect(project.isActive).to.equal(true);
    });

    it("drains contract balance to zero when all milestones expire", async function () {
        await increaseTime(days(22));

        for (let i = 0; i < 3; i++) {
            await escrow.connect(client).claimExpired(projectId, i);
        }

        const balance = await ethers.provider.getBalance(await escrow.getAddress());
        expect(balance).to.equal(0n);
    });

    it("reverts if deadline has not yet passed", async function () {
        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.be.revertedWith("Deadline has not passed");
    });

    it("reverts if milestone is already APPROVED", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(client).approveMilestone(projectId, 0);

        await increaseTime(days(8));

        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.be.revertedWith("Milestone already resolved");
    });

    it("reverts if milestone is already EXPIRED (double claim)", async function () {
        await increaseTime(days(8));
        await escrow.connect(client).claimExpired(projectId, 0);

        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.be.revertedWith("Milestone already resolved");
    });

    it("reverts if called by the freelancer", async function () {
        await increaseTime(days(8));

        await expect(
            escrow.connect(freelancer).claimExpired(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if called by a stranger", async function () {
        await increaseTime(days(8));

        await expect(
            escrow.connect(stranger).claimExpired(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if milestone ID is out of range", async function () {
        await increaseTime(days(8));

        await expect(
            escrow.connect(client).claimExpired(projectId, 99)
        ).to.be.revertedWithCustomError(escrow, "MilestoneNotFound");
    });

    it("reverts if project does not exist", async function () {
        await expect(
            escrow.connect(client).claimExpired(999n, 0)
        ).to.be.revertedWithCustomError(escrow, "ProjectNotFound");
    });

});
