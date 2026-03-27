import { expect } from "chai";
import { deployEscrow, createProject, DESCRIPTIONS, AMOUNTS, TOTAL_BUDGET, days, increaseTime } from "./helpers/fixtures.js";

describe("View functions", function () {

    let escrow: any;
    let client: any;
    let freelancer: any;
    let projectId: bigint;

    beforeEach(async function () {
        ({ escrow, client, freelancer } = await deployEscrow());
        projectId = await createProject(escrow, client, freelancer);
    });

    describe("getProject", function () {

        it("returns all project fields correctly on creation", async function () {
            const project = await escrow.getProject(projectId);

            expect(project.client).to.equal(client.address);
            expect(project.freelancer).to.equal(freelancer.address);
            expect(project.totalBudget).to.equal(TOTAL_BUDGET);
            expect(project.remainingBudget).to.equal(TOTAL_BUDGET);
            expect(project.milestoneCount).to.equal(3n);
            expect(project.isActive).to.equal(true);
        });

        it("milestoneCount reflects the number of milestones created", async function () {
            const project = await escrow.getProject(projectId);
            expect(project.milestoneCount).to.equal(BigInt(DESCRIPTIONS.length));
        });

        it("remainingBudget decreases after each approval", async function () {
            for (let i = 0; i < 3; i++) {
                await escrow.connect(freelancer).submitMilestone(projectId, i);
                await escrow.connect(client).approveMilestone(projectId, i);

                const project = await escrow.getProject(projectId);
                const expectedRemaining = AMOUNTS.slice(i + 1).reduce((a, b) => a + b, 0n);
                expect(project.remainingBudget).to.equal(expectedRemaining);
            }
        });

        it("isActive becomes false when all milestones are approved", async function () {
            for (let i = 0; i < 3; i++) {
                await escrow.connect(freelancer).submitMilestone(projectId, i);
                await escrow.connect(client).approveMilestone(projectId, i);
            }

            const project = await escrow.getProject(projectId);
            expect(project.isActive).to.equal(false);
        });

        it("isActive becomes false when all milestones expire", async function () {
            await increaseTime(days(22));

            for (let i = 0; i < 3; i++) {
                await escrow.connect(client).claimExpired(projectId, i);
            }

            const project = await escrow.getProject(projectId);
            expect(project.isActive).to.equal(false);
        });

        it("returns correct data for a non-existent project without reverting", async function () {
            const project = await escrow.getProject(999n);
            expect(project.client).to.equal("0x0000000000000000000000000000000000000000");
            expect(project.totalBudget).to.equal(0n);
        });

    });

    describe("getMilestone", function () {

        it("returns all milestone fields correctly on creation", async function () {
            for (let i = 0; i < 3; i++) {
                const milestone = await escrow.getMilestone(projectId, i);
                expect(milestone.description).to.equal(DESCRIPTIONS[i]);
                expect(milestone.amount).to.equal(AMOUNTS[i]);
                expect(milestone.status).to.equal(0n);
                expect(milestone.isPaid).to.equal(false);
            }
        });

        it("status updates from PENDING to SUBMITTED after submit", async function () {
            await escrow.connect(freelancer).submitMilestone(projectId, 1);

            const milestone = await escrow.getMilestone(projectId, 1);
            expect(milestone.status).to.equal(1n);
            expect(milestone.isPaid).to.equal(false);
        });

        it("status updates to APPROVED and isPaid after approval", async function () {
            await escrow.connect(freelancer).submitMilestone(projectId, 1);
            await escrow.connect(client).approveMilestone(projectId, 1);

            const milestone = await escrow.getMilestone(projectId, 1);
            expect(milestone.status).to.equal(2n);
            expect(milestone.isPaid).to.equal(true);
        });

        it("status updates to EXPIRED and isPaid after claim", async function () {
            await increaseTime(days(8));
            await escrow.connect(client).claimExpired(projectId, 0);

            const milestone = await escrow.getMilestone(projectId, 0);
            expect(milestone.status).to.equal(3n);
            expect(milestone.isPaid).to.equal(true);
        });

        it("adjacent milestones are unaffected by changes to one milestone", async function () {
            await escrow.connect(freelancer).submitMilestone(projectId, 0);
            await escrow.connect(client).approveMilestone(projectId, 0);

            const m1 = await escrow.getMilestone(projectId, 1);
            const m2 = await escrow.getMilestone(projectId, 2);

            expect(m1.status).to.equal(0n);
            expect(m2.status).to.equal(0n);
            expect(m1.isPaid).to.equal(false);
            expect(m2.isPaid).to.equal(false);
        });

    });

});
