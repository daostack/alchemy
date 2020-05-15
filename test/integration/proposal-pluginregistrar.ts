import * as uuid from "uuid";
import { getTestAddresses, hideCookieAcceptWindow, ITestAddresses, gotoDaoPlugins } from "./utils";

describe("PluginRegistrar Proposals", () => {
  let daoAddress: string;
  let addresses: ITestAddresses;

  before(() => {
    addresses = getTestAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
  });

  it("Create a proposal to add a plugin", async () => {
    await gotoDaoPlugins(daoAddress);

    const pluginCard = await $("[data-test-id=\"pluginCard-SchemeRegistrar\"]");
    await pluginCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-AddPlugin\"]");
    await tab.click();

    const showFormButton = await $("#showFormButton");
    await showFormButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const pluginToAddInput = await $("*[id=\"pluginToAddInput\"]");
    await pluginToAddInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const parametersHashInput = await $("*[id=\"parametersHashInput\"]");
    await parametersHashInput.setValue("0x0000000000000000000000000000000000000000000000000000000000001234");

    // const registerOtherPluginsInput = await $("*[id=\"registerOtherPluginsInput\"]");
    // await registerOtherPluginsInput.setValue(true);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Create a proposal to edit a plugin", async () => {
    await gotoDaoPlugins(daoAddress);

    const pluginCard = await $("[data-test-id=\"pluginCard-SchemeRegistrar\"]");
    await pluginCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-EditPlugin\"]");
    await tab.click();

    const showFormButton = await $("#showFormButton");
    await showFormButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Create a proposal to remove a plugin", async () => {
    await gotoDaoPlugins(daoAddress);

    const pluginCard = await $("[data-test-id=\"pluginCard-SchemeRegistrar\"]");
    await pluginCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const tab = await $("*[data-test-id=\"tab-RemovePlugin\"]");
    await tab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const pluginToEditInput = await $("select[id=\"pluginToRemoveInput\"]");
    await pluginToEditInput.selectByIndex(2);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });
});
