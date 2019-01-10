import promisify = require("es6-promisify");
import axios from "axios";
import * as IPFS from 'ipfs-mini';
const bs58 = require('bs58');

// github.com/github/fetch/issues/175
function timeout(promise, ms) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      reject(new Error("timeout"))
    }, ms)
    promise.then(resolve, reject)
  })
}

const ipfsHashPrefix = '1220';
// Stores a static snapshot of the proposal data from before the ipfs migration
const legacyIpfsHash = 'QmQFu4LzbD8zAPf4wjpcxAkgYAywJnvfi3CAThfedUj7Ba';

let host;
let protocol;
try {
  host = window.location.host;
  protocol = window.location.protocol.replace(':', '');
} catch (e) {
  // the cacher accesses this docker image directly
  host = process.env.IPFS_URL;
  protocol = 'http';
}

const ipfsApi: any = new IPFS({
  protocol,
  host,
  port: protocol === 'https' ? '443' : '80',
  base: '/api/ipfs',
  pinning: true,
});

const ipfs: any = {};

ipfs.hashToHex = (hash: string): string => {
  return '0x' + bs58.decode(hash).toString('hex').substring(4);
}

ipfs.hexToHash = (hex: string): string => {
  if (hex.substring(0,2) === '0x') hex = hex.substring(2);
  return bs58.encode(Buffer.from(ipfsHashPrefix + hex, 'hex'));
}

ipfs.add = (data: Object) => {
  return promisify(ipfsApi.addJSON.bind(ipfsApi))(data);
}

const getLegacyData = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const response: any = await timeout(axios.get(`${protocol}://${host}/ipfs/${legacyIpfsHash}`), 1000);
      if (response && response.data) {
        return resolve(response.data);
      }
    } catch (e) {
      console.warn(`[IPFS] Error retrieving legacy data: ${e.message}`)
      return reject(false)
    }
  })
}

ipfs.get = async (ipfsHash: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response: any = await timeout(axios.get(`${protocol}://${host}/ipfs/${ipfsHash}`), 1000);
      if (response && response.data) {
        return resolve(response.data);
      }
    } catch (e) {}

    const legacyData = await getLegacyData()
    const hex = ipfs.hashToHex(ipfsHash)
    if (legacyData && legacyData[hex]) {
      return resolve(legacyData[hex])
    } else {
      console.warn(`[IPFS] Couldn't find details for description hash: ${hex}`)
      return resolve(false);
    }
  })
}

export default ipfs
