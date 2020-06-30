// tslint:disable:max-classes-per-file
import BN = require("bn.js");
import { Networks, targetedNetwork, toWei } from "lib/util";
import { keccak256, hexlify, Interface } from "ethers/utils";

const namehash = require("eth-ens-namehash");
const dutchXInfo = require("./plugins/DutchX.json");
const bountiesInfo = require("./plugins/StandardBounties.json");
const gpInfo = require("./plugins/GenesisProtocol.json");
const ensRegistrarInfo = require("./plugins/EnsRegistrar.json");
const ensRegistryInfo = require("./plugins/ENSRegistry.json");
const ensPublicResolverInfo = require("./plugins/ENSPublicResolver.json");
const registryLookupInfo = require("./plugins/RegistryLookup.json");
const co2kenInfo = require("./plugins/CO2ken.json");
const dXTokenRegistry = require("./plugins/dXTokenRegistry.json");
const nftManager = require("./plugins/NFTManager.json");

export const KNOWNPLUGINS = [
  dutchXInfo,
  co2kenInfo,
  bountiesInfo,
  ensRegistrarInfo,
  ensRegistryInfo,
  ensPublicResolverInfo,
  gpInfo,
  registryLookupInfo,
  dXTokenRegistry,
  nftManager,
];

const PLUGINADDRESSES: {[network: string]: { [address: string]: any}} = {
  main: {},
  rinkeby: {},
  kovan: {},
  xdai: {},
  ganache: {},
};

for (const pluginInfo of KNOWNPLUGINS) {
  for (const network of Object.keys(PLUGINADDRESSES)) {
    const networkId = (network === "ganache" && "private" || network);
    const addresses = pluginInfo.addresses[networkId];
    if (addresses) {
      for (const address of addresses) {
        PLUGINADDRESSES[network][address.toLowerCase()] = pluginInfo;
      }
    }
  }
}
interface IABISpec {
  constant: boolean;
  name: string;
  inputs: { name: string; type: string}[];
  outputs: any[];
  payable: boolean;
  stateMutability: string;
  type: string;
}

interface IActionFieldOptions {
  decimals?: number;
  defaultValue?: any;
  name: string;
  label?: string;
  labelTrue?: string;
  labelFalse?: string;
  type?: string;
  optional?: boolean;
  placeholder?: string;
  transformation?: string;
}

export class ActionField {
  public decimals?: number;
  public defaultValue?: any;
  public name: string;
  public label?: string;
  public labelTrue?: string;
  public labelFalse?: string;
  public type?: string;
  public optional?: boolean;
  public placeholder?: string;
  public transformation?: string;

  constructor(options: IActionFieldOptions) {
    this.decimals = options.decimals;
    this.defaultValue = options.defaultValue;
    this.name = options.name;
    this.label = options.label;
    this.labelTrue = options.labelTrue;
    this.labelFalse = options.labelFalse;
    this.type = options.type;
    this.optional = options.optional;
    this.placeholder = options.placeholder;
    this.transformation = options.transformation;
  }
  /**
   * the value to pass to the contract call (as calculated from the user's input data)
   * @return [description]
   */
  public callValue(userValue: string|string[]) {
    if (Array.isArray(userValue)) {
      userValue = userValue.map((val: string) => Object.prototype.hasOwnProperty.call(val, "trim") ? val.trim() : val);
    } else if (Object.prototype.hasOwnProperty.call(userValue, "trim")) {
      userValue = userValue.trim();
    }

    if (this.type === "bool") {
      return parseInt(userValue as string, 10) === 1;
    }

    if (this.decimals) {
      return (new BN(userValue as string).mul(new BN(10).pow(new BN(this.decimals)))).toString();
    }

    switch (this.transformation) {
      case "namehash": {
        return namehash.hash(userValue);
      }
      case "keccak256": {
        return keccak256(hexlify(userValue.toString()));
      }
      case "toWei": {
        return toWei(Number(userValue)).toString();
      }
    }

    return userValue;
  }
}

interface IActionSpec {
  description: string;
  id: string;
  label: string;
  abi: IABISpec;
  notes: string;
  fields: any[];
}

interface IGenericPluginJSON {
  name: string;
  addresses: any[];
  actions: IActionSpec[];
}

export class Action implements IActionSpec {
  public description: string;
  public id: string;
  public label: string;
  public abi: IABISpec;
  public notes: string;
  public fields: any[];

  constructor(options: IActionSpec) {
    if (this.fields && this.abi.inputs.length !== this.fields.length) {
      throw Error("Error parsing action: the number if abi.inputs should equal the number of fields");
    }
    this.description = options.description;
    this.id = options.id;
    this.label = options.label;
    this.abi = options.abi;
    this.notes = options.notes;
    this.fields = options.fields;
  }

  public getFields(): ActionField[] {
    const result: ActionField[] = [];
    for (let i = 0; i < this.abi.inputs.length; i++) {
      result.push(new ActionField({
        name: this.abi.inputs[i].name,
        type: this.abi.inputs[i].type,
        ...this.fields[i],
      }));
    }
    return result;
  }
}

/**
 * represents information we have about a generic plugin and the actions it can call
 * @param info [description]
 */
export class GenericPluginInfo {
  public specs: IGenericPluginJSON;

  constructor(info: IGenericPluginJSON) {
    this.specs = info;
  }
  public actions() {
    return this.specs.actions.map((spec) => new Action(spec));
  }
  public action(id: string) {
    for (const action of this.specs.actions) {
      if (action.id === id) {
        return new Action(action);
      }
    }
    throw Error(`An action with id ${id} coult not be found`);
  }
  public actionByFunctionName(name: string): IActionSpec | undefined {
    for (const action of this.specs.actions) {
      if (action.abi.name === name) {
        return action;
      }
    }
    return;
  }
  public encodeABI(action: IActionSpec, values: any[]) {
    const abi = new Interface([action.abi]);
    return abi.functions[action.abi.name].encode(values);
  }

  /*
   * Tries to find a function corresponding to the calldata among this.actions()
   * returns: an object containing the action, and the decoded values.
   * It returns 'undefined' if the action could not be found
   */
  public decodeCallData(callData: string): { action: IActionSpec; values: any[]} {
    let action: undefined|IActionSpec;
    let actionAbi: Interface;
    for (const act of this.actions()) {
      const abi = new Interface([act.abi]);
      const encodedFunctionSignature = abi.functions[act.abi.name].sighash;
      if (callData.startsWith(encodedFunctionSignature)) {
        action = act;
        actionAbi = abi;
        break;
      }
    }
    if (!action) {
      throw Error("No action matching these callData could be found");
    }
    // we've found our function, now we can decode the parameters
    const decodedParams = actionAbi.functions[action.abi.name].decode(
      "0x" + callData.slice(2 + 8)
    );

    const values = [];
    for (const inputSpec of action.abi.inputs) {
      values.push(decodedParams[inputSpec.name]);
    }

    if (action) {
      return { action, values};
    } else {
      throw Error("Could not find a known action that corresponds with these callData");
    }
  }
}


export class GenericPluginRegistry {
  /**
   * Check the address to see if this is a known contract, and if so
   * return an object with information on how to call it
   * @param  address an ethereum address
   * @return an object [specs to be written..]
   */
  public getPluginInfo(address: string, network?: Networks): GenericPluginInfo {
    if (!network) {
      network = targetedNetwork();
    }
    const spec = PLUGINADDRESSES[network][address.toLowerCase()];
    if (spec) {
      return new GenericPluginInfo(spec);
    }
  }
}
