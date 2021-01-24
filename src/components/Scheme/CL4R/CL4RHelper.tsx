import { getArcByDAOAddress, numberWithCommas, realMathToBN, realMathToNumber, WEI } from "lib/util";
import gql from "graphql-tag";
import * as React from "react";
import moment from "moment-timezone";
import { Address } from "@daostack/arc.js";
import BN from "bn.js";
import Decimal from "decimal.js";

export interface ICL4RParams {
  id: Address;
  batchTime: number;
  startTime: string;
  token: Address;
  redeemEnableTime: string;
  tokenName: string;
  tokenSymbol: string;
  maxLockingBatches: number;
  repRewardConstA: string;
  repRewardConstB: string;
  batchesIndexCap: number;
  agreementHash: string;
}

export interface ICL4RLock {
  id: Address;
  lockingId: string;
  locker: string;
  amount: string;
  lockingTime: string;
  period: string;
  redeemed: Array<ICL4RRedeem>;
  released: boolean;
  releasedAt: string;
}

export interface ICL4RRedeem {
  id: Address;
  lock: ICL4RLock;
  amount: string;
  redeemedAt: string;
  batchIndex: string;
}

export const getCL4RParams = async (daoAddress: string, schemeId: string) => {
  const arc = getArcByDAOAddress(daoAddress);
  const schemeInfoQuery = gql`
  query SchemeInfo {
    controllerSchemes(where: {id: "${schemeId}"}) {
      continuousLocking4ReputationParams {
        id
        startTime
        redeemEnableTime
        batchTime
        token
        tokenName
        tokenSymbol
        maxLockingBatches
        repRewardConstA
        repRewardConstB
        batchesIndexCap
        agreementHash
      }
    }
  }
  `;
  const schemeInfoParams = await arc.sendQuery(schemeInfoQuery);
  const schemeInfoParamsObject = schemeInfoParams.data.controllerSchemes[0].continuousLocking4ReputationParams as ICL4RParams;
  schemeInfoParamsObject.batchTime = Number(schemeInfoParamsObject.batchTime);
  schemeInfoParamsObject.maxLockingBatches = Number(schemeInfoParamsObject.maxLockingBatches);
  schemeInfoParamsObject.batchesIndexCap = Number(schemeInfoParamsObject.batchesIndexCap);
  return schemeInfoParamsObject;
};

export const secondsToDays = (seconds: number): number => {
  return seconds / 86400;
};

export const renderCL4RParams = (CL4RParams: ICL4RParams) => {
  const activationTime = moment.unix(Number(CL4RParams.startTime)).utc();
  const redeemEnableTime = moment.unix(Number(CL4RParams.redeemEnableTime)).utc();
  const endTime = moment.unix(Number(CL4RParams.startTime) + (CL4RParams.batchTime * CL4RParams.batchesIndexCap));
  return (<React.Fragment>
    <div>ID</div><div>{CL4RParams.id}</div>
    <div>Token</div><div>{`${CL4RParams.token} (${CL4RParams.tokenName})`}</div>
    <div>Token Symbol</div><div>{CL4RParams.tokenSymbol}</div>
    <div>Start Time</div><div>{activationTime.format("h:mm A [UTC] on MMMM Do, YYYY")}</div>
    <div>End Time</div><div>{endTime.format("h:mm A [UTC] on MMMM Do, YYYY")}</div>
    <div>Redeem Enable Time</div><div>{`${redeemEnableTime.format("h:mm A [UTC] on MMMM Do, YYYY")} ${redeemEnableTime.isSameOrBefore(moment()) ? "(redeemable)" : "(not redeemable)"}`}</div>
    <div>Batch Time</div><div>{`${secondsToDays(CL4RParams.batchTime).toFixed(2)} days`}</div>
    <div>Max Locking Batches</div><div>{CL4RParams.maxLockingBatches}</div>
    <div>Batches Index Cap</div><div>{CL4RParams.batchesIndexCap}</div>
    <div>Reputation Reward Const A</div><div>{`${numberWithCommas(new Decimal(realMathToBN(new BN(CL4RParams.repRewardConstA)).toString()).div(new Decimal(WEI)).toFixed(2))} REP`}</div>
    <div>Reputation Reward Const B</div><div>{new Decimal(realMathToNumber(new BN(CL4RParams.repRewardConstB)).toString()).toFixed(2)}</div>
    <div>Agreement Hash</div><div>{CL4RParams.agreementHash}</div>
  </React.Fragment>);
};

export const getLockingBatch = (lockingTime: number, startTime: number, batchTime: number) => {
  const timeElapsed = lockingTime - startTime;
  return Math.trunc(timeElapsed / batchTime);
};

export const calculateTotalRedeemedAmount = (cl4Rlocks: Array<ICL4RLock>) => {
  return cl4Rlocks.map((value: ICL4RLock) => value.redeemed).flat().map((value: ICL4RRedeem) => new BN(value.amount)).reduce((a: BN, b: BN) => a.add(b), new BN(0));
};
