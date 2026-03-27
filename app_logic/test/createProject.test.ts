import { expect } from "chai";
import { ethers, deployEscrow, createProject, getDeadlines, DESCRIPTIONS, AMOUNTS, TOTAL_BUDGET } from "./helpers/fixtures.js";

describe("createProject", function () {

    let escrow: any;
    let client: any;
    let freelancer: any;

    beforeEach(async function () {
        ({ escrow, client, freelancer } = await deployEscrow());
    });

    it("stores project data correctly", async function () {
        const projectId = await createProject(escrow, client, freelancer);
        const project = await escrow.getProject(projectId);

        expect(project.client).to.equal(client.address);
        expect(project.freelancer).to.equal(freelancer.address);
        expect(project.totalBudget).to.equal(TOTAL_BUDGET);
        expect(project.remainingBudget).to.equal(TOTAL_BUDGET);
        expect(project.milestoneCount).to.equal(3n);
        expect(project.isActive).to.equal(true);
    });

    it("stores each milestone correctly", async function () {
        const projectId = await createProject(escrow, client, freelancer);

        for (let i = 0; i < 3; i++) {
            const milestone = await escrow.getMilestone(projectId, i);
            expect(milestone.description).to.equal(DESCRIPTIONS[i]);
            expect(milestone.amount).to.equal(AMOUNTS[i]);
            expect(milestone.status).to.equal(0n);
            expect(milestone.isPaid).to.equal(false);
        }
    });

    it("emits ProjectCreated with correct arguments", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.emit(escrow, "ProjectCreated")
            .withArgs(1n, client.address, freelancer.address, TOTAL_BUDGET, 3n);
    });

    it("locks RBTC inside the contract", async function () {
        const before = await ethers.provider.getBalance(await escrow.getAddress());
        await createProject(escrow, client, freelancer);
        const after = await ethers.provider.getBalance(await escrow.getAddress());

        expect(after - before).to.equal(TOTAL_BUDGET);
    });

    it("assigns incrementing project IDs", async function () {
        const id1 = await createProject(escrow, client, freelancer);
        const id2 = await createProject(escrow, client, freelancer);

        expect(id1).to.equal(1n);
        expect(id2).to.equal(2n);
    });

    it("allows multiple independent projects", async function () {
        const id1 = await createProject(escrow, client, freelancer);
        const id2 = await createProject(escrow, client, freelancer);

        const p1 = await escrow.getProject(id1);
        const p2 = await escrow.getProject(id2);

        expect(p1.totalBudget).to.equal(TOTAL_BUDGET);
        expect(p2.totalBudget).to.equal(TOTAL_BUDGET);
        expect(id1).to.not.equal(id2);
    });

    it("reverts if sent ETH does not match sum of milestone amounts", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: ethers.parseEther("0.5") }
            )
        ).to.be.revertedWithCustomError(escrow, "BudgetMismatch");
    });

    it("reverts if sent ETH exceeds sum of milestone amounts", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: ethers.parseEther("2.0") }
            )
        ).to.be.revertedWithCustomError(escrow, "BudgetMismatch");
    });

    it("reverts if description and amounts arrays differ in length", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                [ethers.parseEther("1.0")],
                deadlines,
                { value: ethers.parseEther("1.0") }
            )
        ).to.be.revertedWithCustomError(escrow, "ArrayLengthMismatch");
    });

    it("reverts if amounts and deadlines arrays differ in length", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                [deadlines[0]],
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWithCustomError(escrow, "ArrayLengthMismatch");
    });

    it("reverts if descriptions array is empty", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                [],
                [],
                [],
                { value: 0n }
            )
        ).to.be.revertedWithCustomError(escrow, "DescriptionEmpty");
    });

    it("reverts if any milestone amount is zero", async function () {
        const deadlines = await getDeadlines();
        const badAmounts = [
            ethers.parseEther("0.5"),
            ethers.parseEther("0"),
            ethers.parseEther("0.5"),
        ];

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                badAmounts,
                deadlines,
                { value: ethers.parseEther("1.0") }
            )
        ).to.be.revertedWithCustomError(escrow, "AmountMustBePositive");
    });

    it("reverts if a deadline is in the past", async function () {
        const deadlines = await getDeadlines();
        deadlines[0] = 1000;

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWithCustomError(escrow, "DeadlineMustBeFuture");
    });

    it("reverts if a deadline is more than 365 days away", async function () {
        const deadlines = await getDeadlines();
        deadlines[0] = deadlines[0] + 366 * 24 * 60 * 60;

        await expect(
            escrow.connect(client).createProject(
                freelancer.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWithCustomError(escrow, "DeadlineTooFar");
    });

    it("reverts if freelancer address is zero", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                ethers.ZeroAddress,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWith("Invalid freelancer address");
    });

    it("reverts if client and freelancer are the same address", async function () {
        const deadlines = await getDeadlines();

        await expect(
            escrow.connect(client).createProject(
                client.address,
                DESCRIPTIONS,
                AMOUNTS,
                deadlines,
                { value: TOTAL_BUDGET }
            )
        ).to.be.revertedWith("Cannot be your own freelancer");
    });

});
