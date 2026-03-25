import { expect } from "chai";
import { ethers, deployEscrow } from "./helpers/fixtures.js";

describe("Deployment", function () {

    let escrow: any;
    let owner: any;

    beforeEach(async function () {
        ({ escrow, owner } = await deployEscrow());
    });

    it("sets the correct owner", async function () {
        expect(await escrow.owner()).to.equal(owner.address);
    });

    it("starts unpaused", async function () {
        expect(await escrow.paused()).to.equal(false);
    });

    it("holds zero RBTC balance on deployment", async function () {
        const balance = await ethers.provider.getBalance(await escrow.getAddress());
        expect(balance).to.equal(0n);
    });

});
