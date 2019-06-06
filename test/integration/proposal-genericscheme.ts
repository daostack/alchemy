import * as uuid from "uuid";
import { getContractAddresses } from "./utils";

describe("GenericScheme Proposal", () => {
    let daoAddress: string;
    let addresses;

    before(() => {
      addresses = getContractAddresses();
      daoAddress = addresses.Avatar.toLowerCase();
    });

    it("Create a proposal to execute a generic action", async () => {
      const url = `/dao/${daoAddress}/`;
      await browser.url(url);

      const schemeCard = await $("[data-test-id=\"schemeCard-GenericScheme\"]");
      await schemeCard.click();

      const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
      await createProposalButton.waitForExist();
      await createProposalButton.click();

      const titleInput = await $("*[id=\"titleInput\"]");
      await titleInput.waitForExist();

      const title = uuid();
      await titleInput.setValue(title);

      const descriptionInput = await $("*[id=\"descriptionInput\"]");
      await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

      const callDataInput = await $("*[id=\"callDataInput\"]");
      await callDataInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

      const valueInput = await $("*[id=\"valueInput\"]");
      await valueInput.setValue("0");

      const createProposalSubmitButton = await $("*[type=\"submit\"]");
      await createProposalSubmitButton.click();

      // check that the proposal appears in the list
      // test for the title
      let titleElement = await $(`[data-test-id=\"proposal-title\"]=${title}`);
      await titleElement.waitForExist();
    });

});
