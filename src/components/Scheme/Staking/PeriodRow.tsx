import * as React from "react";
import * as css from "./PeriodRow.scss";
import { getLockingBatch, ICL4RLock, ICL4RParams } from "./Staking";
import { fromWei, numberWithCommas } from "lib/util";
import { CL4RScheme } from "@daostack/arc.js";
import Decimal from "decimal.js";
import BN from "bn.js";

const WEI = "1000000000000000000";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: Array<ICL4RLock>;
  period: number;
  cl4rScheme: CL4RScheme;
  currentLockingBatch: number;
  isLockingEnded: boolean;
}

const PeriodRow = (props: IProps) => {
  const { lockData, schemeParams, period, currentLockingBatch, isLockingEnded } = props;
  const [repuationRewardForLockings, setRepuationRewardForLockings] = React.useState("0.00");
  const [repuationRewardForBatch, setRepuationRewardForBatch] = React.useState("0.00");
  const lockingIds: Array<number> = [];
  let youLocked = new BN(0);
  for (const lock of lockData) {
    const lockingBatch = getLockingBatch(Number(lock.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime));
    if (lockingBatch === period) {
      youLocked = youLocked.add(new BN(lock.amount));
      lockingIds.push(Number(lock.lockingId));
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

  return (
    <tr className={css.row}>
      <td>{period + 1}</td>
      <td>{`${numberWithCommas(fromWei(new BN(youLocked)))} ${schemeParams.tokenSymbol}`}</td>
      <td>{numberWithCommas(repuationRewardForBatch)}</td>
      <td>{currentLockingBatch === period && !isLockingEnded ? "In Progress" : numberWithCommas(repuationRewardForLockings)}</td>
    </tr>
  );
};

export default PeriodRow;
