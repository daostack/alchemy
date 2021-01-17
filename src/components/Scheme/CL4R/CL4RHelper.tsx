import { getArcByDAOAddress } from "lib/util";
import gql from "graphql-tag";
import * as React from "react";
import moment from "moment-timezone";
import { Address } from "@daostack/arc.js";

export interface ICL4RParams {
  id: Address;
  batchTime: string;
  startTime: string;
  token: Address;
  redeemEnableTime: string;
  tokenName: string;
  tokenSymbol: string;
  maxLockingBatches: string;
  repRewardConstA: string;
  repRewardConstB: string;
  batchesIndexCap: string;
  agreementHash: string;
}

export interface ICL4RLock {
  id: Address;
  lockingId: string;
  locker: string;
  amount: string;
  lockingTime: string;
  period: string;
  redeemed: boolean;
  redeemedAt: string;
  released: boolean;
  releasedAt: string;
  batchIndexRedeemed: string;
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
  return schemeInfoParams.data.controllerSchemes[0].continuousLocking4ReputationParams;
};

export const renderCL4RParams = (CL4RParams: ICL4RParams) => {
  const activationTime = moment.unix(Number(CL4RParams.startTime)).utc();
  const redeemEnableTime = moment.unix(Number(CL4RParams.redeemEnableTime)).utc();
  const endTime = moment.unix(Number(CL4RParams.startTime) + (Number(CL4RParams.batchTime) * Number(CL4RParams.batchesIndexCap)));
  return (<React.Fragment>
    <div>ID</div><div>{CL4RParams.id}</div>
    <div>Token Name</div><div>{CL4RParams.tokenName}</div>
    <div>Token Symbol</div><div>{CL4RParams.tokenSymbol}</div>
    <div>Token</div><div>{CL4RParams.token}</div>
    <div>Start Time</div><div>{activationTime.format("h:mm A [UTC] on MMMM Do, YYYY")} {moment().isSameOrAfter(activationTime) && endTime.isAfter(moment()) ? "(active)" : "(inactive)"}</div>
    <div>End Time</div><div>{endTime.format("h:mm A [UTC] on MMMM Do, YYYY")}</div>
    <div>Redeem Enable Time</div><div>{`${redeemEnableTime.format("h:mm A [UTC] on MMMM Do, YYYY")} ${redeemEnableTime.isSameOrBefore(moment()) ? "(redeemable)" : "(not redeemable)"}`}</div>
    <div>Batch Time</div><div>{CL4RParams.batchTime} seconds</div>
    <div>Max Locking Batches</div><div>{CL4RParams.maxLockingBatches}</div>
    <div>Batches Index Cap</div><div>{CL4RParams.batchesIndexCap}</div>
    <div>Reputation Reward Const A</div><div>{CL4RParams.repRewardConstA}</div>
    <div>Reputation Reward Const B</div><div>{CL4RParams.repRewardConstB}</div>
    <div>Agreement Hash</div><div>{CL4RParams.agreementHash}</div>
  </React.Fragment>);
};
