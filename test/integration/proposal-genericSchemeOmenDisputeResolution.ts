/*import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { getArc } from "./utils";

describe("Proposals", () => {
  let daoAddress: string;

  beforeEach(async () => {
    const arc = getArc();
    const daos = await arc.daos({ where: { name: "dxDAO"}}).pipe(first()).toPromise();
    const dao = daos[0];
    daoAddress = dao.id;
    if (!daoAddress) {
      throw Error("Could not find a DAO with this name");
    }

  });

  it("Create a Omen Dispute Resolution Generic Scheme proposal", async () => {
    const url = `/dao/${daoAddress}/`;
    await browser.url(url);

    const schemeTitle = await $("h2=Omen Dispute Resolution");
    await schemeTitle.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const submitAnswerByArbitratorTab = await $("*[data-test-id=\"action-tab-submitAnswerByArbitrator\"]");
    await submitAnswerByArbitratorTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title); 

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const questionIdSample = "0x7558e250ec01215d7eb86ffff8115f17c57c266ecfa194aa05bc42202248544a";
    const questionIdInput = await $("*[data-test-id=\"questionId\"]");
    await questionIdInput.setValue(questionIdSample);

    const answerSample = "0x7558e250ec01215d7eb86ffff8115f17c57c266ecfa194aa05bc42202248544a";
    const answerInput = await $("*[data-test-id=\"answer\"]");
    await answerInput.setValue(answerSample);

    const answererInput = await $("*[data-test-id=\"answerer\"]");
    await answererInput.setValue(daoAddress);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

});
*/
