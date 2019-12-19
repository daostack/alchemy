import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { DAO, Arc } from "@daostack/client";
import { getArc } from "./utils";

describe("Proposals", () => {
  let dao: DAO;
  let arc: Arc;

  beforeEach(async () => {
    // we need to find a DAO with a competition scheme
    // TODO: create a test_env with a nameed DAO so we can find it consistently
    arc = getArc();
    await arc.fetchContractInfos();
    const ARC_VERSION = "0.0.1-rc.36";
    const contributionRewardExtContract  = arc.getContractInfoByName("ContributionRewardExt", ARC_VERSION);

    // find the corresponding scheme object
    const contributionRewardExts = await arc
      .schemes({where: {address: contributionRewardExtContract.address}}).pipe(first()).toPromise();

    const contributionRewardExt = contributionRewardExts[0];
    const contributionRewardExtState = await contributionRewardExt.state().pipe(first()).toPromise();
    dao = new DAO(contributionRewardExtState.dao, arc);
  });


  it("Create a Competition Scheme proposal, vote for it, stake on it", async () => {

    const url = `/dao/${dao.id}/`;
    await browser.url(url);

    const schemeTitle = await $("h2=Competition");
    await schemeTitle.click();


    // const acceptCookiesButton = await $("a[data-test-id=\"acceptCookiesButton\"]");
    // await acceptCookiesButton.click()

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

    const numWinnersInput = await $("*[id=\"numWinnersInput\"]");
    await numWinnersInput.setValue(3);

    const rewardSplitInput = await $("*[id=\"rewardSplitInput\"]");
    await rewardSplitInput.setValue("60,20,20 ");
    const numVotesInput = await $("*[id=\"numVotesInput\"]");
    await numVotesInput.setValue(3);

    const ethRewardInput = await $("*[id=\"ethRewardInput\"]");
    await ethRewardInput.setValue(22);

    const compStartDateInput = await $("*[id=\"compStartDateInput\"]");
    await compStartDateInput.setValue("01/01/1970");
    // const compStartTimeInput = await $("*[name=\"compStartTime\"]");
    // await compStartTimeInput.setValue('00:00');

    const compEndDateInput = await $("*[id=\"compEndDateInput\"]");
    await compEndDateInput.setValue("01/01/2021");
    // const compEndTimeInput = await $("*[id=\"compEndTimeInput\"]");
    // await compEndTimeInput.setValue('00:00');

    const votingStartDateInput = await $("*[id=\"votingStartDateInput\"]");
    await votingStartDateInput.setValue("01/01/1970");
    // const votingStartTimeInput = await $("*[id=\"votingStartTimeInput\"]");
    // await votingStartTimeInput.setValue('00:00');

    const suggestionsEndDateInput = await $("*[id=\"suggestionsEndDateInput\"]");
    await suggestionsEndDateInput.setValue("01/01/2022");
    // const suggestionsEndTimeInput = await $("*[id=\"suggestionsEndTimeInput\"]");
    // await suggestionsEndTimeInput.setValue('00:00');

    // we cannot click sumbit because it is outside of the window and the form is not scrollabele (sigh..)
    // const createProposalSubmitButton = await $("*[type=\"submit\"]");
    // await createProposalSubmitButton.scrollIntoView()
    // await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    // const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    // await titleElement.waitForExist();

  });

});
