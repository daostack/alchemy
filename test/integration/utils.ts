import { Arc, IArcOptions } from "@daostack/arc.js";

const settings: IArcOptions & { txSenderServiceUrl: string } = {
  graphqlHttpProvider: "http://127.0.0.1:8000/subgraphs/name/daostack",
  graphqlWsProvider: "ws://127.0.0.1:8001/subgraphs/name/daostack",
  graphqlSubscribeToQueries: false,
  web3Provider: "http://127.0.0.1:8545",
  ipfsProvider: "http://127.0.0.1:5001/api/v0",
  txSenderServiceUrl: "https://tx-sender-service.herokuapp.com/send-tx",
};

const chai = require("chai");

global.expect = chai.expect;
chai.Should();

export const LATEST_ARC_VERSION = "0.1.1-rc.16";

export const userAddresses = [
  "0x90f8bf6a479f320ead074411a4b0e7944ea8c9c1",
];

export function getArc() {
  const arc = new Arc(settings);
  return arc;
}

export interface ITestAddresses {
  dao: {
    name: string
    Avatar: string
    DAOToken: string
    Reputation: string
    Controller: string
    Schemes: Array<{
      name: string
      alias: string
      address: string
    }>
  }
  queuedProposalId: string
  preBoostedProposalId: string
  boostedProposalId: string
  executedProposalId: string
  organs: {
    DemoAvatar: string
    DemoDAOToken: string
    DemoReputation: string
    ActionMock: string
  }
}

export function getTestAddresses(version: string = LATEST_ARC_VERSION): ITestAddresses {
  return require('@daostack/test-env-experimental/daos.json').demo[version]
}

/**
 * Note this won't work until you've browsed into the app.
 */
export async function hideCookieAcceptWindow(): Promise<void> {
  const acceptCookiesButton = await $("*[data-test-id=\"acceptCookiesButton\"]");
  if (!acceptCookiesButton.error && await acceptCookiesButton.isDisplayedInViewport()) {
    await acceptCookiesButton.click();
  }
}

export async function hideTrainingTooltips() {
  localStorage.setItem("trainingTooltipsEnabled", "false");
}

export const setCalendarDate = async (element: any, date: string): Promise<void> => {
  await element.click(); // hide previous calendar
  await element.setValue(date);
};
