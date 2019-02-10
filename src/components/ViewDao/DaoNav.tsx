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
              </div>
            )}
          }
        }
      </Subscribe>
    )
  }
}
