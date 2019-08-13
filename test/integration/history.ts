import { getContractAddresses } from "./utils";

describe("History page", () => {
  let addresses;
  let daoAddress: string;

  before(async () => {
    addresses = getContractAddresses();
    daoAddress = addresses.dao.Avatar.toLowerCase();
  });

  it("should exist", async () => {
    await browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/history`);
    const title = await browser.getTitle();
    title.should.be.equal("Alchemy | DAOstack");
  });
});
