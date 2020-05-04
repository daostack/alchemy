// this config file is used for testing on travis

const config = require("./wdio.conf.js").config;

exports.config = {
  ...config,
  maxInstances: 1,
  capabilities: [{
    ...config.capabilities[0],
    "goog:chromeOptions": {
      args: ["--headless", "--disable-gpu", "--window-size=1920,1080"],
    },
  }],
  waitforTimeout: 900000, // 15 minutes
  mochaOpts: {
    ...config.mochaOpts,
    timeout: 540000, // 9 mins (travis times out after 10)
  },
};
