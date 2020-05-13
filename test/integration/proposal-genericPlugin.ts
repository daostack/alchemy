import * as uuid from "uuid";
import { getTestAddresses, hideCookieAcceptWindow, ITestAddresses, gotoDaoPlugins } from "./utils";

describe("Proposals", () => {
  let daoAddress: string;
  let addresses: ITestAddresses;

  before(() => {
    addresses = getTestAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
  });

  it("Create a Generic Plugin proposal, vote for it, stake on it", async () => {

    await gotoDaoPlugins(daoAddress);

    await hideCookieAcceptWindow();

    const pluginCard = await $("[data-test-id=\"pluginCard-GenericPlugin\"]");
    await pluginCard.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const callDataInput = await $("*[id=\"callDataInput\"]");
    await callDataInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const valueInput = await $("*[id=\"valueInput\"]");
    await valueInput.setValue("1");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

  it("Fill out a generic plugin proposal form and export it", async () => {
    await gotoDaoPlugins(daoAddress);

    const pluginCard = await $("[data-test-id=\"pluginCard-GenericPlugin\"]");
    await pluginCard.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const callDataInput = await $("*[id=\"callDataInput\"]");
    await callDataInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const valueInput = await $("*[id=\"valueInput\"]");
    await valueInput.setValue("0");

    const exportProposalSubmitButton = await $("*[id=\"export-proposal\"]");
    await exportProposalSubmitButton.click();

  });

});
