import * as uuid from "uuid";
import { hideCookieAcceptWindow, gotoDaoPlugins, submit, setCalendarDate } from "./utils";
import * as moment from "moment";

const chai = require("chai");

global.expect = chai.expect;
chai.Should();

describe("Proposals", () => {

  beforeEach(async () => {
    await gotoDaoPlugins("0x257a7385fec13e6e9b7414da641f57975e2872e4");
  });

  it("Create a Generic Plugin scheme and vote for it", async () => {

    const createPluginButton = await $("a[data-test-id=\"createProposal\"]");
    await createPluginButton.waitForExist();
    await createPluginButton.click();

    const addPluginTab = await $("*[data-test-id=\"tab-AddPlugin\"]");
    await addPluginTab.waitForExist();
    await addPluginTab.click();

    const title = uuid();
    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.waitForExist();
    await descriptionInput.setValue(title);

    const pluginSelect = await $("*[id=\"pluginToAdd\"]");
    await pluginSelect.waitForExist();
    await pluginSelect.click();
    const selectOption = await $("*[id=\"option-GenericScheme\"]");
    await selectOption.waitForExist();
    await selectOption.click();

    const contractToCallInput = await $("*[id=\"contractToCallSelect\"]");
    await contractToCallInput.waitForExist();
    await contractToCallInput.click();
    const customOption = await $("*[id=\"custom\"]");
    await customOption.click();

    const customContractToCallInput = await $("input[id=\"contractToCall\"]");
    await customContractToCallInput.waitForExist();
    await customContractToCallInput.click();
    await customContractToCallInput.setValue("0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf");

    const activationTimeInput = await $("input[name=\"GenericScheme.votingParams.activationTime\"]");
    await activationTimeInput.waitForExist();
    await activationTimeInput.scrollIntoView();
    await setCalendarDate(activationTimeInput, moment().add(15, "seconds").format("MMMM D, YYYY HH:mm:ss"));

    // hack to close any open calendar
    await customOption.click();

    await hideCookieAcceptWindow();
    await submit();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    await titleElement.scrollIntoView();
    await titleElement.click();

    const voteButton = await $("[data-test-id=\"voteFor\"]");
    await voteButton.waitForDisplayed();
    await voteButton.click();

    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
    const notification = await $("[data-test-id=\"button-notification-close\"]");
    await notification.waitForExist({ timeout: 5000 });

  });

  it("Create a Generic Plugin proposal and vote it", async () => {

    const pluginCard = await $("[data-test-id=\"pluginCard-GenericScheme\"]");
    await pluginCard.scrollIntoView();
    await pluginCard.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const valueInput = await $("*[id=\"valueInput\"]");
    await valueInput.click();
    await valueInput.setValue("0");

    const selectSearchInput = await $("*[id=\"select-search\"]");
    await selectSearchInput.scrollIntoView();
    await selectSearchInput.click();

    const elementList = await $("*[id=\"select-search-element-0\"]");
    await elementList.click();

    const abiInput_1 = await $("*[id=\"abi-input-0\"]");
    await abiInput_1.scrollIntoView();
    await abiInput_1.click();
    await abiInput_1.setValue("0x853D2d862E2a2c76ef8a4F6Ef2b8A9fB3dA1f604");

    const abiInput_2 = await $("*[id=\"abi-input-1\"]");
    await abiInput_2.scrollIntoView();
    await abiInput_2.click();
    await abiInput_2.setValue("1");

    const encodedData = await $("*[id=\"encoded-data\"]");
    await encodedData.scrollIntoView();
    await encodedData.click();

    (await encodedData.getText()).should.be.equal("0x095ea7b3000000000000000000000000853d2d862e2a2c76ef8a4f6ef2b8a9fb3da1f6040000000000000000000000000000000000000000000000000000000000000001");

    await hideCookieAcceptWindow();
    await submit();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    await titleElement.scrollIntoView();
    await titleElement.click();

    const voteButton = await $("[data-test-id=\"voteFor\"]");
    await voteButton.waitForDisplayed();
    await voteButton.click();

    const launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    await launchMetaMaskButton.click();
    const notification = await $("[data-test-id=\"button-notification-close\"]");
    await notification.waitForExist({ timeout: 5000 });

  });
});
