import * as React from "react";
import * as css from "./PeriodRow.scss";
import { getLockingBatch, ICL4RLock, ICL4RParams } from "./Staking";
import BN from "bn.js";
import { realMathToNumber } from "lib/util";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: Array<ICL4RLock>;
  period: number;
}

const PeriodRow = (props: IProps) => {
  const { lockData, schemeParams, period } = props;

  let youLocked = 0;
  for (const lock of lockData) {
    const lockingBatch = getLockingBatch(Number(lock.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime));
    if (lockingBatch === period) {
      youLocked += Number(lock.amount);
    }
  }

  return (
    <tr className={css.row}>
      <td>{period}</td>
      <td>{youLocked}</td>
      <td>{(realMathToNumber(new BN(schemeParams.repRewardConstA)) * Math.pow(realMathToNumber(new BN(schemeParams.repRewardConstB)), period)).toFixed(3)}</td>
      <td></td>
    </tr>
  );
};

export default PeriodRow;
