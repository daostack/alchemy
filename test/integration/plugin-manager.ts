import { first } from "rxjs/operators";
import { DAO, Arc } from "@daostack/arc.js";
import { getArc, gotoDaoPlugins, submit, hideCookieAcceptWindow, deleteCachedFormValues } from "./utils";

describe("Plugin Manager", () => {
  let dao: DAO;
  let arc: Arc;

  beforeEach(async () => {
    arc = getArc();
    await arc.fetchContractInfos();

    const contributionRewardExts = await arc
      .plugins({where: { name: "ContributionRewardExt" }}).pipe(first()).toPromise();

    const contributionRewardExt = contributionRewardExts[0];
    const contributionRewardExtState = await contributionRewardExt.state().pipe(first()).toPromise();
    dao = new DAO(arc, contributionRewardExtState.dao.id);
    await gotoDaoPlugins(dao.id);
    await hideCookieAcceptWindow();
    await deleteCachedFormValues("CreatePluginManagerProposal");
  });

  it("Add Plugin", async () => {
    const createPluginButton = await $("a[data-test-id=\"createProposal\"]");
    await createPluginButton.waitForExist();
    await createPluginButton.click();

    const addPluginTab = await $("*[data-test-id=\"tab-AddPlugin\"]");
    await addPluginTab.waitForExist();
    await addPluginTab.click();

    const title = "Testing add plugin";
    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.waitForExist();
    await descriptionInput.setValue(title);

    const pluginSelect = await $("*[id=\"pluginToAdd\"]");
    await pluginSelect.waitForExist();
    await pluginSelect.click();
    const selectOption = await $("*[id=\"option-ContributionReward\"]");
    await selectOption.waitForExist();
    await selectOption.click();

    await submit();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();

  });

  it("Remove Plugin", async () => {
    const createPluginButton = await $("a[data-test-id=\"createProposal\"]");
    await createPluginButton.waitForExist();
    await createPluginButton.click();

    const removePluginTab = await $("*[data-test-id=\"tab-RemovePlugin\"]");
    await removePluginTab.waitForExist();
    await removePluginTab.click();

    const title = "Testing remove plugin";
    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.waitForExist();
    await descriptionInput.setValue(title);

    const pluginSelect = await $("*[id=\"pluginToRemove\"]");
    await pluginSelect.waitForExist();
    await pluginSelect.click();
    const selectOption = await $("*[id=\"option-0\"]");
    await selectOption.waitForExist();
    await selectOption.click();

    await submit();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

  it("Replace Plugin", async () => {
    const createPluginButton = await $("a[data-test-id=\"createProposal\"]");
    await createPluginButton.waitForExist();
    await createPluginButton.click();

    const replacePluginTab = await $("*[data-test-id=\"tab-ReplacePlugin\"]");
    await replacePluginTab.waitForExist();
    await replacePluginTab.click();

    const title = "Testing replace plugin";
    const titleInput = await $("*[id=\"titleInput\"]");
    await titleInput.waitForExist();
    await titleInput.setValue(title);

    const descriptionInput = await $(".mde-text");
    await descriptionInput.waitForExist();
    await descriptionInput.setValue(title);

    const addPluginSelect = await $("*[id=\"pluginToAdd\"]");
    await addPluginSelect.waitForExist();
    await addPluginSelect.click();
    const addPluginOption = await $("*[id=\"option-ContributionReward\"]");
    await addPluginOption.waitForExist();
    await addPluginOption.click();

    const removePluginSelect = await $("*[id=\"pluginToRemove\"]");
    await removePluginSelect.waitForExist();
    await removePluginSelect.click();
    const removePluginOption = await $("*[id=\"option-0\"]");
    await removePluginOption.waitForExist();
    await removePluginOption.click();

    await submit();

    const titleElement = await $(`[data-test-id="proposal-title"]=${title}`);
    await titleElement.waitForExist();
  });

});
