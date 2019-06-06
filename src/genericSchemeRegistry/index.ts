// tslint:disable:max-classes-per-file

/* eslint-disable no-console *//*
 * TODO: This logic will move to the client library, where it willb e properly tested
 */
const Web3 = require("web3");
const dxDAOInfo = require("./schemes/dxDao.json");

interface IABISpec {
  constant: boolean;
  name: string;
  inputs: Array<{ name: string, type: string}>;
  outputs: any[];
  payable: boolean;
  stateMutability: string;
  type: string;
}
export interface IActionSpec {
  id: string;
  label: string;
  abi: IABISpec;
  notes: string;
  fields: any[];
}
export interface IGenericSchemeJSON {
  name: string;
  addresses: any[];
  actions: IActionSpec[];
}

export class Action implements IActionSpec {
  public id: string;
  public label: string;
  public abi: IABISpec;
  public notes: string;
  public fields: any[];

  constructor(options: IActionSpec) {
    if (this.fields && this.abi.inputs.length !== this.fields.length) {
      throw Error(`Error parsing action: the number if abi.inputs should equal the number of fields`);
    }
    this.id = options.id;
    this.label = options.label;
    this.abi = options.abi;
    this.notes = options.notes;
    this.fields = options.fields;
  }

  public getFields() {
    const result: any[] = [];
    for (let i = 0; i <  this.abi.inputs.length; i++) {
      result.push({
        name: this.abi.inputs[i].name,
        type: this.abi.inputs[i].type,
        label: this.fields && this.fields[i].label
      });
    }
    return result;
  }
}
export class GenericSchemeInfo {
  public specs: IGenericSchemeJSON;

  constructor(info: IGenericSchemeJSON) {
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
  public actionByFunctionName(name: string) {
    for (const action of this.specs.actions) {
        if (action.abi.name === name) {
          return action;
        }
      }
    return;
  }
  public encodeABI(action: IActionSpec, values: any[]) {
    return (new Web3()).eth.abi.encodeFunctionCall(action.abi, values);
  }

  /*
   * Tries to find a function corresponding to the calldata among this.actions()
   * returns: an object containing the action, and the decoded values.
   * It returns 'undefined' if the action could not be found
   */
  public decodeCallData(callData: string): { action: IActionSpec, values: any[]} {
    const web3 = new Web3();
    let action: undefined|IActionSpec;
    for (const act of this.actions()) {
      const encodedFunctionSignature = web3.eth.abi.encodeFunctionSignature(act.abi);
      if (callData.startsWith(encodedFunctionSignature)) {
        action = act;
        break;
      }
    }
    if (!action) {
      throw Error(`No action matching these callData could be found`);
    }
    // we've found our function, now we can decode the parameters
    const decodedParams = web3.eth.abi
      .decodeParameters(action.abi.inputs, "0x" + callData.slice(2 + 8));
    const values =  [];
    for (const inputSpec of action.abi.inputs) {
      values.push(decodedParams[inputSpec.name]);
    }

    if (action) {
      return { action,  values};
    } else {
      throw Error(`Could not find a known action that corresponds with these callData`);
    }
  }
}

export class GenericSchemeRegistry {
  /**
   * Check the address to see if this is a known contract, and if so
   * return an object with information on how to call it
   * @param  address an ethereum address
   * @return an object [specs to be written..]
   */
  public genericSchemeInfo(name: string): GenericSchemeInfo {
    if (name === "dxDAO") {
      return new GenericSchemeInfo(dxDAOInfo);
    }
    throw Error(`We could not find any information about the genericScheme "${name}"`);
  }
}
