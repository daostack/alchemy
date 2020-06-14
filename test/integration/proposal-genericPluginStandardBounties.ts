/*
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

    if (!daoAddress) {
      throw Error("Could not find a DAO with this name");
    }
  });

  it("Create a Standard Bounties Generic Plugin proposal, issue and contribute", async () => {
    const url = `/dao/${daoAddress}/`;
    await browser.url(url);

    const pluginTitle = await $("h2=Standard Bounties");
    await pluginTitle.click();

    const createProposalButton = await $("a[data-test-id=\"createProposal\"]");
    await createProposalButton.waitForExist();

    await createProposalButton.click();

    const issueTab = await $("*[data-test-id=\"action-tab-issueAndContribute\"]");
    await issueTab.click();

    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();

    const title = uuid();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.setValue(`https://this.must.be/a/valid/url${uuid()}`);

    const senderInput = await $("*[data-test-id=\"_sender\"]");
    await senderInput.setValue(`${daoAddress}`);

    const issuerInput = await $("*[data-test-id=\"_issuers\"]");
    await issuerInput.setValue(`${daoAddress}`);

    const approversInput = await $("*[data-test-id=\"_approvers\"]");
    await approversInput.setValue(`${daoAddress}`);

    const dataInput = await $("*[data-test-id=\"_data\"]");
    await dataInput.setValue("QmVPxQTuoaULSbLuS62FBp2oWvCKrTDPktS7es2XxsM1To");

    const deadlineInput = await $("*[data-test-id=\"_deadline\"]");
    await deadlineInput.setValue(7288366910);

    const tokenInput = await $("*[data-test-id=\"_token\"]");
    await tokenInput.setValue("0x0000000000000000000000000000000000000000");

    const tokenVersionInput = await $("*[data-test-id=\"_tokenVersion\"]");
    await tokenVersionInput.setValue(0);

    const depositAmountInput = await $("*[data-test-id=\"_depositAmount\"]");
    await depositAmountInput.setValue(0);

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.click();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

});
*/
