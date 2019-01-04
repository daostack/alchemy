config  = require('./wdio.conf.js').config

exports.config = {
  ...config,
  maxInstances: 1,
  capabilities: [{
    ...config.capabilities[0],
    chromeOptions: {
        args: ['headless', 'disable-gpu', 'disable-web-security']
    },
  }],
  waitforTimeout: 60000,
}
