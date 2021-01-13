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
  handleExtend: (extendPeriod: number, batchIndexToLockIn: number, lockingId: number, setIsExtending: any) => any;
  getLockingBatch: any;
  currentLockingBatch: number;
  isLockingEnded: boolean;
  endTime: number;
}

const LockRow = (props: IProps) => {
  const { lockData, schemeParams, handleRelease, handleExtend, getLockingBatch, endTime, currentLockingBatch, isLockingEnded } = props;
  const [isReleasing, setIsReleasing] = React.useState(false);
  const [isExtending, setIsExtending] = React.useState(false);
  const [lockDuration, setLockDuration] = React.useState(1);

  // This is to avoid an option to extend more then the max locking batch.
  const extendDurations = [] as any;
  for (let duration = 1; duration <= Number(schemeParams.maxLockingBatches); duration++) {
    if ((moment().unix() + (duration * Number(schemeParams.batchTime)) <= endTime) && (duration + Number(lockData.period) <= Number(schemeParams.maxLockingBatches))) {
      extendDurations.push(<option key={duration} value={duration} selected={duration === 1}>{duration}</option>);
    }
  }

  const releasable = React.useMemo(() => {
    return moment.unix(Number(lockData.lockingTime)).add(Number(lockData.period) * Number(schemeParams.batchTime), "seconds");
  }, [lockData]);

  const release = React.useMemo(() => {
    return moment() >= releasable && !lockData.released;
  }, [lockData]);

  const lockingBatch = getLockingBatch(Number(lockData.lockingTime), Number(schemeParams.startTime), Number(schemeParams.batchTime));

  const actionButtonClass = classNames({
    [css.actionButton]: true,
    [css.disabled]: isReleasing || isExtending,
  });

  return (
    <tr className={css.row}>
      <td>{lockingBatch}</td>
      <td>{`${numberWithCommas(formatTokens(new BN(lockData.amount)))} ${schemeParams.tokenSymbol}`}</td>
      <td>{lockData.period} Periods</td>
      <td>{!lockData.released ? <span>{releasable.format("DD.MM.YYYY HH:mm")}</span> :
        <div className={css.releasedLabel}>
          <span>Released</span>
          <span>{moment.unix(Number(lockData.releasedAt)).format("DD.MM.YYYY HH:mm")}</span>
        </div>}
      </td>
      <td>
        <div className={css.actionsWrapper}>
          {!lockData.released && release && <button onClick={() => handleRelease(Number(lockData.lockingId), setIsReleasing)} className={actionButtonClass} disabled={isReleasing || isExtending}>Release</button>}
          {!isLockingEnded && moment() <= releasable && extendDurations.length > 0 && <div className={css.extendWrapper}>
            <button onClick={() => handleExtend(lockDuration, currentLockingBatch, Number(lockData.lockingId), setIsExtending)} className={actionButtonClass} disabled={isReleasing || isExtending}>Extend Lock</button>
            <select onChange={(e: any) => setLockDuration(e.target.value)} disabled={isReleasing || isExtending}>
              {extendDurations}
            </select>
          </div>}
        </div>
      </td>
    </tr>
  );
};

export default LockRow;
