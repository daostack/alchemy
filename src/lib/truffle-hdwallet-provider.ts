/* tslint:disable */
// Copied and converted to typescript from https://github.com/trufflesuite/truffle-hdwallet-provider
// TODO: publish our own fork of the repo
var bip39 = require("bip39");
var hdkey = require('ethereumjs-wallet/hdkey');
var ProviderEngine = require("web3-provider-engine");
var FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
var HookedSubprovider = require('web3-provider-engine/subproviders/hooked-wallet.js');
var ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
var Web3 = require("web3");
var Transaction = require('ethereumjs-tx');

class HDWalletProvider {
  mnemonic: string;
  hdwallet: any;
  wallet_hdpath: string;
  wallets: { [key : string] : any };
  addresses: string[];
  engine: any;

  constructor(mnemonic: string, provider_url: string, address_index:number = 0, num_addresses: number = 1) {
    this.mnemonic = mnemonic;
    this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
    this.wallet_hdpath = "m/44'/60'/0'/0/";
    this.wallets = {};
    this.addresses = [];

    for (let i = address_index; i < address_index + num_addresses; i++){
      var wallet = this.hdwallet.derivePath(this.wallet_hdpath + i).getWallet();
      var addr = '0x' + wallet.getAddress().toString('hex');
      this.addresses.push(addr);
      this.wallets[addr] = wallet;
    }

    const tmp_accounts = this.addresses;
    const tmp_wallets = this.wallets;

    this.engine = new ProviderEngine();
    this.engine.addProvider(new HookedSubprovider({
      getAccounts: function(cb : Function) { cb(null, tmp_accounts) },
      getPrivateKey: function(address: string, cb: Function) {
        if (!tmp_wallets[address]) { return cb('Account not found'); }
        else { cb(null, tmp_wallets[address].getPrivateKey().toString('hex')); }
      },
      signTransaction: function(txParams: any, cb: Function) {
        let pkey;
        if (tmp_wallets[txParams.from]) { pkey = tmp_wallets[txParams.from].getPrivateKey(); }
        else { cb('Account not found'); }
        var tx = new Transaction(txParams);
        tx.sign(pkey);
        var rawTx = '0x' + tx.serialize().toString('hex');
        cb(null, rawTx);
      }
    }));
    this.engine.addProvider(new FiltersSubprovider());
    this.engine.addProvider(new ProviderSubprovider(new Web3.providers.HttpProvider(provider_url)));
    this.engine.start(); // Required by the provider engine.
  }

  sendAsync() {
    this.engine.sendAsync.apply(this.engine, arguments);
  }

  send() {
    return this.engine.send.apply(this.engine, arguments);
  }

  // returns the address of the given address_index, first checking the cache
  getAddress(idx: number) {
    if (!idx) { return this.addresses[0]; }
    else { return this.addresses[idx]; }
  }

  // returns the addresses cache
  getAddresses() {
    return this.addresses;
  }
};

export default HDWalletProvider;