import * as uuid from 'uuid'
import { chai, getContractAddresses } from './utils'

describe('Proposals', () => {
    let daoAddress: string
    let addresses

    before(() => {
      chai.Should()
      addresses = getContractAddresses()
      daoAddress = addresses.Avatar.toLowerCase()
    })

    it('Create a proposal', async () => {
      browser.url('http://127.0.0.1:3000/ ')
      const url = `http://127.0.0.1:3000/dao/${daoAddress}/`
      browser.url(url)

      browser.waitForExist('*[data-test-id="create-proposal"]');

      /// skip the tour
      if (browser.isVisible('*[data-test-id="skip-tour"]')) {
        browser.click('*[data-test-id="skip-tour"]')
      }

      browser.click('*[data-test-id="create-proposal"]')

      browser.waitForExist('*[id="titleInput"]')
      browser.setValue('*[id="titleInput"]', 'Free Edward Snowden')
      // using uuid value so that the test will pass alsko if there is already a proposal with thi description
      // (which must be unique). TODO: find a way to reset the state
      browser.setValue('*[id="descriptionInput"]', `https://this.must.be/a/valid/url${uuid()}`)
      browser.setValue('*[data-test-id="beneficiaryInput"]', '0x5fB320886aF629122736c0e1a5c94dCE841EA37B')
      // ask for 100 rep
      const repReward = Math.floor(Math.random() * 1000)
      browser.setValue('*[id="reputationRewardInput"]', `${repReward}` )
      const ethReward = Math.floor(Math.random() * 1000)
      browser.setValue('*[id="ethRewardInput"]', `${ethReward}` )
      browser.click('*[type="submit"]')
      // we shoudl now see a dialog asking us to "launch metamask"
      browser.click('*[data-test-id="launch-metamask"]')
      // since we are working with unlocked accounts (are we?) and we do not haver metamask installed
      // we do not need to confirm at all..

      // check that the proposal with the ethReward appears in the list
      browser.waitForExist(`strong*=${ethReward}`)

      // browser.waitForExist('*[data-test-id="proposal-title"]')
      // // we are getting the closing date from the graph-node server
      // browser.getText('*[data-test-id="proposal-closes-in"]').should.be.equal('CLOSES IN 21 DAYS')
      // TODO: title etc are not yet working
      // browser.getText('*[data-test-id="proposal-title"]').should.be.equal('Free Edward Snowden')
    })

});
