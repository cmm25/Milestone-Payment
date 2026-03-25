import { expect } from "chai";
import { deployEscrow, createProject } from "./helpers/fixtures.js";

describe("submitMilestone", function () {

    let escrow: any;
    let client: any;
    let freelancer: any;
    let stranger: any;
    let projectId: bigint;

    beforeEach(async function () {
        ({ escrow, client, freelancer, stranger } = await deployEscrow());
        projectId = await createProject(escrow, client, freelancer);
    });

    it("changes milestone status from PENDING to SUBMITTED", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        const milestone = await escrow.getMilestone(projectId, 0);
        expect(milestone.status).to.equal(1n);
    });

    it("emits MilestoneSubmitted with correct arguments", async function () {
        await expect(
            escrow.connect(freelancer).submitMilestone(projectId, 0)
        ).to.emit(escrow, "MilestoneSubmitted")
            .withArgs(projectId, 0n);
    });

    it("allows freelancer to submit each milestone independently", async function () {
        for (let i = 0; i < 3; i++) {
            await escrow.connect(freelancer).submitMilestone(projectId, i);
            const milestone = await escrow.getMilestone(projectId, i);
            expect(milestone.status).to.equal(1n);
        }
    });

    it("reverts if called by the client", async function () {
        await expect(
            escrow.connect(client).submitMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if called by a stranger", async function () {
        await expect(
            escrow.connect(stranger).submitMilestone(projectId, 0)
        ).to.be.revertedWithCustomError(escrow, "NotAuthorized");
    });

    it("reverts if milestone is already SUBMITTED", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        await expect(
            escrow.connect(freelancer).submitMilestone(projectId, 0)
        ).to.be.revertedWith("Milestone not pending");
    });

    it("reverts if milestone ID is out of range", async function () {
        await expect(
            escrow.connect(freelancer).submitMilestone(projectId, 99)
        ).to.be.revertedWithCustomError(escrow, "MilestoneNotFound");
    });

    it("reverts if project does not exist", async function () {
        await expect(
            escrow.connect(freelancer).submitMilestone(999n, 0)
        ).to.be.revertedWithCustomError(escrow, "ProjectNotFound");
    });

    it("does not change isPaid when submitting", async function () {
        await escrow.connect(freelancer).submitMilestone(projectId, 0);

        const milestone = await escrow.getMilestone(projectId, 0);
        expect(milestone.isPaid).to.equal(false);
    });

});
