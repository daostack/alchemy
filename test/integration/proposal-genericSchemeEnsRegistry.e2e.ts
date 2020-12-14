import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { getArc, gotoDaoSchemes, hideCookieAcceptWindow } from "./utils";

describe("Proposals ENS Registry", () => {
  let daoAddress: string;

  before(async () => {
    const arc = getArc();

    const daos = await arc.daos({ where: { name: "Nectar DAO"}}).pipe(first()).toPromise();
    const dao = daos[0];
    daoAddress = dao.id;

  });

  it("Create a Generic Scheme ENS Registry proposal and check that the data is submitted correctly", async () => {
    await gotoDaoSchemes(daoAddress);
    await hideCookieAcceptWindow();

    const ensTitle = await $("h2=GenericSchemeENSRegistry");
    await ensTitle.waitForExist();
    await ensTitle.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();
    await createProposalButton.click();

    const masterCopyTab = await $("*[data-test-id=\"action-tab-setSubnodeOwner\"]");
    await masterCopyTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    // using uuid value so that the test will pass also if there is already a proposal with this description
    // (which must be unique).
    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const nodeInput = await $("*[data-test-id=\"node\"]");
    await nodeInput.setValue("alice.eth");

    const labelInput = await $("*[data-test-id=\"label\"]");
    await labelInput.setValue("iam");

    const ownerInput = await $("*[data-test-id=\"owner\"]");
    await ownerInput.setValue("0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
    // await titleElement.scrollIntoView(false);
    // await titleElement.click();
    //
    // const summaryDetailsElement = await $("[class*=\"summaryDetails\"]");
    // await summaryDetailsElement.waitForExist();

    // TODO: fix the next statements
    // summaryDetailsElement.should.contain("0x787192fc5378cc32aa956ddfdedbf26b24e8d78e40109add0eea2c1a012c3dec");
    // summaryDetailsElement.should.contain("0x9e348118a83d84175f5051131bbf598fd46bee6bf7d1091296a4b8c3e9d28bae");
    // summaryDetailsElement.should.contain("0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1");
  });

});
