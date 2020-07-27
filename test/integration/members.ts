import * as chai from "chai";
import { getTestAddresses, userAddresses, ITestAddresses, goToUrl } from "./utils";

describe("Members page", () => {
  let addresses: ITestAddresses;
  let daoAddress: string;

  before(async () => {
    chai.Should();
    addresses = getTestAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
  });

  it("should exist", async () => {
    await goToUrl(`http://127.0.0.1:3000/dao/${daoAddress}/members`);
    const title = await browser.getTitle();
    title.should.be.equal("Alchemy | DAOstack");

    // check if we see a member
    const address = userAddresses[0];
    const memberElement = await $(`*[data-test-id="member_${address}"]`);
    await memberElement.waitForExist();
  });
});
