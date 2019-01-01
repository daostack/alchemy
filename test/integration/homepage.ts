import { chai, getContractAddresses, userAddresses } from './utils'
import * as uuid from 'uuid'

describe('Home page', () => {
  before(() => {
    chai.Should();
  })

  it('Works', async () => {
    browser.url('http://127.0.0.1:3000/')
    browser.getTitle().should.be.equal('Alchemy | DAOstack')
    browser.waitForExist('*[data-test-id="link-to-alchemy"]')
    browser.click('*[data-test-id="link-to-alchemy"]')
    browser.waitForExist('*[data-test-id="header-all-daos"]')
    browser.click('*[data-test-id="dao-link"]')
    if (browser.isVisible('*[data-test-id="skip-tour"]')) {
      browser.click('*[data-test-id="skip-tour"]')
    }
  })
})
