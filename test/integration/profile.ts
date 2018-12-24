import { getContractAddresses, userAddresses } from './utils'

describe('Profile page', () => {
    let addresses
    let daoAddress
    const userAddress = userAddresses[0]

    before(() => {
      const chai = require('chai')
      global.expect = chai.expect
      chai.Should();
      browser.url('http://127.0.0.1:3000/')
      addresses = getContractAddresses()
      daoAddress = addresses.Avatar.toLowerCase()
    })

    it('should exist and be editable', async () => {
      browser.url(`http://127.0.0.1:3000/profile/${userAddress}?daoAvatarAddress=${daoAddress}`)
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
      browser.waitForExist('*[data-test-id="profile-container"]')
      browser.waitForExist('*[id="nameInput"]')
      browser.setValue('*[id="nameInput"]', 'Buster Scruggs')
      browser.setValue('*[id="descriptionInput"]', 'The ballad')
      browser.click('*[type="submit"]')
      // TODO: this will ask for a metamask confirmation

    })

    it('should also work without a DAO address', async () => {
      browser.url(`http://127.0.0.1:3000/profile/${userAddress}`)
      browser.waitForExist('*[data-test-id="profile-container"]')
    })
})
