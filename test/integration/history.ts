import { getContractAddresses, userAddresses } from './utils'

describe('History page', () => {
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

    it('should exist', async () => {
      browser.url(`http://127.0.0.1:3000/dao/${daoAddress}/history`)
      browser.getTitle().should.be.equal('Alchemy | DAOstack')
    })
})
