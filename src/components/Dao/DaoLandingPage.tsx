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

  private disqusConfig = {
    url: "",
    identifier: "",
    title: "",
  };

  constructor(props: IProps) {
    super(props);
    this.state = {
      showingEditPagePopup: false,
    };
  }

  public componentDidMount() {

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

    this.disqusConfig.url = `${process.env.BASE_URL}/dao/${this.props.daoState.address}/discussion`;
    this.disqusConfig.identifier = this.props.daoState.address;
    this.disqusConfig.title = "Discuss " + this.props.daoState.name;

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

          { (daoState.address === "0xfaf05fedf06cac499b899d6a2052f23ae239b29d") ? // SoS Collective on xDAI
            <>
              <div className={css.welcome}>Welcome to the {daoState.name} digital co-op.</div>
              <div className={css.welcome}>Our first event is the <a href="https://soshackathon.com/" target="_blank" rel="noopener noreferrer">SoS Hackathon</a>: Fund your ideas and solutions to heal the world in crisis.</div>
              <ul>
                <li>Register for the hackathon <a href="https://bit.ly/GlobalSOSRegistration" target="_blank" rel="noopener noreferrer">here</a>.</li>
                <li>Create an onboarding proposal for the cooperative <Link to={`/dao/${daoState.id}/scheme/0xd4b6ee901566c88f942c2a04803f65cb7a554d8bc9a8f4fb5ded5cd012ca0897/proposals/create/?beneficiary=&description=This%20is%20an%20introduction%20proposal%20to%20join%20the%20builder%20collective%20and%20SoS%20hackathon.%20Please%20fill%20out%20%3CYOUR%20NAME%3E,%20%3CLINK%20TO%20YOUR%20DISCORD%20ID%3E,%20%3CYOURSKILLS%3E,%20and%20%3CWHAT%20ARE%20YOU%20EXCITED%20ABOUT%3E&ethReward=0&externalTokenAddress=0x543ff227f64aa17ea132bf9886cab5db55dcaddf&externalTokenReward=0&nativeTokenReward=0&reputationReward=50&title=Onboarding%20:%20%3CYOUR%20NAME%3E&url=&tags=[]`}>here</Link>.</li>
                <li>Join our Discord community for further discussions here: <a href="https://discord.gg/rUr3rp7" target="_blank" rel="noopener noreferrer">https://discord.gg/rUr3rp7</a></li>
              </ul>
            </>
            :
            <>
              <div className={css.welcome}>Welcome to {daoState.name}, a decentralized organization built on DAOstack.</div>

              <div className={css.visitProposals}>Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to
                make a proposal to the DAO or vote on existing proposals.</div>
            </>
          }

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

        {this.state.showingEditPagePopup ?
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
