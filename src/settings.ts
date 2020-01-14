export const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    web3ProviderRead: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
  },
  staging: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v36_7_xdai",
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v36_7_xdai",
    web3Provider:  process.env.ARC_WEB3PROVIDER || "wss://poa.api.nodesmith.io/v1/core/jsonrpc/ws?apiKey=128059b9320a462699aef283a7ae2546",
    web3ProviderRead:  process.env.ARC_WEB3PROVIDERREAD || "wss://poa.api.nodesmith.io/v1/core/jsonrpc/ws?apiKey=128059b9320a462699aef283a7ae2546",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "api.thegraph.com",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs-daostack/api/v0/",
    },
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
  },
  production: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v36_4",
    graphqlWsProvider: process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v36_4",
    web3Provider: process.env.ARC_WEB3PROVIDER || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: process.env.ARC_WEB3PROVIDERREAD || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "api.thegraph.com",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs-daostack/api/v0/",
    },
    // txSenderServiceUrl: "https://tx-sender-service-mainnet.herokuapp.com/send-tx",
    txSenderServiceUrl: "",
  },
};
