// this config file is used for testing on travis

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
  waitforTimeout: 900000, // 15 minutes
  mochaOpts: {
      ...config.mochaOpts,
      timeout: 600000 // 10 mins
  },
}
