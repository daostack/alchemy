import * as React from "react";
import { IDAOState, Scheme } from "@daostack/client";

import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import AccountImage from "components/Account/AccountImage";
import * as css from "./DaoHeader.scss";



interface IExternalProps {
  daoState: IDAOState;
}

type IProps = IExternalProps & ISubscriptionProps<Scheme[]>;

class DaoHeaderComponent extends React.Component<IProps, null> {

  render() {
    const dummyData = {
      daoImg: "/assets/images/generic-user-avatar.png",
      reputationHolders: 134,
      holdings: [
        { name: "GEN", amount: 0.24653 },
        { name: "ETH", amount: 16.01 },
        { name: "DAI", amount: 148.19 },
      ],
      description: `
      ${this.props.daoState.name} is an independent, global community of people working together to build and promote Decentralized Autonomous Organizations (DAOs). 
      It’s the perfect place to get involved with DAOstack and get your feet wet in a real-life DAO.
      `,
    };

    return (
      <div className={css.headerWrap}>
        <div className={css.daoImg}>
          <AccountImage
            accountAddress={this.props.daoState.address}
            width={106}
            style={styles.circularSquare}
          />
        </div>
        <div className={css.daoInfo}>
          <b className={css.daoName}>
            { this.props.daoState.name }
          </b>
          <b className={css.reputationHolders}>
            { dummyData.reputationHolders } Reputation Holders
          </b>
        </div>

        <div className={css.holdings}>
          Holdings
          {
            dummyData.holdings.map((holding, index) => {
              return (
                <div key={index} className={css.holdingsAmmount}>
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
          This is the { this.props.daoState.name } Header
          <div className={css.daoDescription}>
            { dummyData.description }
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

const styles = { 
  circularSquare: {
    borderRadius: "50%",
    borderColor: "white",
    borderStyle: "solid",  
  }
}

export default DaoHeader;