import * as uuid from "uuid";
import { getContractAddresses, timeTravel } from "./utils";

describe("Proposals page", () => {
  let daoAddress: string;
  let addresses;
  let title: string;
  let proposal: any;
  let contextMenu: any;
  let launchMetaMaskButton: any;

  before(() => {
    addresses = getContractAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
    title = uuid();
    console.log("title = ", title);
  });

  it("Creating a proposal", async () => {
    const url = `/dao/${daoAddress}/`;
    await browser.url(url);

    const loginButton = await $("*[data-test-id=\"loginButton\"]");
    await loginButton.click();

    const schemeCard = await $("[data-test-id=\"schemeCard-ContributionReward\"]");
    await schemeCard.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const titleInput = await $("#titleInput");
    await titleInput.waitForExist();

    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const beneficiaryInput = await $("*[data-test-id=\"beneficiaryInput\"]");
    await beneficiaryInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    // ask for 100 rep
    const repReward = Math.floor(Math.random() * 1000);
    const reputationRewardInput = await $("#reputationRewardInput");
    await reputationRewardInput.setValue(repReward);
    const ethReward = Math.floor(Math.random() * 1000);
    const ethRewardInput = await $("#ethRewardInput");
    await ethRewardInput.setValue(ethReward);
    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    console.log("waiting for prop");

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Voting on a proposal", async () => {
    console.log("get prop");
    // locate the new proposal element
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    proposal = await titleElement.$("./../../..");

    console.log("scroll");
    await proposal.scrollIntoView(false);

    console.log("ckicl proposal");

    // vote for the proposal
    // Click on context menu so voting controls appear
    await proposal.click();

    console.log("get context menu and click");
    contextMenu = await proposal.$("[data-test-id=\"proposalContextMenu\"]");
    await contextMenu.click();

    console.log("vote button");
    const voteButton = await proposal.$("[data-test-id=\"voteFor\"]");
    await voteButton.waitForDisplayed();
    console.log("click it");
    await voteButton.click();
    console.log("metamask");
    launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();

    await contextMenu.click();
    console.log("check you voted");
    const youVotedFor = await proposal.$("span[data-test-id=\"youVotedFor\"");
    await youVotedFor.waitForDisplayed();
  });

  it("Staking on a proposal", async () => {
    const enablePredictionsButton = await proposal.$("[data-test-id=\"button-enable-predicting\"]");
    if (await enablePredictionsButton.isExisting()) {
      // get notifications out of the way
      const buttonCloseNotification = await $$("[data-test-id=\"button-notification-close\"]");
      await buttonCloseNotification.forEach(async (button: any) => await button.click());

      await enablePredictionsButton.click();
      const buttonPreapprove = await $("[data-test-id=\"button-preapprove\"]");
      await buttonPreapprove.click();
    }

    console.log("stake context click");
    await contextMenu.click();
    console.log("stake button click");
    const stakeButton = await proposal.$("[data-test-id=\"stakePass\"]");
    await stakeButton.waitForDisplayed();
    await stakeButton.click();
    console.log("prediction input");
    const predictionInput = await $("#predictionInput");
    const stake = 2;
    await predictionInput.setValue(stake);
    launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
    await browser.debug();
  });

  it("Boosting on a proposal", async () => {
    await timeTravel(10 * 60);
    await browser.debug();
  });
});
