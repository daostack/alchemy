config  = require('./wdio.conf.js').config
config.capabilities.chromeOptions = {
  args: ['headless', 'disable-gpu']
}
exports.config =  config
