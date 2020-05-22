import * as uuid from "uuid";
import { first } from "rxjs/operators";
import { DAO, Arc } from "@dorgtech/arc.js";
import { getArc, setCalendarDate, hideCookieAcceptWindow, gotoDaoPlugins } from "./utils";

describe("Proposals", () => {
  let dao: DAO;
  let arc: Arc;

  beforeEach(async () => {
    // we need to find a DAO with a competition plugin
    // TODO: create a test_env with a nameed DAO so we can find it consistently
    arc = getArc();
    await arc.fetchContractInfos();
    const ARC_VERSION = "0.1.1-rc.20";

    // find the corresponding plugin object
    const contributionRewardExts = await arc
      .plugins({where: { name: "ContributionRewardExt" }}).pipe(first()).toPromise();

    const contributionRewardExt = contributionRewardExts[0];
    const contributionRewardExtState = await contributionRewardExt.state().pipe(first()).toPromise();
    dao = new DAO(arc, contributionRewardExtState.dao.id);
  });

  it("Create a Competition Plugin proposal, vote for it, stake on it", async () => {

    await gotoDaoPlugins(dao.id);

    const pluginTitle = await $("h2=Competition");
    await pluginTitle.click();


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

    const repRewardInput = await $("*[id=\"reputationRewardInput\"]");
    await repRewardInput.scrollIntoView();
    await repRewardInput.setValue(22);

    const compStartDateInput = await $("input[name='compStartTimeInput']");
    await compStartDateInput.scrollIntoView();
    await setCalendarDate(compStartDateInput, "June 1, 2030 00:00");

    const suggestionsEndDateInput = await $("input[name='suggestionEndTimeInput']");
    await suggestionsEndDateInput.scrollIntoView();
    await setCalendarDate(suggestionsEndDateInput, "June 2, 2030 00:00");

    const votingStartDateInput = await $("input[name='votingStartTimeInput']");
    await votingStartDateInput.scrollIntoView();
    await setCalendarDate(votingStartDateInput, "June 3, 2030 00:00");

    const compEndDateInput = await $("input[name='compEndTimeInput']");
    await compEndDateInput.scrollIntoView();
    await setCalendarDate(compEndDateInput, "June 4, 2030 00:00");

    // hack to close any open calendar
    await ethRewardInput.click();
    await hideCookieAcceptWindow();

    const createProposalSubmitButton = await $("*[type=\"submit\"]");
    await createProposalSubmitButton.scrollIntoView();
    await createProposalSubmitButton.click();

    // check that the proposal appears in the list
    // test for the title
    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

});
