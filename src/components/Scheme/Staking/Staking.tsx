import * as React from "react";
import * as css from "./Staking.scss";
import gql from "graphql-tag";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArcByDAOAddress, standardPolling, getNetworkByDAOAddress, toWei } from "lib/util";
import { Address, CL4RScheme, IDAOState, ISchemeState } from "@daostack/arc.js";
import { RouteComponentProps } from "react-router-dom";
import LockRow from "./LockRow";
import PeriodRow from "./PeriodRow";
import * as classNames from "classnames";
import * as moment from "moment";
import Countdown from "components/Shared/Countdown";
import { first } from "rxjs/operators";
import { enableWalletProvider } from "arc";
import { lock, release, extendLocking } from "@store/arc/arcActions";
import { showNotification } from "@store/notifications/notifications.reducer";
import { connect } from "react-redux";

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

interface IDispatchProps {
  lock: typeof lock;
  release: typeof release;
  extendLocking: typeof extendLocking;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  lock,
  release,
  extendLocking,
  showNotification,
};

type SubscriptionData = Array<any>;
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData> & IDispatchProps;
type IExternalProps = {
  daoState: IDAOState;
  scheme: ISchemeState;
  onCreateProposal: () => void;
  currentAccountAddress: Address;
} & RouteComponentProps<any>;

/**
 * Given locking time, scheme start time and scheme batch time returns the period the lock was created.
 * @param {number} lockingTime
 * @param {numebr} startTime
 * @param {number} batchTime
 * @returns {number} the period the lock was created.
 */
export const getLockingBatch = (lockingTime: number, startTime: number, batchTime: number): number => {
  const timeElapsed = lockingTime - startTime;
  return Math.trunc(timeElapsed / batchTime);
};

const Staking = (props: IProps) => {
  const { data, daoState } = props;
  const [loading, setLoading] = React.useState(true);
  const [schemeParams, setSchemeParams] = React.useState({} as ICL4RParams);
  const [showYourLocks, setShowYourLocks] = React.useState(false);
  const [lockDuration, setLockDuration] = React.useState(1);
  const [lockAmount, setLockAmount] = React.useState();
  const [cl4rScheme, setCL4RScheme] = React.useState<CL4RScheme>();
  const [isLocking, setIsLocking] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(moment().unix());

  // console.log(schemeParams);
  // console.log((data as any).data.cl4Rlocks);

  const isLockingStarted = React.useCallback(() => {
    return (moment().unix() >= Number(schemeParams.startTime));
  }, [schemeParams]);

  const isLockingEnded = React.useMemo(() => {
    const endTime = Number(schemeParams.startTime) + (Number(schemeParams.batchTime) * Number(schemeParams.batchesIndexCap));
    return (moment().unix() >= endTime);
  }, [schemeParams]);

  React.useEffect(() => {
    const getSchemeInfo = async () => {
      const arc = getArcByDAOAddress(daoState.id);
      const schemeInfoQuery = gql`
      query SchemeInfo {
        controllerSchemes(where: {id: "${props.scheme.id}"}) {
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
          }
        }
      }
      `;
      const schemeInfoParams = await arc.sendQuery(schemeInfoQuery);
      setSchemeParams(schemeInfoParams.data.controllerSchemes[0].continuousLocking4ReputationParams);
      const schemes = await arc.schemes({ where: { id: props.scheme.id.toLowerCase() } }).pipe(first()).toPromise();
      setCL4RScheme(schemes[0].CTL4R as CL4RScheme);
      setLoading(false);
    };
    getSchemeInfo();
  }, []);

  const durations = [];
  for (let duration = 1; duration <= Number(schemeParams.maxLockingBatches); duration++) {
    durations.push(<option key={duration} value={duration} selected={duration === 1}>{duration}</option>);
  }

  const lockings = ((data as any).data.cl4Rlocks?.map((lock: any) => {
    return <LockRow
      key={lock.id}
      schemeParams={schemeParams}
      lockData={lock} />;
  }));

  const startTime = Number(schemeParams.startTime);
  const timeElapsed = currentTime - startTime;
  const currentLockingBatch = isLockingEnded ? Number(schemeParams.batchesIndexCap) - 1 : Math.trunc(timeElapsed / Number(schemeParams.batchTime));
  const nextBatchStartTime = moment.unix(startTime + ((currentLockingBatch + 1) * Number(schemeParams.batchTime)));

  const handleLock = React.useCallback(async () => {
    if (!await enableWalletProvider({ showNotification: props.showNotification }, getNetworkByDAOAddress(daoState.address))) {
      setIsLocking(false);
      return;
    }
    setIsLocking(true);
    props.lock(cl4rScheme, toWei(Number(lockAmount)), lockDuration, currentLockingBatch, await cl4rScheme.getAgreementHash()); // TO DO: wait until Ben indexes the agreementHash to the subgraph
    setIsLocking(false);
  }, [cl4rScheme, lockAmount, lockDuration, currentLockingBatch]);

  const periods = [];
  for (let period = 0; period <= currentLockingBatch; period++) {
    periods.push(<PeriodRow
      key={period}
      period={period}
      schemeParams={schemeParams}
      lockData={(data as any).data.cl4Rlocks}
      cl4rScheme={cl4rScheme}
      currentLockingBatch={currentLockingBatch}
      isLockingEnded={isLockingEnded} />);
  }
  periods.reverse();

  let prefix = "Next in";

  if (!isLockingStarted()) {
    prefix = "Starts in";
  }

  if (currentLockingBatch === Number(schemeParams.batchesIndexCap)) {
    prefix = "Ends in";
  }

  const periodsClass = classNames({
    [css.title]: true,
    [css.active]: !showYourLocks,
  });

  const locksClass = classNames({
    [css.title]: true,
    [css.active]: showYourLocks,
  });

  const lockButtonClass = classNames({
    [css.lockButton]: true,
    [css.disabled]: !lockAmount || !lockDuration || isLocking,
  });
  return (
    !loading ? <div className={css.wrapper}>
      <div className={css.leftWrapper}>
        <div className={css.currentPeriod}>Current Period: {currentLockingBatch + 1} of {schemeParams.batchesIndexCap}</div>
        <div className={css.nextPeriod}>{isLockingEnded ? "Locking Ended" : <div>{prefix} <Countdown toDate={nextBatchStartTime} onEnd={() => setCurrentTime(moment().unix())} /></div>}</div>
        <div className={css.tableTitleWrapper}>
          <div className={periodsClass} onClick={() => setShowYourLocks(false)}>All Periods</div>
          <div className={locksClass} onClick={() => setShowYourLocks(true)}>Your Locks</div>
        </div>
        {
          showYourLocks ? (data as any).data.cl4Rlocks.length > 0 ?
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Duration</th>
                  <th>Releasable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lockings}
              </tbody>
            </table>
            : <span>No locks yet.</span> :
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>You Locked</th>
                  <th>Total Reputation (REP)</th>
                  <th>You Will Receive (REP)</th>
                </tr>
              </thead>
              <tbody>
                {periods}
              </tbody>
            </table>
        }
      </div>
      {!isLockingEnded && <div className={css.lockWrapper}>
        <span>Lock Duration (Days)</span>
        <select onChange={(e: any) => setLockDuration(e.target.value)}>
          {durations}
        </select>
        <span>Lock Amount ({schemeParams.tokenSymbol})</span>
        <input type="number" onChange={(e: any) => setLockAmount(e.target.value)} />
        {<span>Releasable: {moment().add(lockDuration, "days").format("DD.MM.YYYY HH:mm")}</span>}
        <button onClick={handleLock} className={lockButtonClass} disabled={!lockAmount || !lockDuration}>Lock</button>
      </div>}
    </div> : <Loading />
  );
};

const SubscribedStaking = withSubscription({
  wrappedComponent: Staking,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: async (props: IProps) => {
    const arc = getArcByDAOAddress(props.daoState.id);
    const locksQuery = gql`
    query Locks {
      cl4Rlocks(where: {scheme: "${props.scheme.id.toLowerCase()}", locker: "${props.currentAccountAddress}"}) {
        id
        lockingId
        locker
        amount
        lockingTime
        period
        redeemed
        redeemedAt
        released
        releasedAt
        batchIndexRedeemed
      }
    }
    `;
    return arc.getObservable(locksQuery, standardPolling());
  },
});

export default connect(
  null,
  mapDispatchToProps,
)(SubscribedStaking);
