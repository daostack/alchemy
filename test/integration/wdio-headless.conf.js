config  = require('./wdio.conf.js').config

exports.config = {
  ...config,
  capabilities: [{
    ...config.capabilities[0],
    chromeOptions: {
        args: ['headless', 'disable-gpu', 'disable-web-security']
    }
  }]
}
