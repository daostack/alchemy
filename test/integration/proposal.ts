import * as uuid from "uuid";
import { chai, getContractAddresses } from "./utils";

describe("Proposals", () => {
    let daoAddress: string;
    let addresses;

    before(() => {
      addresses = getContractAddresses();
      daoAddress = addresses.Avatar.toLowerCase();
    });

    it("Create a proposal, vote for it, stake on it", async () => {

      // This sets the seen_disclaimer cookie to true so we can move on
      await browser.url("/");

      const url = `/dao/${daoAddress}/`;
      await browser.url(url);

      const createProposalButton = await $('a[data-test-id="createProposal"]');
      await createProposalButton.waitForExist();

      await createProposalButton.click()

      const titleInput = await $("*[id=\"titleInput\"]");
      await titleInput.waitForExist();

      const title = uuid();
      await titleInput.setValue(title);

      // using uuid value so that the test will pass also if there is already a proposal with this description
      // (which must be unique). TODO: find a way to reset the state
      const descriptionInput = await $("#descriptionInput");
      await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

      const beneficiaryInput = await $("*[data-test-id=\"beneficiaryInput\"]");
      await beneficiaryInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

      // ask for 100 rep
      const repReward = Math.floor(Math.random() * 1000);
      const reputationRewardInput = await $("*[id=\"reputationRewardInput\"]");
      await reputationRewardInput.setValue(repReward);
      const ethReward = Math.floor(Math.random() * 1000);
      const ethRewardInput = await $("#ethRewardInput");
      await ethRewardInput.setValue(ethReward);
      const createProposalSubmitButton = await $("*[type=\"submit\"]")
      await createProposalSubmitButton.click();

      // check that the proposal appears in the list
      // test for the title
      const titleElement = await $(`[data-test-id=\"proposal-title\"]=${title}`);
      await titleElement.waitForExist();

      // check if this container really exists
      // next line is there to locate the proposal component, so we can click on the various buttons
      const proposal = await titleElement.$("./../../..");
      //assert(await proposal.isExisting());

      await proposal.scrollIntoView();

      // vote for the proposal
      // Click on proposal so voting controls appear
      await proposal.click();
      const voteButton = await proposal.$(`[data-test-id="voteFor"]`);
      await voteButton.click();
      const launchMetaMaskButton = await $(`[data-test-id="launch-metamask"]`);
      await launchMetaMaskButton.click();

      await proposal.click();
      const youVotedFor = await proposal.$(`span[data-test-id="youVotedFor"`);
      await youVotedFor.waitForDisplayed();

      const stakeButton = await proposal.$(`[data-test-id="stakePass"]`);
      await stakeButton.click();
      await launchMetaMaskButton.click();
      // TODO: what to look for? check that staking amount for increased by amount staked...
    });

});
