import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { DAO, Arc } from "@daostack/client";
import { getArc, setCalendarDate } from "./utils";

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
    await ethRewardInput.scrollIntoView();
    await ethRewardInput.setValue(22);

    const compStartDateInput = await $("*[id=\"compStartTimeInput\"]");
    await compStartDateInput.scrollIntoView();
    await setCalendarDate(compStartDateInput, "01/01/2021");

    const suggestionsEndDateInput = await $("*[id=\"suggestionEndTimeInput\"]");
    await suggestionsEndDateInput.scrollIntoView();
    await setCalendarDate(suggestionsEndDateInput, "01/02/2021");

    const votingStartDateInput = await $("*[id=\"votingStartTimeInput\"]");
    await votingStartDateInput.scrollIntoView();
    await setCalendarDate(votingStartDateInput, "01/03/2021");

    const compEndDateInput = await $("*[id=\"compEndTimeInput\"]");
    await compEndDateInput.scrollIntoView();
    await setCalendarDate(compEndDateInput, "01/04/2021");

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.scrollIntoView();
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

});
