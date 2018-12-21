const uuid = require('uuid');

function getContractAddresses() {
  const path = '@daostack/subgraph/migration.json'
  const addresses = { ...require(path).private.base, ...require(path).private.dao }
  if (!addresses || addresses === {}) {
    throw Error(`No addresses found, does the file at ${path} exist?`)
  }
  return addresses
}

describe('Profile page', () => {
    before(() => {
      let chai = require('chai')
      global.expect = chai.expect
      chai.Should();
      browser.url('http://127.0.0.1:3000/')
    })

    it('should exist and be editable', async () => {
      const addresses = getContractAddresses()
      const daoAddress = addresses.Avatar.toLowerCase()
      const userAddress = '0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1'
      browser.url(`http://127.0.0.1:3000/profile/${userAddress}?daoAvatarAddress=${daoAddress}`)
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
      browser.waitForExist('*[data-test-id="profile-container"]')
      browser.setValue('*[id="nameInput"]', 'Buster Scruggs')
      browser.setValue('*[id="descriptionInput"]', 'The ballad')
      browser.click('*[type="submit"]')
      // TODO: this will ask for a metamask confirmation

    })
})
