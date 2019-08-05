import { Address } from "@daostack/client";
import { getContractAddresses } from "./utils";

describe("Redemptions page", () => {
  let testAddresses;
  let daoAddress: Address;

  before(async () => {
    testAddresses = getContractAddresses();
    daoAddress = testAddresses.test.Avatar.toLowerCase();
  });

  it("should exist", async () => {
    await browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/redemptions`);

    const loginButton = await $("*[data-test-id=\"loginButton\"]");
    await loginButton.click();

    const pageTitle = await browser.getTitle();
    pageTitle.should.be.equal("Alchemy | DAOstack");

    // we expect the
    const proposalId = testAddresses.test.executedProposalId;
    const proposalCard = await $(`[data-test-id="proposal-${proposalId}"]`);
    await proposalCard.waitForExist();

    const redeemButton = await $("[data-test-id=\"button-redeem\"]");
    // console.log(Object.keys(proposalCard));
    // const redeemButton = proposalCard
    const html = await redeemButton.getHTML();
    console.log(html);
    // browser.debug();
    await redeemButton.click();
    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
    browser.debug();

  });
});
