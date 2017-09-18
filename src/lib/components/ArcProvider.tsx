// import * as React from "react";
// //const PropTypes = require('prop-types');
// import { isEmpty } from 'lodash';
// // const AccountUnavailable = require('./AccountUnavailable');
// // const ArcUnavailable = require('./ArcUnavailable');
// import * as Arc from 'web3';


// const ONE_SECOND = 1000;
// const ONE_MINUTE = ONE_SECOND * 60;

// export interface IArcProviderState {
//   controllerAddresses: string[],
//   tokenAddresses: string[],
//   reputationAddresses: string[],
//   controllerInstance: any
// }

// export interface IArcProviderProps {
//   onChangeAccount? : (account: string) => null
// }

// export interface IArcProviderContext {
//   arc: {
//     controllerAddresses: string[],
//     tokenAddresses: string[],
//     reputationAddresses: string[],
//     controllerInstance: any
//   }
// }

// export default class ArcProvider extends React.Component<IArcProviderProps, IArcProviderState> {

//   static contextTypes = {
//     store: React.PropTypes.object
//   };

//   static childContextTypes = {
//     arc: React.PropTypes.object
//   }

//   constructor(props: IArcProviderProps, context: IArcProviderContext) {
//     super(props, context);

//     //const accounts = this.getAccounts();

//     this.state = {
//       controllerAddresses: [],
//       tokenAddresses: [],
//       reputationAddresses: [],
//       controllerInstance: null
//     };

//     // this.interval = null;
//     // this.networkInterval = null;
//     //this.getAddresses(); //= this.fetchAccounts.bind(this);
// //    this.fetchNetwork = this.fetchNetwork.bind(this);

//   }

//   getChildContext(): IArcProviderContext {
//     return {
//       arc: {
//         controllerAddresses: this.state.controllerAddresses,
//         tokenAddresses: this.state.tokenAddresses,
//         reputationAddresses: this.state.reputationAddresses,
//         controllerInstance: this.state.controllerInstance
//       }
//     };
//   }

//   /**
//    * Start polling accounts, & network. We poll indefinitely so that we can
//    * react to the user changing accounts or netowrks.
//    */
//   componentDidMount() {
//     this.getAddresses();
//   }

//   /**
//    * Init web3/account polling, and prevent duplicate interval.
//    * @return {void}
//    */
//   initPoll() {
//     if (!this.interval) {
//       this.interval = window.setInterval(this.fetchAccounts, ONE_SECOND);
//     }
//   }

//   /**
//    * Init network polling, and prevent duplicate intervals.
//    * @return {void}
//    */
//   initNetworkPoll() {
//     if (!this.networkInterval) {
//       this.networkInterval = window.setInterval(this.fetchNetwork, ONE_MINUTE);
//     }
//   }

//   /**
//    * Update state regarding the availability of web3 and an ETH account.
//    * @return {void}
//    */
//   fetchAccounts() {
//     const { web3 } = window;
//     const ethAccounts = this.getAccounts();

//     if (isEmpty(ethAccounts)) {
//       web3 && web3.eth && web3.eth.getAccounts((err: Error, accounts: string[]) => {
//         if (err) {
//           this.setState({
//             accountsError: err.message
//           });
//         } else {
//           this.handleAccounts(accounts);
//         }
//       });
//     } else {
//       this.handleAccounts(ethAccounts);
//     }
//   }

//   handleAccounts(accounts: string[], isConstructor = false) {
//     const { onChangeAccount } = this.props;
//     const { store } = this.context;
//     let next = accounts[0];
//     let curr = this.state.accounts[0];
//     next = next && next.toLowerCase();
//     curr = curr && curr.toLowerCase();
//     const didChange = curr && next && (curr !== next);

//     if (!isConstructor) {
//       this.setState({
//         accountsError: null,
//         accounts
//       });
//     }

//     // If provided, execute callback
//     if (didChange && typeof onChangeAccount === 'function') {
//       onChangeAccount(next);
//     }

//     // If available, dispatch redux action
//     if (store && typeof store.dispatch === 'function') {
//       const didDefine = !curr && next;

//       if (didDefine || (isConstructor && next)) {
//         store.dispatch({
//           type: 'web3/RECEIVE_ACCOUNT',
//           address: next
//         });
//       } else if (didChange) {
//         store.dispatch({
//           type: 'web3/CHANGE_ACCOUNT',
//           address: next
//         })
//       }
//     }
//   }

//   /**
//    * Get the network and update state accordingly.
//    * @return {void}
//    */
//   fetchNetwork() {
//     const { web3 } = window;
//     web3 && web3.version && web3.version.getNetwork((err: Error, netId: string) => {
//       if (err) {
//         this.setState({
//           networkError: err.message
//         });
//       } else {
//         this.setState({
//           networkError: null,
//           networkId: netId
//         })
//       }
//     });
//   }

//   /**
//    * Get the account. We wrap in try/catch because reading `web3.eth.accounrs`
//    * will throw if no account is selected.
//    * @return {String}
//    */
//   getAccounts() {
//     try {
//       const { web3 } = window;

//       // throws if no account selected
//       const accounts = web3.eth.accounts;

//       return accounts;
//     } catch (e) {
//       return [];
//     }
//   }

//   render() {
//     return <div>{this.props.children}</div>
//   }
// }

// /* =============================================================================
// =    Deps
// ============================================================================= */
// function getNetwork(networkId: string) {
//   switch (networkId) {
//     case '1':
//       return 'MAINNET';
//     case '2':
//       return 'MORDEN';
//     case '3':
//       return 'ROPSTEN';
//     default:
//       return 'UNKNOWN';
//   }
// }