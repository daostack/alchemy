import * as React from "react";
import * as css from "./PeriodRow.scss";
import { getLockingBatch, ICL4RLock, ICL4RParams } from "./CL4RHelper";
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
  allLockingIdsForRedeem: Set<number>;
  setAllLockingIdsForRedeem: any;
}

const PeriodRow = (props: IProps) => {
  const { lockData, schemeParams, period, currentLockingBatch, isLockingEnded, redeemableAmount, setRedeemableAmount, allLockingIdsForRedeem, setAllLockingIdsForRedeem } = props;
  const [repuationRewardForLockings, setRepuationRewardForLockings] = React.useState("0.00");
  const [repuationRewardForBatch, setRepuationRewardForBatch] = React.useState("0.00");
  const lockingIds: Array<number> = [];

  React.useEffect(() => {
    setRedeemableAmount(redeemableAmount + Number(repuationRewardForLockings));
  }, [repuationRewardForLockings]);

  let youLocked = new BN(0);
  for (const lock of lockData) {
    const lockingBatch = getLockingBatch(Number(lock.lockingTime), Number(schemeParams.startTime), schemeParams.batchTime);
    if (lockingBatch <= period && (Number(lockingBatch) + Number(lock.period)) >= Number(period)) {
      if (lockingBatch === period) {
        youLocked = youLocked.add(new BN(lock.amount));
      }
      lockingIds.push(Number(lock.lockingId));

      if (lock.redeemed.length === 0) {
        allLockingIdsForRedeem.add(Number(lock.lockingId));
        setAllLockingIdsForRedeem(allLockingIdsForRedeem.add(Number(lock.lockingId)));
      }
    }
  }

  const isPeriodRedeemed = youLocked.gt(new BN(0)) && Number(repuationRewardForLockings) === 0;

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
