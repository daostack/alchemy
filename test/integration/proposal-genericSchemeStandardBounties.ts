import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { getArc } from "./utils";

describe("Proposals", () => {
  let daoAddress: string;

  beforeEach(async () => {
    const arc = getArc();
    const daos = await arc.daos({ where: { name: "DutchX DAO"}}).pipe(first()).toPromise();
    const dao = daos[0];
    daoAddress = dao.id;

  });

  it("Create a Standard Bounties Generic Scheme proposal, vote for it, stake on it", async () => {
    const url = `/dao/${daoAddress}/`;
    await browser.url(url);

    const schemeTitle = await $("h2=Standard Bounties");
    await schemeTitle.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const contributeTab = await $("*[data-test-id=\"action-tab-contribute\"]");
    await contributeTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const senderInput = await $("*[data-test-id=\"_sender\"]");
    await senderInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const bountyIdInput = await $("*[data-test-id=\"_bountyId\"]");
    await bountyIdInput.setValue(2);

    const tokenAmountInput = await $("*[data-test-id=\"_aamountr\"]");
    await tokenAmountInput.setValue(100000000);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

});
