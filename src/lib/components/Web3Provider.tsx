import * as React from "react";
//const PropTypes = require('prop-types');
import { isEmpty } from 'lodash';
// const AccountUnavailable = require('./AccountUnavailable');
// const Web3Unavailable = require('./Web3Unavailable');
import * as Web3 from 'web3';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;

export interface IWeb3ProviderState {
  accounts: string[],
  networkId: string,
  networkError: string,
  accountsError: string
}

export interface IWeb3ProviderProps {
  onChangeAccount? : (account: string) => null
}

export interface IWeb3ProviderContext {
  web3: {
    accounts: string[],
    selectedAccount: string,
    network: string,
    networkId: string
  }
}

declare global {
  interface Window {
    web3: Web3
  }
}

export default class Web3Provider extends React.Component<IWeb3ProviderProps, IWeb3ProviderState> {
  interval: number;
  networkInterval: number;

  static contextTypes = {
    store: React.PropTypes.object
  };

  static childContextTypes = {
    web3: React.PropTypes.object
  }

  constructor(props: IWeb3ProviderProps, context: IWeb3ProviderContext) {
    super(props, context);

    const accounts = this.getAccounts();

    this.state = {
      accounts,
      networkId: null,
      networkError: null,
      accountsError: null
    };

    this.interval = null;
    this.networkInterval = null;
    this.fetchAccounts = this.fetchAccounts.bind(this);
    this.fetchNetwork = this.fetchNetwork.bind(this);

    if (accounts) {
      this.handleAccounts(accounts, true);
    }
  }

  getChildContext(): IWeb3ProviderContext {
    return {
      web3: {
        accounts: this.state.accounts,
        selectedAccount: this.state.accounts && this.state.accounts[0],
        network: getNetwork(this.state.networkId),
        networkId: this.state.networkId
      }
    };
  }

  /**
   * Start polling accounts, & network. We poll indefinitely so that we can
   * react to the user changing accounts or netowrks.
   */
  componentDidMount() {
    this.fetchAccounts();
    this.fetchNetwork();
    this.initPoll();
    this.initNetworkPoll();
  }

  /**
   * Init web3/account polling, and prevent duplicate interval.
   * @return {void}
   */
  initPoll() {
    if (!this.interval) {
      this.interval = window.setInterval(this.fetchAccounts, ONE_SECOND);
    }
  }

  /**
   * Init network polling, and prevent duplicate intervals.
   * @return {void}
   */
  initNetworkPoll() {
    if (!this.networkInterval) {
      this.networkInterval = window.setInterval(this.fetchNetwork, ONE_MINUTE);
    }
  }

  /**
   * Update state regarding the availability of web3 and an ETH account.
   * @return {void}
   */
  fetchAccounts() {
    const { web3 } = window;
    const ethAccounts = this.getAccounts();

    if (isEmpty(ethAccounts)) {
      web3 && web3.eth && web3.eth.getAccounts((err: Error, accounts: string[]) => {
        if (err) {
          this.setState({
            accountsError: err.message
          });
        } else {
          this.handleAccounts(accounts);
        }
      });
    } else {
      this.handleAccounts(ethAccounts);
    }
  }

  handleAccounts(accounts: string[], isConstructor = false) {
    const { onChangeAccount } = this.props;
    const { store } = this.context;
    let next = accounts[0];
    let curr = this.state.accounts[0];
    next = next && next.toLowerCase();
    curr = curr && curr.toLowerCase();
    const didChange = curr && next && (curr !== next);

    if (!isConstructor) {
      this.setState({
        accountsError: null,
        accounts
      });
    }

    // If provided, execute callback
    if (didChange && typeof onChangeAccount === 'function') {
      onChangeAccount(next);
    }

    // If available, dispatch redux action
    if (store && typeof store.dispatch === 'function') {
      const didDefine = !curr && next;

      if (didDefine || (isConstructor && next)) {
        store.dispatch({
          type: 'web3/RECEIVE_ACCOUNT',
          address: next
        });
      } else if (didChange) {
        store.dispatch({
          type: 'web3/CHANGE_ACCOUNT',
          address: next
        })
      }
    }
  }

  /**
   * Get the network and update state accordingly.
   * @return {void}
   */
  fetchNetwork() {
    const { web3 } = window;
    web3 && web3.version && web3.version.getNetwork((err: Error, netId: string) => {
      if (err) {
        this.setState({
          networkError: err.message
        });
      } else {
        this.setState({
          networkError: null,
          networkId: netId
        })
      }
    });
  }

  /**
   * Get the account. We wrap in try/catch because reading `web3.eth.accounrs`
   * will throw if no account is selected.
   * @return {String}
   */
  getAccounts() {
    try {
      const { web3 } = window;

      // throws if no account selected
      const accounts = web3.eth.accounts;

      return accounts;
    } catch (e) {
      return [];
    }
  }

  render() {
    return React.Children.only(this.props.children);
  }
}

/* =============================================================================
=    Deps
============================================================================= */
function getNetwork(networkId: string) {
  switch (networkId) {
    case '1':
      return 'MAINNET';
    case '2':
      return 'MORDEN';
    case '3':
      return 'ROPSTEN';
    default:
      return 'UNKNOWN';
  }
}