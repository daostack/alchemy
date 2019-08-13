import * as chai from "chai";
import { Address } from "@daostack/client";
import { getContractAddresses } from "./utils";

chai.should();

describe("Header redemptions button", () => {
  it("shouldn't be there if the user isn't logged in", async () => {
    await browser.url("http://127.0.0.1:3000");

    const redemptionsButton = await $("[data-test-id=\"redemptionsButton\"]");
    (await redemptionsButton.isDisplayed()).should.equal(false);
  });

  it("should redirect us to the redemptions page", async () => {
    (await $("[data-test-id=\"loginButton\"]")).click();

    const redemptionsButton = await $("[data-test-id=\"redemptionsButton\"]");
    await redemptionsButton.waitForDisplayed();
    await redemptionsButton.click();

    (await browser.getUrl()).should.equal("http://127.0.0.1:3000/redemptions");
  });
});

describe("DAO redemptions page", () => {
  let testAddresses;
  let daoAddress: Address;

  before(async () => {
    testAddresses = getContractAddresses();
    daoAddress = testAddresses.test.Avatar.toLowerCase();
  });

  it("should exist", async () => {
    await browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/redemptions`);

    const pageTitle = await browser.getTitle();
    pageTitle.should.be.equal("Alchemy | DAOstack");

    // we expect the
    const proposalId = testAddresses.test.executedProposalId;
    const proposalCard = await $(`[data-test-id="proposal-${proposalId}"]`);
    await proposalCard.waitForExist();

    const redeemButton = await $("[data-test-id=\"button-redeem\"]");
    await redeemButton.click();
    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
  });
});

describe("All redemptions page", () => {
  let testAddresses;

  before(() => {
    testAddresses = getContractAddresses();
  });

  it("should exist", async () => {
    await browser.url("http://127.0.0.1:3000/redemptions");

    const pageTitle = await browser.getTitle();
    pageTitle.should.be.equal("Alchemy | DAOstack");
  });

  it("should redeem a reward", async () => {
    const proposalId = testAddresses.test.executedProposalId;
    const proposalCard = await $(`[data-test-id="proposal-${proposalId}"]`);
    await proposalCard.waitForExist();

    const redeemButton = await $("[data-test-id=\"button-redeem\"]");
    await redeemButton.click();

    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
  });
});
