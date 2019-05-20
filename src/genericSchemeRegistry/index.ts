const Web3 = require("web3");
const dxDAOInfo = require("./dxDao.json");

interface IABISpec {
  constant: boolean;
  name: string;
  inputs: Array<{ name: string, type: string, label: string}>;
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
}
export interface IGenericSchemeJSON {
  name: string;
  addresses: any[];
  actions: IActionSpec[];
}

export class GenericSchemeInfo {
  public specs: IGenericSchemeJSON;

  constructor(info: IGenericSchemeJSON) {
    this.specs = info;
  }
  public actions() {
    return this.specs.actions;
  }
  public action(id: string) {
    for (let action of this.specs.actions) {
      if (action.id === id) {
        return action;
      }
    }
    return;
  }
  public actionByFunctionName(name: string) {
    for (let action of this.specs.actions) {
        if (action.abi.name === name) {
          return action;
        }
      }
    return;
  }
  public encodeABI(action: IActionSpec, ...values: any[]) {
    return Web3.eth.abi.encodeFunctionCall(action.abi, values);
  }

  /*
   * Tries to find a function corresponding to the calldata among this.actions()
   * returns: the action, and the decoded values
   */
  public decodeCallData(callData: string): { action: IActionSpec, values: {[key: string]: any}} {
    // TODO: still to be written, sorry :-)
    const functionName = "startMasterCopyCountdown";
    const values = { _masterCopy: "0xSomething"};
    const action = this.actionByFunctionName(functionName);
    return {action,  values};
  }
}

export class GenericSchemeRegistry {
  /**
   * Check the address to see if this is a known contract, and if so
   * return an object with information on how to call it
   * @param  address an ethereum address
   * @return an object [specs to be written..]
   */
  public genericSchemeInfo(name: string) {
    if (name === "dxDAO") {
      return new GenericSchemeInfo(dxDAOInfo);
    }
  }

}
