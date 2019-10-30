import BN = require("bn.js");
import { IDAOState, IMemberState, Member } from "@daostack/client";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { fromWei } from "lib/util";
import * as React from "react";
import * as css from "./Dao.scss";

import ProfileHover from 'profile-hover';

interface IProps extends ISubscriptionProps<IMemberState> {
  dao: IDAOState;
  member: Member;
  daoTotalReputation: BN;
}

class DaoMember extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { dao, daoTotalReputation } = this.props;
    const memberState = this.props.data;

    return (
      <div className={css.member + " clearfix"}
        key={"member_" + memberState.address}
        data-test-id={"member_" + memberState.address}>
        <table className={css.memberTable}>
          <tbody>
            <tr>
              <td className={css.memberName}>
                <div><ProfileHover address={memberState.address} showName={true} url={process.env.BASE_URL + "/profile/" + memberState.address + (dao ? "?daoAvatarAddress=" + dao.address : "")} /></div>
              </td>
              <td className={css.memberAddress}>
                {memberState.address}
              </td>
              <td className={css.memberReputation}>
                <span className={css.reputationAmount}>{fromWei(memberState.reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</span>
                <div className={css.reputationAmounts}>
                  (<Reputation daoName={dao.name} totalReputation={daoTotalReputation} reputation={memberState.reputation}/>)
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default withSubscription({
  wrappedComponent: DaoMember,
  loadingComponent: <div className={css.loading}>Loading...</div>,
  errorComponent: (props) => <div>{ props.error.message }</div>,
  checkForUpdate: (oldProps, newProps) => { return oldProps.member.id !== newProps.member.id; },
  createObservable: (props: IProps) => props.member.state(),
});
