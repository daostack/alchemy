import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";
import Subscribe from "components/Shared/Subscribe"
import { arc } from "arc"
import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";
import { IDAOState } from "@daostack/client";

import * as schemas from "schemas";

import * as css from "./DaoList.scss";

interface IStateProps {
  // dao: IDAOState,
  address: string
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  // dao: state.arc.daos[ownProps.daoAddress]
});

// interface IDispatchProps {
//   getDAO: typeof arcActions.getDAO
// }
//
// const mapDispatchToProps = {
//   getDAO: arcActions.getDAO
// };
//
type IProps = IStateProps // & IDispatchProps;

class DaoContainer extends React.Component<IProps, null> {

  // public daoSubscription: any;

  // public async componentWillMount() {
  //   this.daoSubscription = this.props.getDAO(this.props.daoAddress);
  // }
  //
  // public async componentWillUnmount() {
  //   const subscription = await this.daoSubscription
  //   if (subscription) {
  //     subscription.unsubscribe();
  //   }
  // }

  public render() {
    const { address } = this.props

    return  (
      <Subscribe observable={arc.dao(address).state}>{
          ({ complete, data, error }: any): any => {
            if (data) {
              const dao = data
              return <Link
                className={css.daoLink}
                to={"/dao/" + dao.address}
                key={"dao_" + dao.address}
                data-test-id="dao-link"
              >
                <div className={css.dao}>
                  <div className={css.daoAvatar}>
                    <img src="/assets/images/daostack-logo.png"/>
                  </div>
                  <h3 className={css.daoName}>{dao.name}</h3>
                  <Subscribe observable={dao.token.state}>{ (state: any) =>  (state.data &&
                    <div>
                      <div className={css.daoInfo}>Token: {state.data.name } ({state.data.symbol})</div>
                      <div className={css.daoInfo}>Num tokens: {Math.round(state.data.totalSupply).toLocaleString()}</div>
                    </div>
                  )}</Subscribe>
                  <Subscribe observable={dao.reputation.state}>{ (state: any) =>  (state.data &&
                    <div className={css.daoInfo}>Reputation: {Math.round(state.data.totalSupply).toLocaleString()}</div>
                  )}</Subscribe>
                </div>
              </Link>
            } else {
                return null
            }
          }
        }
      </Subscribe>
    )
  }
}

// export default connect(mapStateToProps, undefined)(DaoContainer);
export default DaoContainer
