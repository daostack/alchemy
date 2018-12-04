require("dotenv").config();
process.env = {
  ethereum: "http://127.0.0.1:8545",
  test_mnemonic:
    "behave pipe turkey animal voyage dial relief menu blush match jeans general",
  ...process.env
};
const fs = require("fs");
const path = require("path");
const yargs = require("yargs");
const handlebars = require("handlebars");
const yaml = require("js-yaml");
const Web3 = require("web3");
const HDWallet = require("hdwallet-accounts");
const glob = require("glob");

const UController = require("@daostack/arc/build/contracts/UController.json");
const GenesisProtocol = require("@daostack/arc/build/contracts/GenesisProtocol.json");
const Reputation = require("@daostack/arc/build/contracts/Reputation.json");
const ContributionReward = require("@daostack/arc/build/contracts/ContributionReward.json");
const DAOToken = require("@daostack/arc/build/contracts/DAOToken.json");
const Avatar = require("@daostack/arc/build/contracts/Avatar.json");

async function configure({ env, ...rest }) {
  const { [env]: publicConfig } = yaml.safeLoad(
    fs.readFileSync(__dirname + "/config.yaml", "utf-8")
  );
  const { [env]: privateConfig } = rest;
  const config = {
    env,
    development: env === "development",
    ...publicConfig,
    ...privateConfig
  };

  fs.writeFileSync(
    "config.json",
    JSON.stringify(config, undefined, 2),
    "utf-8"
  );

  const subschemas = await new Promise((res, rej) =>
    glob("src/**/*.graphql", (err, files) => (err ? rej(err) : res(files)))
  );
  const partials = subschemas.reduce(
    (acc, subschema) => ({
      ...acc,
      [path.basename(subschema).replace(/\.[^/.]+$/, "")]: fs.readFileSync(
        subschema,
        "utf-8"
      )
    }),
    {}
  );

  const schema = config =>
    subschemas
      .map(subschema =>
        handlebars.compile(fs.readFileSync(subschema, "utf-8"))(config)
      )
      .join("\n\n");

  fs.writeFileSync("schema.graphql", schema(config), "utf-8");

  const subgraph = handlebars.compile(
    fs.readFileSync("subgraph.handlebars.yaml", "utf-8")
  );

  fs.writeFileSync("subgraph.yaml", subgraph(config), "utf-8");

  const dockerCompose = handlebars.compile(
    fs.readFileSync("docker-compose.handlebars.yml", "utf-8")
  );
  fs.writeFileSync("docker-compose.yml", dockerCompose(config), "utf-8");
}

async function migrate(web3) {
  const { ethereum, test_mnemonic } = process.env;
  web3 = web3 || new Web3(ethereum);
  const hdwallet = HDWallet(10, test_mnemonic);
  Array(10)
    .fill(10)
    .map((_, i) => i)
    .forEach(i => {
      const pk = hdwallet.accounts[i].privateKey;
      const account = web3.eth.accounts.privateKeyToAccount(pk);
      web3.eth.accounts.wallet.add(account);
    });
  web3.eth.defaultAccount = web3.eth.accounts.wallet[0].address;

  const opts = {
    from: web3.eth.defaultAccount,
    gas: (await web3.eth.getBlock("latest")).gasLimit - 100000
  };

  const UC = new web3.eth.Contract(UController.abi, undefined, opts);
  const uc = await UC.deploy({
    data: UController.bytecode,
    arguments: []
  }).send();

  const Token = new web3.eth.Contract(DAOToken.abi, undefined, opts);
  const token = await Token.deploy({
    data: DAOToken.bytecode,
    arguments: ["TEST", "TST", 1000000000]
  }).send();

  const gpToken = await Token.deploy({
    data: DAOToken.bytecode,
    arguments: ["TEST", "TST", 1000000000]
  }).send();

  const GP = new web3.eth.Contract(GenesisProtocol.abi, undefined, opts);
  const gp = await GP.deploy({
    data: GenesisProtocol.bytecode,
    arguments: [gpToken.options.address]
  }).send();

  const Rep = new web3.eth.Contract(Reputation.abi, undefined, opts);
  const rep = await Rep.deploy({
    data: Reputation.bytecode,
    arguments: []
  }).send();

  const CR = new web3.eth.Contract(ContributionReward.abi, undefined, opts);
  const cr = await CR.deploy({
    data: ContributionReward.bytecode,
    arguments: []
  }).send();

  const AvatarContract = new web3.eth.Contract(Avatar.abi, undefined, opts);
  const avatar = await AvatarContract.deploy({
    data: Avatar.bytecode,
    arguments: ["TESTDAO", token.options.address, rep.options.address]
  }).send();

  const addresses = {
    UController: uc.options.address,
    Reputation: rep.options.address,
    DAOToken: token.options.address,
    GPToken: gpToken.options.address,
    ContributionReward: cr.options.address,
    GenesisProtocol: gp.options.address,
    Avatar: avatar.options.address
  };

  await configure({
    env: "development",
    development: { addresses }
  });

  return addresses;
}

async function generateAbis() {
  const base = require('path').dirname(require.resolve('@daostack/arc/build/contracts/UController.json'))
  if (!fs.existsSync("./abis/")) {
    fs.mkdirSync("./abis/");
  }
  const files = fs.readdirSync(base);
  files.forEach(file => {
    const abi = JSON.parse(fs.readFileSync(path.join(base, file), "utf-8")).abi;
    fs.writeFileSync(
      path.join("./abis/", file),
      JSON.stringify(abi, undefined, 2),
      "utf-8"
    );
  });
}

// if called as the main file run the cli, otherwise expose functions as a library
if (require.main === module) {
  yargs
    .command(
      "migrate",
      "Migrate contracts to ganache and configure the project appropriately",
      yargs => yargs,
      () => migrate()
    )
    .command(
      "generate-abis",
      "Fill the ./abis folder with abis from the @daostack/arc package",
      yargs => yargs,
      () => generateAbis()
    )
    .command(
      "configure",
      "Configure the project to a predefined configuration",
      yargs =>
        yargs.option("env", {
          alias: "e",
          desc: "Configuration choice",
          choices: ["mainnet", "kovan", "development"],
          default: "development"
        }),
      configure
    )
    .demandCommand()
    .completion()
    .env("daostack")
    .help().argv;
} else {
  module.exports = {
    configure,
    migrate
  };
}
