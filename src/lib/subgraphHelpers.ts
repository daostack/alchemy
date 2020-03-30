import axios from "axios";
import { settings } from "../settings";
import { getCurrentBlock, targetedNetwork } from "../arc";
import { Observable } from "rxjs";

/**
 * Check if the subgraph is running and synced to the blockchain
 * Sometimes if the page is left open for a long time the connection to the subgraph breaks
 * @returns Promise with status of subgraph { id, failed, synced, latestEthereumBlockNumber }
 */
async function monitorGraphNodeSubgraph() {
  if (targetedNetwork() === "ganache") {
    const query = `{
      subgraphs {
        name
        currentVersion {
          deployment {
            id
            latestEthereumBlockNumber
            totalEthereumBlocksCount
            synced
            failed
          }
        }
      }
    }`;

    try {
      const subgraphURL = settings.ganache.graphqlHttpProvider.split("/name/daostack")[0];
      const { data } = (await axios.post(subgraphURL, { query })).data;
      for (const i in data.subgraphs) {
        if (data.subgraphs[i].name === "daostack") {
          const { id, failed, synced, latestEthereumBlockNumber } = data.subgraphs[i].currentVersion.deployment;
          return { id, failed, synced, latestEthereumBlockNumber };
        }
      }
    } catch (e) {
      console.error("Failed in monitoring graph node", e);
      return { id: null, failed: true, synced: false, latestEthereumBlockNumber: 0 };
    }
  }

  const subgraphName = (settings as any)[process.env.NETWORK]["graphqlHttpProvider"].split("https://api.thegraph.com/subgraphs-daostack/name/daostack/")[1];
  const query = `{
    indexingStatusesForSubgraphName(subgraphName: "daostack/` + subgraphName + `") { subgraph synced failed chains { network ... on EthereumIndexingStatus { latestBlock { number hash } chainHeadBlock { number hash } } } }
  }`;

  try {
    const { data } = (await axios.post("https://api.thegraph.com/index-node/graphql", { query })).data;
    if (data.indexingStatusesForSubgraphName !== []) {
      const id = data.indexingStatusesForSubgraphName[0].subgraph;
      const failed = data.indexingStatusesForSubgraphName[0].failed;
      const synced = data.indexingStatusesForSubgraphName[0].synced;
      const latestEthereumBlockNumber = data.indexingStatusesForSubgraphName[0].chains[0].latestBlock.number;
      return { id, failed, synced, latestEthereumBlockNumber };
    }
  } catch (e) {
    console.error("Failed in monitoring graph node", e);
    return { id: null, failed: true, synced: false, latestEthereumBlockNumber: 0 };
  }
}

/**
 * Poll to see if the subgraph is running and synced to the blockchain
 * @returns Observable<boolean> indicating if subgraph is updating correctly
 */
export function pollSubgraphUpdating(): Observable<boolean> {
  return Observable.create((observer: any): () => void  => {
    let running = false;

    async function poll() {
      if (!running) {
        running = true;
        try {
          const status = await monitorGraphNodeSubgraph();
          const curBlock = (await getCurrentBlock()).number;

          // Subgraph not updating if returns an error, is not synced fully, or latest block is more than 2 blocks behind web3
          if (status.failed || !status.synced || (curBlock - Number(status.latestEthereumBlockNumber) > 2)) {
            observer.next(false);
          } else {
            observer.next(true);
          }
        } catch (ex) {
          console.error(ex ? ex.message : "unknown error");
          observer.next(false);
        } finally {
          running = false;
        }
      }
    }

    poll();
    const interval = setInterval(poll, 10000);
    return (): void => { clearTimeout(interval); };
  });
}
