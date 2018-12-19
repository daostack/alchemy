import Tooltip from 'rc-tooltip';
import * as React from "react";
import { NavLink } from "react-router-dom";

import Subscribe from "components/Shared/Subscribe"
import { arc } from "arc";
import * as arcActions from "actions/arcActions";
import { IRootState } from "reducers";
import { IRedemptionState } from "reducers/arcReducer";
import { IDAOState } from '@daostack/client'

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
      <Subscribe observable={arc.dao(address).state}>{
          ({ complete, data, error }: any): any => {
            const dao: IDAOState = data;
            if (dao) {
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
              )} else {
                return null
              }
        }
      }</Subscribe>
    )
  }
}
