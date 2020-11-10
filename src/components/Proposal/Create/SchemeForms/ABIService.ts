import { AbiItem } from "web3-utils";
import { SortService } from "lib/sortService";
const Web3 = require("web3");
import axios from "axios";
import { targetedNetwork } from "lib/util";
const InputDataDecoder = require("ethereum-input-data-decoder");

export interface IAllowedAbiItem extends AbiItem {
  name: string;
  type: "function";
}

export interface IAbiItemExtended extends IAllowedAbiItem {
  action: string;
  methodSignature: string;
}

export interface IDecodedData {
  method: string;
  inputs: Array<any>;
  names: Array<string>;
  types: Array<string>;
}

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
 * Given contract address returns it's ABI data.
 * @param {string} contractAddress
 */
export const getABIByContract = async (contractAddress: string): Promise<Array<any>> => {
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
 * Given ABI, function name and it's parameters values returns the encoded data as string, otherwise returns an error.
 * @param {array} abi ABI methods array
 * @param {string} name Method name
 * @param {array} values array of ABI parameters values.
 * @returns {string} The encoded data
 */
export const encodeABI = (abi: Array<any>, name: string, values: Array<any>): string => {
  const web3 = new Web3;
  const contract = new web3.eth.Contract(abi);
  const interfaceABI = contract.options.jsonInterface;

  const isArrayParameter = (parameter: string): boolean => /^\[.*\]$/.test(parameter);

  let parsedValues = [];
  if (values) {
    parsedValues = values.map(value => {
      if (isArrayParameter(value)) {
        try {
          return JSON.parse(value);
        } catch (e) { return; }
      } else if (value === "true" || value === "false") {
        try {
          return JSON.parse(value);
        } catch (e) { return; }
      }
      return value;
    });
  }

  try {
    const methodToSend = interfaceABI.filter((method: any) => method.name === name && method.inputs.length === values.length);
    return web3.eth.abi.encodeFunctionCall(methodToSend[0], parsedValues);
  } catch (error) {
    return error.reason;
  }
};

/**
 * Given an ABI data and callData returns the decoded data object
 * @param {Array<any>} abi
 * @param {string} callData
 * @returns {IDecodedData} The decoded data
 */
export const decodeABI = (abi: Array<any>, callData: string): IDecodedData => {
  const decoder = new InputDataDecoder(abi);
  return decoder.decodeData(callData);
};
