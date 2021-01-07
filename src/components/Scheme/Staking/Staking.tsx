import * as React from "react";
import * as css from "./Staking.scss";
import gql from "graphql-tag";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArcByDAOAddress, standardPolling } from "lib/util";
import { Address, IDAOState, ISchemeState } from "@daostack/arc.js";
import { RouteComponentProps } from "react-router-dom";
import LockRow from "./LockRow";
import PeriodRow from "./PeriodRow";
import * as classNames from "classnames";
import * as moment from "moment";
import Countdown from "components/Shared/Countdown";

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

type SubscriptionData = Array<any>;
type IProps = IExternalProps & ISubscriptionProps<SubscriptionData>;
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

  console.log(schemeParams);
  console.log((data as any).data.cl4Rlocks);

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
          }
        }
      }
      `;
      const schemeInfoParams = await arc.sendQuery(schemeInfoQuery);
      setSchemeParams(schemeInfoParams.data.controllerSchemes[0].continuousLocking4ReputationParams);
      setLoading(false);
    };
    getSchemeInfo();
  }, []);

  const durations = [];
  for (let duration = 1; duration <= Number(schemeParams.maxLockingBatches); duration++){
    durations.push(<option key={duration} value={duration} selected={duration === 1}>{duration}</option>);
  }

  const lockings = ((data as any).data.cl4Rlocks)?.map((lock: any) => {
    return <LockRow key={lock.id} schemeParams={schemeParams} lockData={lock} />;
  });

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
    [css.disabled]: !lockAmount || !lockDuration,
  });

  const startTime = Number(schemeParams.startTime);
  const currentTime = moment().unix();
  const timeElapsed = currentTime - startTime;
  const currentLockingBatch = Math.trunc(timeElapsed / Number(schemeParams.batchTime));
  const nextBatchStartTime = moment.unix(startTime + ((currentLockingBatch + 1) * Number(schemeParams.batchTime)));

  const periods = [];
  for (let period = 1; period <= currentLockingBatch; period++) {
    periods.push(<PeriodRow key={period} period={period} schemeParams={schemeParams} lockData={(data as any).data.cl4Rlocks} />);
  }

  periods.reverse();

  return (
    !loading ? <div className={css.wrapper}>
      <div className={css.leftWrapper}>
        <div className={css.currentPeriod}>Current Period: {currentLockingBatch} of ???</div>
        <div className={css.nextPeriod}>Next in <Countdown toDate={nextBatchStartTime}/></div>
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
                  <th>Amount ({schemeParams.tokenSymbol})</th>
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
                  <th>You Locked ({schemeParams.tokenSymbol})</th>
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
      <div className={css.lockWrapper}>
        <span>Lock Duration (Days)</span>
        <select onChange={(e: any) => setLockDuration(e.target.value)}>
          {durations}
        </select>
        <span>Lock Amount ({schemeParams.tokenSymbol})</span>
        <input type="number" onChange={(e: any) => setLockAmount(e.target.value)} />
        {<span>Releasable: {moment().add(lockDuration, "days").format("DD.MM.YYYY HH:mm")}</span>}
        <button className={lockButtonClass} disabled={!lockAmount || !lockDuration}>Lock</button>
      </div>
    </div> : <Loading />
  );
};

export default withSubscription({
  wrappedComponent: Staking,
  loadingComponent: <Loading />,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["daoState"],
  createObservable: async (props: IProps) => {
    const arc = getArcByDAOAddress(props.daoState.id); // "${props.currentAccountAddress}" 0xe5b49414b2e130c28a4E67ab6Fe34AcdC0d4beDF
    const locksQuery = gql`
    query Locks {
      cl4Rlocks(where: {scheme: "${props.scheme.id}", locker: "0xe5b49414b2e130c28a4E67ab6Fe34AcdC0d4beDF"}) {
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
