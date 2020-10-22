import { AbiItem } from "web3-utils";
import { Interface, isHexString } from "ethers/utils";
import { SortService } from "lib/sortService";
const Web3 = require("web3");
import axios from "axios";
import { isAddress, targetedNetwork } from "lib/util";

export interface IAllowedAbiItem extends AbiItem {
  name: string
  type: "function"
}

export interface IAbiItemExtended extends IAllowedAbiItem {
  action: string
  methodSignature: string
}
/* eslint-disable */
const CUSTOM_ABIS = {
  "0x42f863ee29eaf48563edcb553e66b3cee406851b":[{"type":"event","name":"Approval","inputs":[{"type":"address","name":"owner","internalType":"address","indexed":true},{"type":"address","name":"spender","internalType":"address","indexed":true},{"type":"uint256","name":"value","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"OwnershipTransferred","inputs":[{"type":"address","name":"previousOwner","internalType":"address","indexed":true},{"type":"address","name":"newOwner","internalType":"address","indexed":true}],"anonymous":false},{"type":"event","name":"Transfer","inputs":[{"type":"address","name":"from","internalType":"address","indexed":true},{"type":"address","name":"to","internalType":"address","indexed":true},{"type":"uint256","name":"value","internalType":"uint256","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"allowance","inputs":[{"type":"address","name":"owner","internalType":"address"},{"type":"address","name":"spender","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"approve","inputs":[{"type":"address","name":"spender","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"balanceOf","inputs":[{"type":"address","name":"account","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"burn","inputs":[{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"burnFrom","inputs":[{"type":"address","name":"account","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"cap","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint8","name":"","internalType":"uint8"}],"name":"decimals","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"decreaseAllowance","inputs":[{"type":"address","name":"spender","internalType":"address"},{"type":"uint256","name":"subtractedValue","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"increaseAllowance","inputs":[{"type":"address","name":"spender","internalType":"address"},{"type":"uint256","name":"addedValue","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"initialize","inputs":[{"type":"string","name":"_name","internalType":"string"},{"type":"string","name":"_symbol","internalType":"string"},{"type":"uint256","name":"_cap","internalType":"uint256"},{"type":"address","name":"_owner","internalType":"address"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"mint","inputs":[{"type":"address","name":"_to","internalType":"address"},{"type":"uint256","name":"_amount","internalType":"uint256"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"name","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"address","name":"","internalType":"address"}],"name":"owner","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"renounceOwnership","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"string","name":"","internalType":"string"}],"name":"symbol","inputs":[]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"totalSupply","inputs":[]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transfer","inputs":[{"type":"address","name":"recipient","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[{"type":"bool","name":"","internalType":"bool"}],"name":"transferFrom","inputs":[{"type":"address","name":"sender","internalType":"address"},{"type":"address","name":"recipient","internalType":"address"},{"type":"uint256","name":"amount","internalType":"uint256"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"transferOwnership","inputs":[{"type":"address","name":"newOwner","internalType":"address"}]}]
}
/* eslint-enable */

/**
 * Given a contract address returns the URL to fetch the ABI data accroding the current network
 * @param {string} contractAddress
 * @returns {string} URL
 */
const getUrl = (contractAddress: string): string => {
  const network = targetedNetwork();
  if (network === "xdai"){
    return `https://blockscout.com/poa/xdai/api?module=contract&action=getabi&address=${contractAddress}`;
  }
  else {
    const prefix = (network === "main" || network === "ganache") ? "" : `-${network}`; // we consider 'ganache' as 'main'
    return `https://api${prefix}.etherscan.io/api?module=contract&action=getabi&address=${contractAddress}&apikey=${process.env.ETHERSCAN_API_KEY}`;
  }
};

const getSignatureHash = (signature: string): string => {
  return Web3.utils.keccak256(signature).toString();
};

const getMethodSignature = ({ inputs, name }: AbiItem): string => {
  const params = inputs?.map((x) => x.type).join(",");
  return `${name}(${params})`;
};

const getMethodAction = ({ stateMutability }: AbiItem): "read" | "write" => {
  if (!stateMutability) {
    return "write";
  }

  return ["view", "pure"].includes(stateMutability) ? "read" : "write";
};

const getMethodSignatureAndSignatureHash = (method: AbiItem,): { methodSignature: string; signatureHash: string } => {
  const methodSignature = getMethodSignature(method);
  const signatureHash = getSignatureHash(methodSignature);
  return { methodSignature, signatureHash };
};

const isAllowedABIMethod = ({ name, type }: AbiItem): boolean => {
  return type === "function" && !!name;
};

/**
 * Given valid ABI returns write functions with all thier data.
 * @param {AbiItem[]} abi
 */
export const extractABIMethods = (abi: AbiItem[]): IAbiItemExtended[] => {
  const allowedAbiItems = abi.filter(isAllowedABIMethod) as IAllowedAbiItem[];

  return allowedAbiItems.map((method): IAbiItemExtended => ({
    action: getMethodAction(method),
    ...getMethodSignatureAndSignatureHash(method),
    ...method,
  }))
    .filter((method) => method.action === "write")
    .sort(({ name: a }, { name: b }) => SortService.evaluateString(a, b, 1));
};

/**
 * Given array of ABI parameters objects, returns true if all values are valid.
 * Data example:
 * [{ type: address, value: "0x25112235dDA2F775c81f0AA37a2BaeA21B470f65" }]
 * @param {array} data
 * @returns {boolean}
 */
export const validateABIInputs = (data: Array<any>): boolean => {
  for (const input of data) {
    switch (input.type) {
      case "address":
        if (!isAddress(input.value)) {
          return false;
        }
        break;
      case "bytes":
        if (!isHexString(input.value)) {
          return false;
        }
        break;
      case "uint256":
        if (/^\d+$/.test(input.value) === false) {
          return false;
        }
        break;
    }
  }
  return true;
};

/**
 * Given contract address returns it's ABI data.
 * @param {string} contractAddress
 */
export const getABIByContract = async (contractAddress: string): Promise<Array<any>> => {
  //ugly temporay patch
  if (CUSTOM_ABIS[contractAddress] !== undefined) {
    return CUSTOM_ABIS[contractAddress];
  }
  //
  const url = getUrl(contractAddress);
  try {
    const response = await axios({ url: url, method: "GET" }).then(res => { return res.data; });
    if (response.status === "0") {
      return [];
    }
    return JSON.parse(response.result);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to retrieve ABI", e);
    return [];
  }
};

/**
 * Given ABI, function name and it's parameters values returns the encoded data as string.
 * @param {array} abi ABI methods array
 * @param {string} name Method name
 * @param {array} data array of ABI parameters objects. Example: [{ type: address, value: "0x25112235dDA2F775c81f0AA37a2BaeA21B470f65" }]
 * @returns {string} The encoded data
 */
export const encodeABI = (abi: Array<any>, name: string, data: any[]): string => {
  const interfaceABI = new Interface(abi);

  if (validateABIInputs(data)) {
    const values = [];
    for (const input of data) {
      values.push(input.value);
    }
    return interfaceABI.functions[name].encode(values);
  }

  return "";
};
