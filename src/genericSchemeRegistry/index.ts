import BN = require("bn.js");
import { Address } from "@daostack/client";
import { getWeb3, getNetworkNameSync } from "arc";

interface INetworkAddressJson {
  [network: string]: Address;
}

interface IDaoGenericSchemeJson {
  /**
   * name to display for the GenericScheme
   */
  name: string;
  /**
   * target address by each network
   */
  targetContractAddresses: INetworkAddressJson;
  /**
   * form ids, one for each form to generate for the GenericScheme
   */
  forms: string[];
}

interface IDaoGenericSchemesJson {
  /**
   * name of the DAO
   */
  name: string;
  /**
   * addresses per-network of the DAO
   */
  avatarAddresses: INetworkAddressJson;
  /**
   * set of GenericSchemes registered in the DAO
   */
  genericSchemes: IDaoGenericSchemeJson[];
}

interface IDaoGenericSchemeInfo {
  schemeName: string;
  forms: IActionFormSpec[];
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

export interface IActionFormSpec {
  description: string;
  id: string;
  label: string;
  abi: IABISpec;
  notes: string;
  fields: any[];
}

const daoForms = require("./schemes/DaoGenericSchemesForms.json").daos as IDaoGenericSchemesJson[];
const formSchemas = require("./schemes/GenericSchemeFormSchemas.json").forms as IActionFormSpec[];

const SCHEMEINFOS: {
  [network: string]: {
    [daoAddress: string]: {
      [targetContractAddress: string]: IDaoGenericSchemeInfo;
    };
  };
} = {
  main: {},
  rinkeby: {},
  private: {},
};

const ACTIONFORMSPECS = new Map<string, IActionFormSpec>();

/**
 * create Map of all form schemes
 */
for (const formSpec of formSchemas) {
  if (ACTIONFORMSPECS.has(formSpec.id)) {
    console.log(`GenericScheme form is duplicated: ${formSpec.id}`);
  } else {
    ACTIONFORMSPECS.set(formSpec.id, formSpec);
  }
}

/**
 * create Map of all form schemes
 */
for (const dao of daoForms) {
  // for each GenericScheme in the DAO
  for (const daoNetwork of ["main", "rinkeby", "private"]) {
    const daoAddress = dao.avatarAddresses[daoNetwork];
    if (!daoAddress) continue;
    // for each GenericScheme in the DAO
    for (const gsScheme of dao.genericSchemes) {
      // for each formId in the GenericScheme
      const daoSchemeForms = [] as IActionFormSpec[];
      for (const formId of gsScheme.forms) { 
        // get the form specification
        const formSpec = ACTIONFORMSPECS.get(formId);
        if (formSpec) {
          daoSchemeForms.push(formSpec);
        } else {
          console.log(`GenericScheme form id not found: ${formId}`);
        }
        if (daoSchemeForms.length) {
        // for each network
          const targetContractAddress = gsScheme.targetContractAddresses[daoNetwork];
          if (!SCHEMEINFOS[daoNetwork][daoAddress]) {
            SCHEMEINFOS[daoNetwork][daoAddress] = {};
          }
          SCHEMEINFOS[daoNetwork][daoAddress][targetContractAddress] = {
            schemeName: gsScheme.name,
            forms: daoSchemeForms,
          };
        } else {
          console.log("No GenericScheme forms found");
        }
      }
    }
  }
}

export interface IActionFormFieldOptions {
  decimals?: number;
  defaultValue?: any;
  name: string;
  label?: string;
  labelTrue?: string;
  labelFalse?: string;
  type?: string;
  placeholder?: string;
}

export  class ActionFormField {
  public decimals?: number;
  public defaultValue?: any;
  public name: string;
  public label?: string;
  public labelTrue?: string;
  public labelFalse?: string;
  public type?: string;
  public placeholder?: string;

  constructor(options: IActionFormFieldOptions) {
    this.decimals = options.decimals;
    this.defaultValue = options.defaultValue;
    this.name = options.name;
    this.label = options.label;
    this.labelTrue = options.labelTrue;
    this.labelFalse = options.labelFalse;
    this.type = options.type;
    this.placeholder = options.placeholder;
  }
  /**
   * the value to pass to the contract call (as calculated from the user's input data)
   * @return [description]
   */
  public callValue(userValue: any): any {
    if (this.type === "bool") {
      return parseInt(userValue, 10) === 1;
    }

    if (this.decimals) {
      return (new BN(userValue).mul(new BN(10).pow(new BN(this.decimals)))).toString();
    }
    return userValue;
  }
}

export class ActionFormSpec implements IActionFormSpec {
  public description: string;
  public id: string;
  public label: string;
  public abi: IABISpec;
  public notes: string;
  public fields: any[];

  constructor(options: IActionFormSpec) {
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

  public getFields(): ActionFormField[] {
    const result: ActionFormField[] = [];
    for (let i = 0; i <  this.abi.inputs.length; i++) {
      result.push(new ActionFormField({
        name: this.abi.inputs[i].name,
        type: this.abi.inputs[i].type,
        ...this.fields[i],
      }));
    }
    return result;
  }
}

/**
 * represents information we have about a generic scheme and the actions it can call
 * @param info [description]
 */
export class GenericSchemeInfo {
  private specs: IDaoGenericSchemeInfo;

  constructor(info: IDaoGenericSchemeInfo) {
    this.specs = info;
  }

  /**
   * name to display for the GenericScheme
   */
  public get name(): string {
    return this.specs.schemeName;
  }

  public forms(): ActionFormSpec[] {
    return this.specs.forms.map((spec): ActionFormSpec => new ActionFormSpec(spec));
  }

  public form(formId: string): ActionFormSpec {
    const form = ACTIONFORMSPECS.get(formId);
    if (form) {
      return new ActionFormSpec(form);
    } else {
      throw Error(`An action form with id ${formId} could not be found`);
    }
  }

  public formByActionFunctionName(name: string): IActionFormSpec | undefined {
    for (const form of this.specs.forms) {
      if (form.abi.name === name) {
        return form;
      }
    }
    return;
  }

  public encodeABI(action: IActionFormSpec, values: any[]): string {
    return (getWeb3()).eth.abi.encodeFunctionCall(action.abi, values);
  }

  /*
   * Tries to find a function corresponding to the calldata among this.actions()
   * returns: an object containing the action, and the decoded values.
   * It returns 'undefined' if the action could not be found
   */
  public decodeCallData(callData: string): { action: IActionFormSpec; values: any[]} {
    const web3 = getWeb3();
    let action: undefined|IActionFormSpec;
    for (const act of this.forms()) {
      const encodedFunctionSignature = web3.eth.abi.encodeFunctionSignature(act.abi);
      if (callData.startsWith(encodedFunctionSignature)) {
        action = act;
        break;
      }
    }
    if (!action) {
      throw Error("No action matching these callData could be found");
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
      throw Error("Could not find a known action that corresponds with these callData");
    }
  }
}

export class GenericSchemeRegistry {

  public getGenericSchemeName(daoAddress: Address, contractToCall: Address, network?: "main"|"rinkeby"|"private"): string {
    const genericSchemeInfo = this.getSchemeInfo(daoAddress, contractToCall, network);
    return (genericSchemeInfo) ? genericSchemeInfo.name : "Generic Scheme";
  }
  /**
   * Check the address to see if this is a known contract, and if so
   * return an object with information on how to call it
   * @param  daoAddress avatar address
   * @param  targetContractAddress address of the GenesisScheme target contract
   * @return an object [specs to be written..]
   */
  public getSchemeInfo(
    daoAddress: Address,
    targetContractAddress: Address,
    network?: "main"|"rinkeby"|"private"): GenericSchemeInfo {

    let networkName: string = network;

    if (!networkName) {
      switch (process.env.NODE_ENV) {
        case "production":
        default:
          networkName = "main";
          break;
        case "staging":
          networkName = "rinkeby";
          break;
        case "development":
          networkName = getNetworkNameSync();
          break;
      }
    }
    let spec: IDaoGenericSchemeInfo;
    if (networkName) {
      spec = SCHEMEINFOS[networkName][daoAddress] && SCHEMEINFOS[networkName][daoAddress][targetContractAddress];
    }
    return spec ? new GenericSchemeInfo(spec) : undefined;
  }
}
