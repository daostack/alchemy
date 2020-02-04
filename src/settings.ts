import WalletConnectProvider from "@walletconnect/web3-provider";
import { isMobileBrowser } from "./lib/util";

const Portis = require("@portis/web3");
const Fortmatic = require("fortmatic");

export const settings = {
  ganache: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    graphqlSubscribeToQueries: false,
    web3Provider: "ws://127.0.0.1:8545",
    web3ProviderRead: "ws://127.0.0.1:8545",
    ipfsProvider: "http://127.0.0.1:5001/api/v0",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
    web3ConnectProviderOptions: {},
  },
  rinkeby: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v37_2_rinkeby",
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v37_2_rinkeby",
    graphqlSubscribeToQueries: false,
    web3Provider:  process.env.ARC_WEB3PROVIDER || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead:  process.env.ARC_WEB3PROVIDERREAD || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
    web3ConnectProviderOptions: {
      network: "rinkeby",
      walletconnect: {
        package: isMobileBrowser() ? null : WalletConnectProvider,
        options: {
          infuraId: "e0cdf3bfda9b468fa908aa6ab03d5ba2",
        },
      },
      portis: {
        package: Portis,
        options: {
          id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
        },
      },
      fortmatic: {
        package: Fortmatic,
        options: {
          key: "pk_test_659B5B486EF199E4",
        },
      },
      squarelink: {
        options: {
          id: null as any,
        },
      },
    },
  },
  xdai: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v37_2_xdai",
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v37_2_xdai",
    graphqlSubscribeToQueries: false,
    web3Provider:  process.env.ARC_WEB3PROVIDER || "wss://poa.api.nodesmith.io/v1/core/jsonrpc/ws?apiKey=128059b9320a462699aef283a7ae2546",
    web3ProviderRead:  process.env.ARC_WEB3PROVIDERREAD || "wss://poa.api.nodesmith.io/v1/core/jsonrpc/ws?apiKey=128059b9320a462699aef283a7ae2546",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    txSenderServiceUrl: "",
    web3ConnectProviderOptions: {},
  },
  mainnet: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v37_2",
    graphqlWsProvider: process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v37_2",
    graphqlSubscribeToQueries: false,
    web3Provider: process.env.ARC_WEB3PROVIDER || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: process.env.ARC_WEB3PROVIDERREAD || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    // txSenderServiceUrl: "https://tx-sender-service-mainnet.herokuapp.com/send-tx",
    txSenderServiceUrl: "",
    web3ConnectProviderOptions: {
      network: "mainnet",
      walletconnect: {
        package: isMobileBrowser() ? null : WalletConnectProvider,
        options: {
          infuraId: "e0cdf3bfda9b468fa908aa6ab03d5ba2",
        },
      },
      portis: {
        package: Portis,
        options: {
          id: "aae9cff5-6e61-4b68-82dc-31a5a46c4a86",
        },
      },
      fortmatic: {
        package: Fortmatic,
        options: {
          key: "pk_live_38A2BD2B1D4E9912",
        },
      },
      squarelink: {
        options: {
          id: null as any,
        },
      },
    },
  },
};


