const DAOstackMigration = require('@daostack/migration')

async function deployDaoStack (options) {
  // console.log(DAOstackMigration.migration('private'))

  options = {
    // web3 provider url
    provider: 'http://localhost:8545',
    // gas price in GWei. If not specified, will use an automatically suggested price.
    gasPrice: 3.4,
    // surpress console output
    quiet: true,
    // disable confirmation messages
    force: true,
    // filepath to output the migration results
    output: 'config/migration.json',
    // private key of the account used in migration (overrides the 'mnemonic' option)
    // privateKey: '0x8d4408014d165ec69d8cc9f091d8f4578ac5564f376f21887e98a6d33a6e3549',
    // mnemonic used to generate the private key of the account used in migration
    // mnemonic: 'behave pipe turkey animal voyage dial relief menu blush match jeans general',
    // migration parameters
    // params: {
    // 	default: {
    // 		// migration params as defined in the "Migration parameters" section below
    // 	},
    // 	private: {
    // 		// overide defaults on private network
    // 	},
    // 	kovan: {
    // 		// overide defaults on kovan
    // 	},
    // }
    ...options
  };

  // migrate both base and an example DAO
  const migrationResult = await DAOstackMigration.migrate(options); // migrate
  return { options, migrationResult }
}

module.exports = {
  deployDaoStack
}
