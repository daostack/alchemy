import { IDAOState, IMemberState, Member } from "@daostack/client";
import AccountImage from "components/Account/AccountImage";
import AccountProfileName from "components/Account/AccountProfileName";
import OAuthLogin from "components/Account/OAuthLogin";
import Reputation from "components/Account/Reputation";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { fromWei } from "lib/util";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./Dao.scss";

interface IProps extends ISubscriptionProps<IMemberState> {
  dao: IDAOState;
  member: Member;
  profile: IProfileState;
}

class DaoMember extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { dao, profile } = this.props;
    const memberState = this.props.data;

    return (
      <div className={css.member + " clearfix"}
        key={"member_" + memberState.address}
        data-test-id={"member_" + memberState.address}>
        <table className={css.memberTable}>
          <tbody>
            <tr>
              <td className={css.memberAvatar}>
                <AccountImage
                  accountAddress={memberState.address}
                  className="membersPage"
                />
              </td>
              <td className={css.memberName}>
                { profile ?
                  <div>
                    <AccountProfileName accountAddress={memberState.address} accountProfile={profile} daoAvatarAddress={dao.address} />
                    <br/>
                  </div>
                  : <div className={css.noProfile}>No Profile</div>
                }
              </td>
              <td className={css.memberAddress}>
                {memberState.address}
              </td>
              <td className={css.memberReputation}>
                <span className={css.reputationAmount}>{fromWei(memberState.reputation).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}</span>
                <div className={css.reputationAmounts}>
                  (<Reputation daoName={dao.name} totalReputation={dao.reputationTotalSupply} reputation={memberState.reputation}/>)
                </div>
              </td>
              <td className={css.memberSocial}>
                {profile && Object.keys(profile.socialURLs).length > 0 ?
                  <span>
                    <OAuthLogin editing={false} provider="facebook" accountAddress={memberState.address} profile={profile} className={css.socialButton}/>
                    <OAuthLogin editing={false} provider="twitter" accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                    <OAuthLogin editing={false} provider="github" accountAddress={memberState.address} profile={profile} className={css.socialButton} />
                  </span>
                  : ""
                }
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
  createObservable: (props: IProps) => {
    return props.member.state(); 
  },
});
