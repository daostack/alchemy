import * as React from "react";
import { IDAOState, Scheme } from "@daostack/client";

import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import AccountImage from "components/Account/AccountImage";
import * as css from "./DaoHeader.scss";

const styles = { 
  circularSquare: {
    borderRadius: "50%",
    borderColor: "white",
    borderStyle: "solid",  
  },
};

interface ISignal {
  id: string;
  data: any | string;
}

interface IExternalProps {
  daoState: IDAOState;
  signal?: ISignal | any;
}

type IProps = IExternalProps & ISubscriptionProps<[Scheme[], ISignal | any]>;

class DaoHeaderComponent extends React.Component<IProps, any> {
  render() {
    const { daoState, signal } = this.props;
    const { name, memberCount, address } = daoState;
    const data = {
      daoImg: "/assets/images/generic-user-avatar.png",
      reputationHolders: memberCount,
      holdings: [
        { name: "GEN", amount: 0.24653 },
        { name: "ETH", amount: 16.01 },
        { name: "DAI", amount: 148.19 },
      ],
      description: `
      ${name} is an independent, global community of people working together to build and promote Decentralized Autonomous Organizations (DAOs). 
      It’s the perfect place to get involved with DAOstack and get your feet wet in a real-life DAO.
      `,
    };

    return (
      <div className={css.headerWrap}>
        <div className={css.daoImg}>
          {/* Logo will go here instead of AccountImage this is just a placeholder */}
          <AccountImage
            accountAddress={address}
            width={106}
            style={styles.circularSquare}
          />
        </div>
        <div className={css.daoInfo}>
          <b className={css.daoName}>
            { signal.name ? signal.name : name }
          </b>
          <b className={css.reputationHolders}>
            { data.reputationHolders } Reputation Holders
          </b>
        </div>

        <div className={css.holdings}>
          Holdings
          {
            data.holdings.map((holding, index) => {
              return (
                <div key={index} className={css.holdingsAmount}>
                  { holding.amount }
                  <div className={css.holdingsName}>
                    { holding.name }
                  </div>
                </div>
              );
            })
          }
        </div>

        <h2 className={css.daoHeader}>
          This is the { name } Header
          <div className={css.daoDescription}>
            { data.description }
          </div>
        </h2>
      </div>
    );
  }
}

const DaoHeader = withSubscription({
  wrappedComponent: DaoHeaderComponent,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const dao = props.daoState.dao;
    return dao.schemes({}, { fetchAllData: true, subscribe: true });
  },
});

export default DaoHeader;
