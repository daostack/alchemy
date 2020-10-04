import * as uuid from "uuid";
import { getTestAddresses, hideCookieAcceptWindow, ITestAddresses, gotoDaoPlugins, submit, setCalendarDate, goToUrl } from "./utils";
import * as moment from "moment";

describe("Proposals", () => {
  let daoAddress: string;
  let addresses: ITestAddresses;

  before(async () => {
    addresses = getTestAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
    await hideCookieAcceptWindow();
  });

  it("Create a Generic Plugin scheme and vote for it", async () => {
    await gotoDaoPlugins("0xeabea104eccbaa46a89bf28dee05c6ec1a8cd759");

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

    // const descriptionInput = await $(".mde-text");
    // await descriptionInput.waitForExist();
    // await descriptionInput.setValue(title);

    const pluginSelect = await $("*[id=\"pluginToAdd\"]");
    await pluginSelect.waitForExist();
    await pluginSelect.click();
    const selectOption = await $("*[id=\"option-GenericScheme\"]");
    await selectOption.waitForExist();
    await selectOption.click();

    const contractToCallInput = await $("*[id=\"contractToCall\"]");
    await contractToCallInput.waitForExist();
    await contractToCallInput.click();
    const customOption = await $("*[id=\"custom\"]");
    await customOption.click();

    const customContractToCallInput = await $("input[id=\"contractToCall\"]");
    await customContractToCallInput.waitForExist();
    await customContractToCallInput.click();
    await customContractToCallInput.setValue("0x543Ff227F64Aa17eA132Bf9886cAb5DB55DCAddf");

    const activationTimeInput = await $("input[id=\"activationTime\"]");
    //const activationTimeInput = await $('//*[@id="activationTime"]/div[2]/div/input');
    await activationTimeInput.waitForExist();
    await activationTimeInput.scrollIntoView();
    //await activationTimeInput.clearValue();
    await activationTimeInput.click();
    const futureDate = moment().add(1, "minutes").format("YYYY-MM-DDTHH:mm");
    await activationTimeInput.setValue(futureDate);
    //await browser.execute("document.getElementById('activationTime').setAttribute('value','2018-06-12T19:30')")

    //await submit();

    // const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    // await titleElement.waitForExist();

    // const proposal = await titleElement.$("./../../..");
    // console.log(proposal);
    // await proposal.scrollIntoView();

    // const contextMenu = await proposal.$("[data-test-id=\"proposalContextMenu\"]");
    // await contextMenu.click();

    // const voteButton = await proposal.$("[data-test-id=\"voteFor\"]");
    // await voteButton.waitForDisplayed();
    // await voteButton.click();
    // let launchMetaMaskButton = await $("[data-test-id=\"launch-metamask\"]");
    // if (await launchMetaMaskButton.isExisting()) {
    //   await launchMetaMaskButton.click();
    // }
  });

  // it("Create a Generic Plugin proposal", async () => {
  //   await gotoDaoPlugins("0xeabea104eccbaa46a89bf28dee05c6ec1a8cd759");

  //   const pluginCard = await $("[data-test-id=\"pluginCard-GenericScheme\"]");
  //   await pluginCard.click();

  //   const currentURL = await browser.getUrl();
  //   await goToUrl(currentURL + "/proposals/create/"); // HACK! ALSO NEED TO FIX IN THE APP ITSELF

  //   const titleInput = await $("*[id=\"titleInput\"]");
  //   await titleInput.waitForExist();

  //   const title = uuid();
  //   await titleInput.setValue(title);

  //   const descriptionInput = await $(".mde-text");
  //   await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

  //   const valueInput = await $("*[id=\"valueInput\"]");
  //   await valueInput.click();
  //   await valueInput.setValue("1");

  //   const selectSearchInput = await $("*[id=\"select-search\"]");
  //   await selectSearchInput.scrollIntoView();
  //   await selectSearchInput.click();

  //   const elementList = await $("*[id=\"select-search-element-0\"]");
  //   await elementList.click();

  //   const abiInput_1 = await $("*[id=\"abi-input-0\"]");
  //   await abiInput_1.scrollIntoView();
  //   await abiInput_1.click();
  //   await abiInput_1.setValue("0x853D2d862E2a2c76ef8a4F6Ef2b8A9fB3dA1f604");

  //   const abiInput_2 = await $("*[id=\"abi-input-1\"]");
  //   await abiInput_2.scrollIntoView();
  //   await abiInput_2.click();
  //   await abiInput_2.setValue("1");

  //   await abiInput_1.click();

  //   await submit();

  //   const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
  //   await titleElement.waitForExist();

  // });


});
