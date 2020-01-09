import { hideCookieAcceptWindow } from "./utils";

const chai = require("chai");

global.expect = chai.expect;
chai.Should();

describe("Home page feed", () => {
  before(async () => {
    chai.Should();
  });

  it("Displays message and all DAOs when not logged in ", async () => {
    await browser.url("http://127.0.0.1:3000/");
    const title = await browser.getTitle();
    title.should.be.equal("Alchemy | DAOstack");
    await hideCookieAcceptWindow();
    const excuseMe = await $("*[data-test-id=\"not-logged-in-banner\"] > h1");
    await excuseMe.waitForExist();
    (await excuseMe.getText()).should.be.equal("Excuse me, who are you?");
    const daosHeader = await $("*[data-test-id=\"header-all-daos\"]");
    await daosHeader.waitForExist();
    const daoLink = await $("*[data-test-id=\"dao-link\"]");
    await daoLink.click();
  });
});
