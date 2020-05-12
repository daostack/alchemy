import { getTestAddresses, ITestAddresses } from "./utils";

describe("History page", () => {
  let addresses: ITestAddresses;
  let daoAddress: string;

  before(async () => {
    addresses = getTestAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
  });

  it("should exist", async () => {
    await browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/history`);
    const title = await browser.getTitle();
    title.should.be.equal("Alchemy | DAOstack");
  });
});
