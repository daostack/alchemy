import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { getArc } from "./utils";

describe("Proposals", () => {
  let daoAddress: string;

  beforeEach(async () => {
    const arc = getArc();
    const daos = await arc.daos({ where: { name: "Comely Dragons"}}).pipe(first()).toPromise();
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

    const masterCopyTab = await $("*[data-test-id=\"action-tab-updateMasterCopy\"]");
    await masterCopyTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const masterCopyInput = await $("*[data-test-id=\"_masterCopy\"]");
    await masterCopyInput.setValue("0x5fB320886aF629122736c0e1a5c94dCE841EA37B");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

});
