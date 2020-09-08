import * as uuid from "uuid";
import { getTestAddresses, LATEST_ARC_VERSION, hideCookieAcceptWindow, ITestAddresses, gotoDaoPlugins, deleteCachedFormValues } from "./utils";

describe("Token Trade Proposals", () => {
  let daoAddress: string;
  let addresses: ITestAddresses;

  before(() => {
    const { daos } = require("@daostack/test-env-experimental/daos.json")
    addresses = daos[LATEST_ARC_VERSION].find((dao: any) => dao.name === "DAO For Testing");
    daoAddress = addresses.Avatar.toLowerCase();
  });

  it("Create a proposal to trade some tokens", async () => {
    await gotoDaoPlugins(daoAddress);

    const pluginCard = await $("[data-test-id=\"pluginCard-TokenTrade\"]");
    await pluginCard.waitForExist();
    await pluginCard.click();

    await hideCookieAcceptWindow();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`Trade some tokens`);

    const urlInput = await $("*[id=\"urlInput\"]");
    await urlInput.setValue(`https://this.must.be/a/valid/url${uuid()}/lets.trade.tokens`);

    const sendTokenAmountInput = await $("*[id=\"sendTokenAmountInput\"]");
    await sendTokenAmountInput.scrollIntoView();
    await sendTokenAmountInput.setValue("10");

    const sendTokenAddressInput = await $("select[id=\"sendTokenAddress\"]");
    await sendTokenAddressInput.scrollIntoView();
    await sendTokenAddressInput.selectByIndex(1);

    const receiveTokenAmountInput = await $("*[id=\"receiveTokenAmountInput\"]");
    await receiveTokenAmountInput.scrollIntoView();
    await receiveTokenAmountInput.setValue("10");

    const receiveTokenAddressInput = await $("select[id=\"receiveTokenAddress\"]");
    await receiveTokenAddressInput.scrollIntoView();
    await receiveTokenAddressInput.selectByIndex(1);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.scrollIntoView();
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

});
