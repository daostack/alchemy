import * as React from "react";
import * as css from "./PeriodRow.scss";
import { getBatchIndexesRedeemed, getLockingBatch, ICL4RLock, ICL4RParams } from "./CL4RHelper";
import { formatTokens, numberWithCommas, WEI } from "lib/util";
import { CL4RScheme } from "@daostack/arc.js";
import Decimal from "decimal.js";
import BN from "bn.js";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: Array<ICL4RLock>;
  period: number;
  cl4rScheme: CL4RScheme;
  currentLockingBatch: number;
  isLockingEnded: boolean;
  redeemableAmount: number;
  setRedeemableAmount: any;
}

const PeriodRow = (props: IProps) => {
  const { lockData, schemeParams, period, currentLockingBatch, isLockingEnded, redeemableAmount, setRedeemableAmount } = props;
  const [repuationRewardForLockings, setRepuationRewardForLockings] = React.useState("0.00");
  const [repuationRewardForBatch, setRepuationRewardForBatch] = React.useState("0.00");
  const lockingIds: Array<number> = [];
  let isPeriodRedeemed = false;

  React.useEffect(() => {
    // The user can't redeem reputation from the current batch.
    if (period < currentLockingBatch) {
      setRedeemableAmount(redeemableAmount + Number(repuationRewardForLockings));
    }
  }, [repuationRewardForLockings]);

  let youLocked = new BN(0);
  for (const lock of lockData) {
    const lockingBatch = getLockingBatch(Number(lock.lockingTime), Number(schemeParams.startTime), schemeParams.batchTime);
    if (lockingBatch <= period && (lockingBatch + Number(lock.period)) >= period) {
      if (lockingBatch === period) {
        youLocked = youLocked.add(new BN(lock.amount));
      }
      lockingIds.push(Number(lock.lockingId));
    }
    if (lock.redeemed.length > 0) {
      if (getBatchIndexesRedeemed(lock.redeemed).includes(String(period))) {
        isPeriodRedeemed = true;
      }
    }
  }

  React.useEffect(() => {
    const getRepuationData = async () => {
      const repuationRewardForBatch = (await props.cl4rScheme.getRepuationRewardForBatch(schemeParams.repRewardConstA, schemeParams.repRewardConstB, period));
      setRepuationRewardForBatch(repuationRewardForBatch.div(new Decimal(WEI)).toFixed(2));
      const repuationRewardForLockings = await props.cl4rScheme.getReputationRewardForLockingIds(lockingIds, period, repuationRewardForBatch);
      setRepuationRewardForLockings(repuationRewardForLockings.div(new Decimal(WEI)).toFixed(2));
    };
    getRepuationData();
  }, [period, lockData]);

  const inProgress = currentLockingBatch === period && !isLockingEnded;

  const reputationToReceive = isPeriodRedeemed ? <div className={css.redeemedLabel}>Redeemed</div> : `${numberWithCommas(repuationRewardForLockings)} REP`;

  return (
    <tr className={css.row}>
      <td>{period + 1}</td>
      <td>{formatTokens(youLocked, schemeParams.tokenSymbol)}</td>
      <td>{`${numberWithCommas(repuationRewardForBatch)} REP`}</td>
      <td>{inProgress ? <span className={css.inProgressLabel}>In Progress</span> : reputationToReceive}</td>
    </tr>
  );
};

export default PeriodRow;
