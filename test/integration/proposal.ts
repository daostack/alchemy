import * as uuid from "uuid";
import { getContractAddresses } from "./utils";

describe("Proposals", () => {
    let daoAddress: string;
    let addresses;

    before(() => {
      addresses = getContractAddresses();
      daoAddress = addresses.Avatar.toLowerCase();
    });

    it("Create a proposal, vote for it, stake on it", async () => {
      const url = `/dao/${daoAddress}/`;
      await browser.url(url);

      const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
      await createProposalButton.waitForExist();

      await createProposalButton.click();

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
      const createProposalSubmitButton = await $("*[type=\"submit\"]");
      await createProposalSubmitButton.click();

      // check that the proposal appears in the list
      // test for the title
      let titleElement = await $(`[data-test-id=\"proposal-title\"]=${title}`);
      await titleElement.waitForExist();

      // locate the new proposal element
      let proposal = await titleElement.$("./../../..");

      await proposal.scrollIntoView();

      // vote for the proposal
      // Click on proposal so voting controls appear
      await proposal.click();
      const voteButton = await proposal.$(`[data-test-id="voteFor"]`);
      await voteButton.click();
      /* TODO: commented out these tests as they give problems on travis ("element is not clickable")
      let launchMetaMaskButton = await $(`[data-test-id="launch-metamask"]`);
      await launchMetaMaskButton.click();

      await proposal.click();
      const youVotedFor = await proposal.$(`span[data-test-id="youVotedFor"`);
      await youVotedFor.waitForDisplayed();

      const stakeButton = await proposal.$(`[data-test-id="stakePass"]`);
      await stakeButton.click();
      launchMetaMaskButton = await $(`[data-test-id="launch-metamask"]`);
      await launchMetaMaskButton.click();
      TODO: what to look for? check that staking amount for increased by amount staked...
      */
    });

});
