import * as React from "react";
import * as css from "./Staking.scss";
import gql from "graphql-tag";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { getArcByDAOAddress, standardPolling } from "lib/util";
import { Address, IDAOState, ISchemeState } from "@daostack/arc.js";
import { RouteComponentProps } from "react-router-dom";
import LockRow from "./LockRow";
import * as classNames from "classnames";

//const PAGE_SIZE = 50;

// interface ICL4RParams {
//   id: Address;
//   batchTime: string;
//   startTime: string;
//   token: Address;
//   redeemEnableTime: string;
// }

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

const Staking = (props: IProps) => {
  const { data, daoState } = props;
  const [schemeParams, setSchemeParams] = React.useState([]);
  const [showYourLocks, setShowYourLocks] = React.useState(false);
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
          }
        }
      }
      `;
      const schemeInfoParams = await arc.sendQuery(schemeInfoQuery);
      setSchemeParams(schemeInfoParams.data);
    };
    getSchemeInfo();
  }, []);

  const lockings = ((data as any).data.cl4Rlocks)?.map((lock: any) => {
    return <LockRow key={lock.id} data={lock} />;
  });

  const periodsClass = classNames({
    [css.title]: true,
    [css.active]: !showYourLocks,
  });

  const locksClass = classNames({
    [css.title]: true,
    [css.active]: showYourLocks,
  });

  return (
    <div className={css.wrapper}>
      <div className={css.tableTitleWrapper}>
        <div className={periodsClass} onClick={() => setShowYourLocks(false)}>All Periods</div>
        <div className={locksClass} onClick={() => setShowYourLocks(true)}>Your Locks</div>
      </div>
      <div className={css.tableContainer}>
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
                  <th>Total Reputation</th>
                  <th>You Will Receive</th>
                </tr>
              </thead>
              <tbody>

              </tbody>
            </table>
        }
      </div>
    </div>
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
  //pageSize: PAGE_SIZE,
});
