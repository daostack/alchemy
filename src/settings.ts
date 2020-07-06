// disables some UI elements for a less resource-intensive page load
export const ETHDENVER_OPTIMIZATION = true;
// if this is true, we do get the contractInfos from a locally stored file in ./data instead of from the subgraph
export const USE_CONTRACTINFOS_CACHE = false;
import BurnerConnectProvider from "@burner-wallet/burner-connect-provider";
import WalletConnectProvider from "@walletconnect/web3-provider";
const Torus = require("@toruslabs/torus-embed");
import { IArcOptions } from "@daostack/arc.js";
import { RetryLink } from "apollo-link-retry";

const Portis = require("@portis/web3");
const Fortmatic = require("fortmatic");
const SubgraphEndpoints = require("./subgraph_endpoints.json");

function isMobileBrowser(): boolean {
  // if (!window) {
  //   return false
  // }
  let check = false;
  // from here: https://detectmobilebrowsers.com/
  // eslint-disable-next-line no-useless-escape
  (function(a){if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent||navigator.vendor||(window as any).opera);
  return check;
}

function getWeb3ConnectProviderOptions(network: string) {
  if (typeof(window) === "undefined") {
    return null;
  }

  switch (network) {
    case "rinkeby":
      return {
        network: "rinkeby",
        torus: {
          package: Torus,
          options: { network: "rinkeby" },
        },
        walletconnect: {
          package: isMobileBrowser() ? null : WalletConnectProvider,
          options: {
            infuraId: process.env.INFURA_ID,
          },
        },
        burnerconnect: {
          package: BurnerConnectProvider,
          options: {
            defaultNetwork: "4",
            defaultWallets: [
              { origin: "https://denver-demo.burnerfactory.com/", name: "Denver Demo Wallet" },
            ],
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
      };
    case "kovan":
      return {
        network: "kovan",
        torus: {
          package: Torus,
          options: { network: "kovan" },
        },
        walletconnect: {
          package: isMobileBrowser() ? null : WalletConnectProvider,
          options: {
            infuraId: process.env.INFURA_ID,
          },
        },
        burnerconnect: {
          package: BurnerConnectProvider,
          options: {
            defaultNetwork: "42",
            defaultWallets: [
              { origin: "https://denver-demo.burnerfactory.com/", name: "Denver Demo Wallet" },
            ],
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
      };
    case "xdai":
      return {
        network: "xdai",
        torus: {
          package: Torus,
          options: {
            networkParams: {
              host: "https://xdai.poanetwork.dev",
              chainId: 100,
              networkName: "xdai",
              network: "xdai",
            },
          },
        },
        burnerconnect: {
          package: BurnerConnectProvider,
          options: {
            defaultNetwork: "100",
            defaultWallets: [
              { origin: "https://buffidao.com/", name: "BuffiDAO" },
              { origin: "https://judge.buffidao.com/", name: "Judges BuffiDAO Wallet" },
            ],
          },
        },
      };
    case "mainnet":
      return {
        network: "mainnet",
        torus: {
          package: Torus,
          options: { network: "mainnet" },
        },
        walletconnect: {
          package: isMobileBrowser() ? null : WalletConnectProvider,
          options: {
            infuraId: process.env.INFURA_ID,
          },
        },
        burnerconnect: {
          package: BurnerConnectProvider,
          options: {
            defaultNetwork: "1",
            defaultWallets: [
              { origin: "https://buffidao.com/", name: "BuffiDAO" },
            ],
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
      };
  }
}

export type Settings = IArcOptions & {
  txSenderServiceUrl: string;
  web3ConnectProviderOptions: any;
  retryLink?: RetryLink;
}

export type NetworkSettings = {
  [network: string]: Settings;
}

export const settings: NetworkSettings = {
  ganache: {
    graphqlHttpProvider: SubgraphEndpoints.http_ganache,
    graphqlWsProvider: SubgraphEndpoints.ws_ganache,
    graphqlSubscribeToQueries: false,
    web3Provider: "http://127.0.0.1:8545",
    ipfsProvider: "http://127.0.0.1:5001/api/v0",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
    web3ConnectProviderOptions: {},
  },
  rinkeby: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || SubgraphEndpoints.http_rinkeby,
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || SubgraphEndpoints.ws_rinkeby,
    graphqlSubscribeToQueries: false,
    web3Provider:  process.env.ARC_WEB3PROVIDER || `https://rinkeby.infura.io/v3/${process.env.INFURA_ID}`,
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
    web3ConnectProviderOptions: getWeb3ConnectProviderOptions("rinkeby"),
  },
  kovan: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || SubgraphEndpoints.http_kovan,
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || SubgraphEndpoints.ws_kovan,
    graphqlSubscribeToQueries: false,
    web3Provider:  process.env.ARC_WEB3PROVIDER || `https://kovan.infura.io/v3/${process.env.INFURA_ID}`,
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
    web3ConnectProviderOptions: getWeb3ConnectProviderOptions("kovan"),
  },
  xdai: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || SubgraphEndpoints.http_xdai,
    graphqlWsProvider:  process.env.ARC_GRAPHQLWSPROVIDER || SubgraphEndpoints.ws_xdai,
    graphqlSubscribeToQueries: false,
    web3Provider:  process.env.ARC_WEB3PROVIDER || "https://xdai.poanetwork.dev",
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    txSenderServiceUrl: "",
    web3ConnectProviderOptions: getWeb3ConnectProviderOptions("xdai"),
  },
  main: {
    graphqlHttpProvider: process.env.ARC_GRAPHQLHTTPPROVIDER || SubgraphEndpoints.http_main,
    graphqlWsProvider: process.env.ARC_GRAPHQLWSPROVIDER || SubgraphEndpoints.ws_main,
    graphqlSubscribeToQueries: false,
    web3Provider: process.env.ARC_WEB3PROVIDER || `https://mainnet.infura.io/v3/${process.env.INFURA_ID}`,
    ipfsProvider: process.env.ARC_IPFSPROVIDER || "https://api.thegraph.com:443/ipfs-daostack/api/v0",
    // txSenderServiceUrl: "https://tx-sender-service-mainnet.herokuapp.com/send-tx",
    txSenderServiceUrl: "",
    web3ConnectProviderOptions: getWeb3ConnectProviderOptions("mainnet"),
  },
};
