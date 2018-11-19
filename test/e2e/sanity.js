describe('Sanity', () => {
    before(() => {
      var chai = require('chai');
      global.expect = chai.expect;
      chai.Should();
      browser.url('http://0.0.0.0:3000/')
    });

    it('loads the landing page', async () => {
        browser.getTitle().should.be.equal('Alchemy | DAOstack')
        console.log(browser.getText('div'))
        browser.waitForExist('a[data-test-id="link-to-alchemy"]')
        browser.click('a[data-test-id="link-to-alchemy"]')
    });


    after(() => {
      // browser.pause(10000)
    })
});
