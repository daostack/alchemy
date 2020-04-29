import * as uuid from "uuid";
import { getContractAddresses, hideCookieAcceptWindow, gotoDaoSchemes } from "./utils";

describe("SchemeRegistrar Proposals", () => {
  let daoAddress: string;
  let addresses;

  before(() => {
    addresses = getContractAddresses();
    daoAddress = addresses.test.Avatar.toLowerCase();
  });

  it("Create a proposal to add a scheme", async () => {
    await gotoDaoSchemes(daoAddress);

    const schemeCard = await $("[data-test-id=\"schemeCard-SchemeRegistrar\"]");
    await schemeCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-AddScheme\"]");
    await tab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const schemeToAddInput = await $("*[id=\"schemeToAddInput\"]");
    await schemeToAddInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const parametersHashInput = await $("*[id=\"parametersHashInput\"]");
    await parametersHashInput.setValue("0x0000000000000000000000000000000000000000000000000000000000001234");

    // const registerOtherSchemesInput = await $("*[id=\"registerOtherSchemesInput\"]");
    // await registerOtherSchemesInput.setValue(true);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Create a proposal to edit a scheme", async () => {
    await gotoDaoSchemes(daoAddress);

    const schemeCard = await $("[data-test-id=\"schemeCard-SchemeRegistrar\"]");
    await schemeCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-EditScheme\"]");
    await tab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const schemeToEditInput = await $("select[id=\"schemeToEditInput\"]");
    await schemeToEditInput.selectByIndex(2);

    const parametersHashInput = await $("*[id=\"parametersHashInput\"]");
    await parametersHashInput.setValue("0x0000000000000000000000000000000000000000000000000000000000001234");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Create a proposal to remove a scheme", async () => {
    await gotoDaoSchemes(daoAddress);

    const schemeCard = await $("[data-test-id=\"schemeCard-SchemeRegistrar\"]");
    await schemeCard.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-RemoveScheme\"]");
    await tab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const schemeToEditInput = await $("select[id=\"schemeToRemoveInput\"]");
    await schemeToEditInput.selectByIndex(2);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });
});
