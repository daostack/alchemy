import BN from "bn.js";
import { fromWei, numberWithCommas } from "lib/util";
import * as React from "react";
import * as css from "./LockRow.scss";
import { getLockingBatch, ICL4RLock, ICL4RParams } from "./Staking";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: ICL4RLock;
}

const LockRow = (props: IProps) => {
  const { lockData, schemeParams } = props;

  return (
    <tr className={css.row}>
      <td>{getLockingBatch(Number(lockData.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime)) + 1}</td>
      <td>{`${numberWithCommas(fromWei(new BN(lockData.amount)))} ${schemeParams.tokenSymbol}`}</td>
      <td>{((Number(lockData.period) * Number(schemeParams.batchTime)) / 86400).toFixed(2)} days ({lockData.period} Periods)</td>
      <td></td>
      <td></td>
    </tr>
  );
};

export default LockRow;
