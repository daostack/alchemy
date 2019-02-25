import { getContractAddresses, userAddresses } from "./utils";

describe("Members page", () => {
    let addresses: string[];
    let daoAddress: string;

    before(() => {
      // global.expect = chai.expect
      addresses = getContractAddresses();
      daoAddress = addresses.Avatar.toLowerCase();
      browser.url(`http://127.0.0.1:3000`);
    });

    it("should exist", () => {
      browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/members`);
      browser.getTitle().should.be.equal("Alchemy | DAOstack");

      /// skip the tour
      if (browser.isVisible("*[data-test-id=\"skip-tour\"]")) {
        browser.click("*[data-test-id=\"skip-tour\"]");
      }

      // check if we see a member
      const address = userAddresses[0];
      browser.waitForExist(`*[data-test-id="member_${address}"]`);
      // TODO: we should see the repuation of this member
      browser.getText(`*[data-test-id="member_${address}"] *[data-test-id="reputation"]`)
        .should.have.string("16.67"); // TODO: should be 16.67 when migration adds founder rep as wei
    });
});
