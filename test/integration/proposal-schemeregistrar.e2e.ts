import * as uuid from "uuid";
import { getContractAddresses, hideCookieAcceptWindow, gotoDaoSchemes, wait} from "./utils";

describe("SchemeRegistrar Proposals", () => {
  let daoAddress: string;
  let addresses;
  const GOOD_PARAMS_HASH = "0x7603c16050b9322f37cb156f90baecdd28edbaef67aac17d1164aabf408d35e2";

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

    const showFormButton = await $("#showFormButton");
    await showFormButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const schemeToAddInput = await $("*[id=\"schemeToAddInput\"]");
    await schemeToAddInput.setValue("0x4a1d2a5060c782049ef966d9412f1239e95183b7");

    const parametersHashInput = await $("*[id=\"parametersHashInput\"]");
    await parametersHashInput.setValue(GOOD_PARAMS_HASH);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    /**
     * The below is a workaround to wait until verifyParametersHash function is finished.
     * Ideally, we need to disable the submit button and click on it only if there are no errors in the form,
     * however this raises new issues and should be handled separately.
     */
    await wait(1000);
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

    const showFormButton = await $("#showFormButton");
    await showFormButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const schemeToEditInput = await $("select[id=\"schemeToEditInput\"]");
    await schemeToEditInput.selectByIndex(2);

    const parametersHashInput = await $("*[id=\"parametersHashInput\"]");
    await parametersHashInput.setValue(GOOD_PARAMS_HASH);

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

    await hideCookieAcceptWindow();

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
