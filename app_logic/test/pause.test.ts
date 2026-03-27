import { expect } from "chai";
import { deployEscrow, createProject, getDeadlines, DESCRIPTIONS, AMOUNTS, TOTAL_BUDGET } from "./helpers/fixtures.js";

describe("Pause / Unpause", function () {

    let escrow: any;
    let owner: any;
    let client: any;
    let freelancer: any;
    let stranger: any;
    let projectId: bigint;

    beforeEach(async function () {
        ({ escrow, owner, client, freelancer, stranger } = await deployEscrow());
        projectId = await createProject(escrow, client, freelancer);
    });

    it("owner can pause the contract", async function () {
        await escrow.connect(owner).pause();
        expect(await escrow.paused()).to.equal(true);
    });

    it("owner can unpause the contract", async function () {
        await escrow.connect(owner).pause();
        await escrow.connect(owner).unpause();
        expect(await escrow.paused()).to.equal(false);
    });

    it("blocks createProject when paused", async function () {
        await escrow.connect(owner).pause();
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("blocks submitMilestone when paused", async function () {
        await escrow.connect(owner).pause();

        await expect(
            escrow.connect(freelancer).submitMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("blocks approveMilestone when paused", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);
        await escrow.connect(owner).pause();

        await expect(
            escrow.connect(client).approveMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("blocks claimExpired when paused", async function () {
        await escrow.connect(owner).pause();

        await expect(
            escrow.connect(client).claimExpired(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "EnforcedPause");
    });

    it("allows normal operations after unpause", async function () {
        await escrow.connect(owner).pause();
        await escrow.connect(owner).unpause();

        await expect(
            escrow.connect(freelancer).submitMilestone(projectId, 0)
        ).to.emit(escrow, "MilestoneSubmitted");
    });

    it("reverts if a stranger tries to pause", async function () {
        await expect(
            escrow.connect(stranger).pause()
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("reverts if a stranger tries to unpause", async function () {
        await escrow.connect(owner).pause();

        await expect(
            escrow.connect(stranger).unpause()
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

    it("reverts if client tries to pause", async function () {
        await expect(
            escrow.connect(client).pause()
        ).to.be.revertedWithCustomError(escrow, "OwnableUnauthorizedAccount");
    });

});
