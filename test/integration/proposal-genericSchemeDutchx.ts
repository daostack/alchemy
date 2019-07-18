import * as uuid from "uuid";
import { getContractAddresses } from "./utils";

describe("Proposals", () => {
    let daoAddress: string;
    let addresses;

    before(() => {
      addresses = getContractAddresses();
      // cf. ./utils.ts to see where this address is from
      // if this test is failing, query the subgraph with the contractToCall
      // and set that in DutchX.json
      // { dao (id: "0x68728fe67fb1fbae9076110f98e9ba3f5a00f936")
      //   {id schemes {
      //     id
      //     name
      //     genericSchemeParams {
      //       contractToCall
      // }}}}

      daoAddress = addresses.dutchx.Avatar.toLowerCase();
    });

    it("Create a Generic Scheme proposal, vote for it, stake on it", async () => {
      const url = `/dao/${daoAddress}/`;
      await browser.url(url);

      const schemeCard = await $("[data-test-id=\"schemeCard-GenericScheme\"]");
      await schemeCard.click();

      const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
      await createProposalButton.waitForExist();

      await createProposalButton.click();

      const masterCopyTab = await $("*[data-test-id=\"action-tab-updateMasterCopy\"]");
      await masterCopyTab.click();

      const titleInput = await $("*[id=\"titleInput\"]");
      await titleInput.waitForExist();

      const title = uuid();
      await titleInput.setValue(title);

      // using uuid value so that the test will pass also if there is already a proposal with this description
      // (which must be unique).
      const descriptionInput = await $(".mde-text");
      await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

      const masterCopyInput = await $("*[data-test-id=\"_masterCopy\"]");
      await masterCopyInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

      const createProposalSubmitButton = await $("*[type=\"submit\"]");
      await createProposalSubmitButton.click();

      // check that the proposal appears in the list
      // test for the title
      let titleElement = await $(`[data-test-id=\"proposal-title\"]=${title}`);
      await titleElement.waitForExist();

    });

});
