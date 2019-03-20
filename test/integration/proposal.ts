import * as uuid from "uuid";
import { chai, getContractAddresses } from "./utils";

describe("Proposals", () => {
    let daoAddress: string;
    let addresses;

    before(() => {
      chai.Should();
      addresses = getContractAddresses();
      daoAddress = addresses.Avatar.toLowerCase();
    });

    it("Create a proposal, vote for it, stake on it", async () => {
      browser.url("http://127.0.0.1:3000/ ");
      const url = `http://127.0.0.1:3000/dao/${daoAddress}/`;
      browser.url(url);

      browser.waitForExist("*[data-test-id=\"create-proposal\"]");

      /// skip the tour
      if (browser.isVisible("*[data-test-id=\"skip-tour\"]")) {
        browser.click("*[data-test-id=\"skip-tour\"]");
      }

      browser.click("*[data-test-id=\"create-proposal\"]");
      browser.waitForExist("*[id=\"titleInput\"]");
      const title = uuid();
      browser.setValue("*[id=\"titleInput\"]", title);
      // using uuid value so that the test will pass alsko if there is already a proposal with thi description
      // (which must be unique). TODO: find a way to reset the state
      browser.setValue("*[id=\"descriptionInput\"]", `https://this.must.be/a/valid/url${uuid()}`);
      browser.setValue("*[data-test-id=\"beneficiaryInput\"]", "0x5fB320886aF629122736c0e1a5c94dCE841EA37B");
      // ask for 100 rep
      const repReward = Math.floor(Math.random() * 1000);
      browser.waitForExist("*[id=\"reputationRewardInput\"]");
      browser.setValue("*[id=\"reputationRewardInput\"]", `${repReward}` );
      const ethReward = Math.floor(Math.random() * 1000);
      browser.setValue("*[id=\"ethRewardInput\"]", `${ethReward}` );
      browser.click("*[type=\"submit\"]");

      // check that the proposal with the ethReward appears in the list
      browser.waitForExist(`strong*=${ethReward}`);

      // test for the title
      browser.$(`[data-test-id=\"proposal-title\"]=${title}`).isExisting();
      // check if this container really exists

      // next line is there to locate the proposal component, so we can click on the various buttons
      const proposalDataTestId = browser.$(`[data-test-id=\"proposal-title\"]=${title}`).$("..").$("..").$("..").getAttribute("data-test-id");
      browser.$(`*[data-test-id="${proposalDataTestId}"]`).isExisting();

      // TODO: next line errors with a scrollIntoView is not a function error. Why?
      // browser.$(`*[data-test-id="${proposalDataTestId}"]`).scrollIntoView();
      // // vote for the proposal
      // browser.$(`*[data-test-id="${proposalDataTestId}"]`).$(`[data-test-id="voteFor"]`).isExisting();
      // browser.$(`*[data-test-id="${proposalDataTestId}"]`).$(`[data-test-id="voteFor"]`).click();

    }, 10000);

});
