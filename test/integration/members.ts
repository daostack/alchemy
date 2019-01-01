import { getContractAddresses } from './utils'

describe('Members page', () => {
    let addresses
    let daoAddress

    before(() => {
      // global.expect = chai.expect
      addresses = getContractAddresses()
      daoAddress = addresses.Avatar.toLowerCase()
    })

    it('should exist', () => {
      browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/members`)
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
      // check if we see a member
      const address = '0xb0c908140fe6fd6fbd4990a5c2e35ca6dc12bfb2'
      browser.waitForExist(`*[data-test-id="member_${address}"]`)
      // we should see the repuation of this member
      browser.getText(`*[data-test-id="member_${address}"] *[data-test-id="reputation"]`)
        .should.be.equal("1000")
    })
})
