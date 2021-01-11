import BN from "bn.js";
import classNames from "classnames";
import { formatTokens, numberWithCommas } from "lib/util";
import moment from "moment-timezone";
import * as React from "react";
import * as css from "./LockRow.scss";
import { ICL4RLock, ICL4RParams } from "./Staking";

interface IProps {
  schemeParams: ICL4RParams;
  lockData: ICL4RLock;
  handleRelease: (lockingId: number, setIsReleasing: any) => any;
  getLockingBatch: any;
}

const LockRow = (props: IProps) => {
  const { lockData, schemeParams, handleRelease, getLockingBatch } = props;
  const [isReleasing, setIsReleasing] = React.useState(false);
  const [isExtending, setIsExtending] = React.useState(false);

  const releasable = React.useMemo(() => {
    return moment.unix(Number(lockData.lockingTime)).add(Number(lockData.period) * Number(schemeParams.batchTime), "seconds");
  }, [lockData]);

  const release = React.useMemo(() => {
    return moment() >= releasable && !lockData.released;
  }, [lockData]);

  const actionButtonClass = classNames({
    [css.actionButton]: true,
    [css.disabled]: isReleasing || isExtending,
  });

  return (
    <tr className={css.row}>
      <td>{getLockingBatch(Number(lockData.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime)) + 1}</td>
      <td>{`${numberWithCommas(formatTokens(new BN(lockData.amount)))} ${schemeParams.tokenSymbol}`}</td>
      <td>{lockData.period} Periods</td>
      <td>{!lockData.released ? <span>{releasable.format("DD.MM.YYYY HH:mm")}</span> :
        <div className={css.releasedLabel}>
          <span>Released</span>
          <span>{moment.unix(Number(lockData.releasedAt)).format("DD.MM.YYYY HH:mm")}</span>
        </div>}
      </td>
      <td>
        {!lockData.released && release && <div className={css.actionsWrapper}>
          <button onClick={() => handleRelease(Number(lockData.lockingId), setIsReleasing)} className={actionButtonClass} disabled={isReleasing || isExtending}>Release</button>
          <button className={actionButtonClass} disabled={isReleasing || isExtending}>Extend Lock</button>
        </div>}
      </td>
    </tr>
  );
};

export default LockRow;
