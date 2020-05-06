import { IDAOState } from "@daostack/arc.js";
import ThreeBoxComments from "3box-comments-react";
import { threeboxLogin } from "actions/profilesActions";
import { enableWalletProvider, getArc } from "arc";
import * as React from "react";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import * as css from "./DaoLandingPage.scss";
import { Page } from "pages";
import Analytics from "lib/analytics";
import { Link } from "react-router-dom";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { DiscussionEmbed } from "disqus-react";
import ModalPopup from "components/Shared/ModalPopup";

type IExternalProps = {
  daoState: IDAOState;
};

interface IStateProps {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  threeBox: any;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
  threeboxLogin: typeof threeboxLogin;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    threeBox: state.profiles.threeBox,
  };
};

const mapDispatchToProps = {
  showNotification,
  threeboxLogin,
};

type IProps = IExternalProps & IDispatchProps & IStateProps;

interface IState {
  showingEditPagePopup: boolean;
}

class DaoLandingPage extends React.Component<IProps, IState> {

  private disqusConfig: any;

  constructor(props: IProps) {
    super(props);
    this.state = {
      showingEditPagePopup: false,
    };
  }

  public componentDidMount() {
    this.disqusConfig = {
      url: process.env.BASE_URL + "/dao/" + this.props.daoState.address + "/discussion",
      identifier: this.props.daoState.address,
      title: "Discuss " + this.props.daoState.name,
    };

    Analytics.track("Page View", {
      "Page Name": Page.DAOLanding,
      "DAO Address": this.props.daoState.id,
      "DAO Name": this.props.daoState.name,
    });
  }

  private handleThreeBoxLogin = async () => {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }
    await this.props.threeboxLogin(this.props.currentAccountAddress);
  }

  private showLandingPageContent = () => {
    this.setState({ showingEditPagePopup: true });
  }

  private hideLandingPageContent = () => {
    this.setState({ showingEditPagePopup: false });
  }

  public render() {
    const { currentAccountAddress, currentAccountProfile, daoState, threeBox } = this.props;
    const arc = getArc();

    return (
      <div className={css.landingPage}>

        <BreadcrumbsItem to={"/dao/" + daoState.address}>{daoState.name}</BreadcrumbsItem>

        <div className={css.infoContainer}>
          <div className={css.titleContainer}>
            <div className={css.row}>
              <div className={css.headerText}>{daoState.name}</div>
              <div className={css.editButton}>
                <button onClick={this.showLandingPageContent}>Edit Home Page</button>
              </div>
            </div>
          </div>

          <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

          <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
          make a proposal to the DAO or vote on existing proposals.</div>
        </div>

        <div className={css.wallContainer}>
          <div className={css.headerText}>Discuss {daoState.name}</div>
          <p className={css.discussionWarning}>We are moving from Disqus to 3Box for commenting! Both are available here for a short time so important comments can be copied from Disqus to 3Box.</p>
          <ThreeBoxComments
            spaceName="DAOstack"
            threadName={daoState.id}
            adminEthAddr={"0x0084FB1d84F2359Cafd00f92B901C121521d6809"}
            box={threeBox}
            currentUserAddr={currentAccountAddress}
            currentUser3BoxProfile={currentAccountProfile}
            ethereum={arc.web3 ? arc.web3.eth : null}
            loginFunction={this.handleThreeBoxLogin}
            showCommentCount={10}
            useHovers
            userProfileURL={address => `${process.env.BASE_URL}/profile/${address}`}
          />

          <DiscussionEmbed shortname={process.env.DISQUS_SITE} config={this.disqusConfig} />
        </div>

        { this.state.showingEditPagePopup ?
          <ModalPopup
            closeHandler={this.hideLandingPageContent}
            width="60%"
            header={
              <div className={css.modalHeader}>
                <div className={css.title}>Edit Home Page</div>
                <div className={css.closeButton} onClick={this.hideLandingPageContent}><img src={" /assets/images/Icon/close-grey.svg"} />
                </div>
              </div>
            }
            body={
              <div className={css.modalBody}>
                <div>Editing the content on this DAO’s home page will soon be possible via proposal. Stay tuned!</div>
                <div>For now, if you need a change made to a DAO’s home page content, please contact us at <a href="https://support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a></div>
              </div>
            }
          />
          : ""
        }
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DaoLandingPage);
