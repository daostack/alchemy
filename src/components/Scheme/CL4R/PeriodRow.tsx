import * as React from "react";
import * as css from "./PeriodRow.scss";
import { ICL4RLock, ICL4RParams } from "./CL4RHelper";
import { formatTokens, numberWithCommas, WEI } from "lib/util";
import { CL4RScheme } from "@daostack/arc.js";
import Decimal from "decimal.js";
import BN from "bn.js";
import classNames from "classnames";
import moment from "moment-timezone";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: Array<ICL4RLock>;
  period: number;
  cl4rScheme: CL4RScheme;
  currentLockingBatch: number;
  isLockingEnded: boolean;
  getLockingBatch: any;
  handleRedeem: (lockingId: number[], setIsRedeeming: any) => any;
}

const PeriodRow = (props: IProps) => {
  const { lockData, schemeParams, period, currentLockingBatch, isLockingEnded, getLockingBatch, handleRedeem } = props;
  const [repuationRewardForLockings, setRepuationRewardForLockings] = React.useState("-");
  const [repuationRewardForBatch, setRepuationRewardForBatch] = React.useState("-");
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const lockingIds: Array<number> = [];
  const lockingIdsForRedeem: Array<number> = [];

  let youLocked = new BN(0);
  for (const lock of lockData) {
    const lockingBatch = getLockingBatch(Number(lock.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime));
    if (lockingBatch <= period && (Number(lockingBatch) + Number(lock.period)) >= Number(period)) {
      if (lockingBatch === period) {
        youLocked = youLocked.add(new BN(lock.amount));
      }
      lockingIds.push(Number(lock.lockingId));
      if ((Number(lockingBatch) + Number(lock.period)) > Number(period)) {
        lockingIdsForRedeem.push(Number(lock.lockingId));
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
  const redeemable = moment().isSameOrAfter(moment.unix(Number(schemeParams.redeemEnableTime)));
  const reputationToReceive = youLocked.gt(new BN(0)) && Number(repuationRewardForLockings) === 0 ? <span className={css.inProgressLabel}>Redeemed</span> : `${numberWithCommas(repuationRewardForLockings)} REP`;

  const actionButtonClass = classNames({
    [css.actionButton]: true,
    [css.disabled]: isRedeeming,
  });

  return (
    <tr className={css.row}>
      <td>{period + 1}</td>
      <td>{`${numberWithCommas(formatTokens(new BN(youLocked)))} ${schemeParams.tokenSymbol}`}</td>
      <td>{`${numberWithCommas(repuationRewardForBatch)} REP`}</td>
      <td>{inProgress ? <span className={css.inProgressLabel}>In Progress</span> : reputationToReceive}</td>
      <td>{!inProgress && redeemable && Number(repuationRewardForLockings) > 0 && <button className={actionButtonClass} onClick={() => handleRedeem(lockingIdsForRedeem, setIsRedeeming)} disabled={isRedeeming}>Redeem</button>}</td>
    </tr>
  );
};

export default PeriodRow;
