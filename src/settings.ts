export const settings = {
  dev: {
    graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
    graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
    web3Provider: "ws://127.0.0.1:8545",
    web3ProviderRead: "ws://127.0.0.1:8545",
    ipfsProvider: "localhost",
  },
  staging: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v31_0_rinkeby",
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v31_0_rinkeby",
    web3Provider:  process.env.ARC_WEB3PROVIDER || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead:  process.env.ARC_WEB3PROVIDERREAD || "wss://rinkeby.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "api.thegraph.com",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs-daostack/api/v0/",
    },
  },
  production: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || "https://api.thegraph.com/subgraphs/name/daostack/v31_0",
    graphqlWsProvider: process.env.ARC_GRAPHQLWSPROVIDER || "wss://api.thegraph.com/subgraphs/name/daostack/v31_0",
    web3Provider: process.env.ARC_WEB3PROVIDER || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    web3ProviderRead: process.env.ARC_WEB3PROVIDERREAD || "wss://mainnet.infura.io/ws/v3/e0cdf3bfda9b468fa908aa6ab03d5ba2",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || {
      "host": process.env.ARC_IPFSPROVIDER_HOST || "api.thegraph.com",
      "port": process.env.ARC_IPFSPROVIDER_PORT || "443",
      "protocol": process.env.ARC_IPFSPROVIDER_PROTOCOL || "https",
      "api-path": process.env.ARC_IPFSPROVIDER_API_PATH || "/ipfs-daostack/api/v0/",
    },
  },
};
