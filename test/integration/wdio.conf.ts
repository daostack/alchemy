const drivers = {
  // https://chromedriver.chromium.org/
  // check for more recent versions of chrome driver here:
  // https://chromedriver.storage.googleapis.com/index.html
  chrome: {
    version: "87.0.4280.20",
    arch: process.arch,
  },
};

const config: WebdriverIO.Config = {
  specs: ["./test/integration/*.e2e.ts"],
  suites: {
    suite1: [
      "./test/integration/daos.e2e.ts",
      "./test/integration/feed.e2e.ts",
      "./test/integration/history.e2e.ts",
      "./test/integration/members.e2e.ts",
      "./test/integration/profile.e2e.ts",
    ],
    suite2: [
      "./test/integration/proposal.e2e.ts",
      "./test/integration/proposal-competition.e2e.ts",
      "./test/integration/proposal-genericScheme.e2e.ts",
      "./test/integration/proposal-genericSchemeDutchx.e2e.ts",
      "./test/integration/proposal-genericSchemeEnsPublicResolver.e2e.ts",
    ],
    suite3: [
      "./test/integration/proposal-genericSchemeEnsRegistry.e2e.ts",
      "./test/integration/proposal-genericSchemeRegistryLookup.e2e.ts",
      "./test/integration/proposal-genericSchemeStandardBounties.e2e.ts",
      "./test/integration/proposal-schemeregistrar.e2e.ts",
      "./test/integration/rewards.e2e.ts",
    ],
  },
  maxInstances: 1,
  capabilities: [
    {
      maxInstances: 1,
      browserName: "chrome",
      "goog:chromeOptions": {
        args: ["window-size=1920,1080"],
      },
    },
  ],
  logLevel: "warn",
  bail: 0,
  baseUrl: "http://127.0.0.1:3000",
  waitforTimeout: 60000,
  connectionRetryTimeout: 30000,
  connectionRetryCount: 3,
  services: [
    ["selenium-standalone", {
      logPath: "logs",
      installArgs: {drivers},
      args: {drivers},
    }],
  ],
  framework: "mocha",
  reporters: ["dot", "spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 300000, // 5 mins
  },

  before: function () {
    (global as any).inAlchemyTests = true;
    const chai = require("chai");
    (global as any).expect = chai.expect;
    chai.Should();
  },
};

export { config };
