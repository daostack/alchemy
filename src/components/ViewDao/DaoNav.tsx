import Tooltip from 'rc-tooltip';
import * as React from "react";
import { NavLink } from "react-router-dom";

import { IDAOState } from '@daostack/client'
import { arc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe"
import * as css from "./ViewDao.scss";

interface IProps {
  currentAccountAddress: string;
  address: string
  numRedemptions: number;
}

export default class DaoNav extends React.Component<IProps, null> {

  public render() {
    const { address, numRedemptions } = this.props;
    return (
      <Subscribe observable={arc.dao(address).state}>{(state: IObservableState<IDAOState>): any => {
          if (state.isLoading) {
            return null
          } else if (state.error) {
            throw state.error
          } else {
            const dao = state.data;
            return (
              <div className={css.nav}>
                <NavLink exact className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.address}>Proposals</NavLink>
                <NavLink className={css.navItem} activeClassName={css.selected} to={"/dao/" + dao.address + "/history/"}>History</NavLink>
                {numRedemptions > 0
                  ? <NavLink className={css.navRedemption} activeClassName={css.selected} to={"/dao/" + dao.address + "/redemptions/"}>
                      Redemptions <span className={css.redemptionNotification}>{numRedemptions}</span>
                    </NavLink>
                  : ""
                }
                <Tooltip placement="left" trigger={["hover"]} overlay="Create a New Proposal">
                  <NavLink className={css.createProposal} activeClassName={css.selected} to={`/dao/${dao.address}/proposals/create`} data-test-id="create-proposal">
                    <img src="/assets/images/Icon/Draft-white.svg"/>
                  </NavLink>
                </Tooltip>
                <div className={css.borderBottom}></div>
              </div>
            )}
          }
        }
      </Subscribe>
    )
  }
}
