import { IDAOState } from "@daostack/client";
import * as profilesActions from "actions/profilesActions";
import * as uiActions from "actions/uiActions";
import { getArc } from "arc";
import * as classNames from "classnames";
import ProposalDetailsContainer from "components/Proposal/ProposalDetailsContainer";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as appCss from "layouts/App.scss";
import Util from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Cookies, withCookies } from "react-cookie";
import Joyride from "react-joyride";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";
import { Subscription } from "rxjs";
import * as proposalCss from "../Proposal/ProposalCard.scss";
import DaoHistoryContainer from "./DaoHistoryContainer";
import DaoMembersContainer from "./DaoMembersContainer";
import DaoProposalsContainer from "./DaoProposalsContainer";
import DaoRedemptionsContainer from "./DaoRedemptionsContainer";
import DaoSidebar from "./DaoSidebar";
import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  cookies: Cookies;
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  dao: IDAOState;
  daoAvatarAddress: string;
  lastBlock: number;
  tourVisible: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccountAddress: state.web3.currentAccountAddress,
    currentAccountProfile: state.profiles[state.web3.currentAccountAddress],
    dao: ownProps.dao,
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    tourVisible: state.ui.tourVisible
  };
};

interface IDispatchProps {
  getProfilesForAllAccounts: typeof profilesActions.getProfilesForAllAccounts;
  hideTour: typeof uiActions.hideTour;
  showTour: typeof uiActions.showTour;
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  getProfilesForAllAccounts: profilesActions.getProfilesForAllAccounts,
  hideTour: uiActions.hideTour,
  showTour: uiActions.showTour,
  showNotification,
};

type IProps = IStateProps & IDispatchProps;

interface IState {
  showTourIntro: boolean;
  showTourOutro: boolean;
  tourCount: number;
  isLoading: boolean;
  dao: IDAOState;
  error: Error;
  complete: boolean;
}

class ViewDaoContainer extends React.Component<IProps, IState> {
  public daoSubscription: any;
  public subscription: Subscription;

  constructor(props: IProps) {
    super(props);

    this.state = {
      showTourIntro: false,
      showTourOutro: false,
      tourCount: 0,
      isLoading: true,
      dao: undefined,
      error: undefined,
      complete: false,
    };
  }

  public async componentWillMount() {
    //const { cookies } = this.props;
    // TODO: disable tour for now until we update it
    // if (!cookies.get("seen_tour")) {
    //   cookies.set("seen_tour", "true", { path: "/" });
    //   this.setState({ showTourIntro: true });
    // }

    this.props.getProfilesForAllAccounts();
  }

  public handleClickStartTour = () => {
    const { showTour } = this.props;
    this.setState({ showTourIntro: false });
    showTour();
  }

  public handleClickSkipTour = () => {
    this.setState({ showTourIntro: false });
  }

  public handleClickEndTour = () => {
    this.setState({ showTourOutro: false });
  }

  public handleJoyrideCallback = (data: any) => {
    const { hideTour } = this.props;

    if (data.type === "tour:end") {
      this.setState({
        showTourOutro: true,
        tourCount: this.state.tourCount + 1
      });
    }
    if (data.action === "close" || data.type === "tour:end") {
      hideTour();
    }
  }

  public render() {
    const { dao, currentAccountAddress, currentAccountProfile, tourVisible } = this.props;

    // TODO: move the tour in its own file for clarity
    const tourSteps = [
      {
        target: "." + css.daoInfo,
        content: `Alchemy is a collaborative application used by ${dao.name} to fund proposals. Anyone can make proposals for funding using Alchemy, and anyone who has acquired reputation in ${dao.name} can vote on whether to fund proposals. Currently,
          ${dao.name} has ${dao.memberCount} members with a total of ${Math.round(Util.fromWei(dao.reputationTotalSupply)).toLocaleString()} reputation`,
        placement: "right",
        disableBeacon: true
      },
      {
        target: "." + appCss.accountInfo,
        content: "This icon represents your wallet. Here you can view your reputation and token balances.",
        placement: "bottom",
        disableBeacon: true
      },
      {
        target: "." + appCss.profileLink,
        content: currentAccountProfile && currentAccountProfile.name ? "Click here to modify your profile, this will help others to trust you." : "Click here to create your profile, this will help others to trust you.",
        placement: "bottom",
        disableBeacon: true
      },
      {
        target: "." + css.holdings,
        content: `The amount in ETH represents the budget currently available for funding proposals. The amount in GEN represents the amount currently available for rewarding voters and predictors.`,
        placement: "left",
        disableBeacon: true
      },
      {
        target: "." + css.createProposal,
        content: "Do you have an idea for an initiative? Create a proposal to get it funded. If the proposal passes, funds will be transferred to the target account automatically and you will be rewarded with additional reputation and GEN. If a proposal fails, there is no penalty for the proposer.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + proposalCss.voteControls,
        content: "If you have reputation in the DAO, you can vote on proposals. If your vote corresponds with the outcome of the voting (i.e. you vote yes on a proposal that passes, or vote no on a proposal that fails), you will be rewarded with reputation and GEN.",
        placement: "right",
        disableBeacon: true
      },
      {
        target: "." + css.regularContainer,
        content: "Regular proposals need an absolute majority to be approved by the DAO. This means that 50% of all reputation needs to vote yes on a non-boosted proposal for it to pass.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + css.boostedContainer,
        content: "Boosted proposals pass or fail based on relative-majority voting. This means that the proposal will pass or fail based on whichever side gets more voting support during a three-day voting period. There is no need for an absolute majority of all DAO reputation. Proposals become boosted when enough people use GEN to stake for their success.",
        placement: "top",
        disableBeacon: true
      },
      {
        target: "." + proposalCss.predictions,
        content: "Influencing proposals isn’t limited to reputation- holders only. Anyone can help direct the attention of the DAO by using GEN to stake on whether a proposal will pass or fail. When enough GEN are staked on the passing of a proposal, it becomes a boosted proposal. Conversely, GEN that are staked on a proposal’s failure can prevent the boosting of a proposal. If you stake with GEN and correctly predict the outcome of a proposal, you will be rewarded with more GEN and reputation.",
        placement: "left",
        disableBeacon: true
      }
    ];

    const tourModalClass = classNames({
      [css.tourModal]: true,
      [css.hidden]: !this.state.showTourIntro && !this.state.showTourOutro
    });

    const tourStartClass = classNames({
      [css.tourStart]: true,
      [css.hidden]: !this.state.showTourIntro
    });

    const tourEndClass = classNames({
      [css.tourEnd]: true,
      [css.hidden]: !this.state.showTourOutro
    });

    return (
      <div className={css.outer}>
        <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

        <div className={tourModalClass}>
          <div className={css.bg}></div>
          <div className={css.accessTour}>
            <button><img src="/assets/images/Tour/TourButton.svg"/></button>
            <div>Access the tour later! <img src="/assets/images/Tour/Arrow.svg"/></div>
          </div>
          <div className={tourStartClass}>
            <h1>Welcome to Alchemy!</h1>
            <span>Decentralized budgeting powered by <img src="/assets/images/Tour/DAOstackLogo.svg"/> DAOstack.</span>
            <p>New to Alchemy? Take this tour to learn how <strong>voting, reputation, predictions,</strong> and <strong>proposals</strong> work.</p>
            <div>
              <button onClick={this.handleClickSkipTour} data-test-id="skip-tour"><img src="/assets/images/Tour/SkipTour.svg"/> Skip for now</button>
              <button className={css.startButton} onClick={this.handleClickStartTour}><img src="/assets/images/Tour/StartTour.svg"/> Take a quick tour</button>
            </div>
          </div>
          <div className={tourEndClass}>
            <h1>You’re done!</h1>
            <p>Thanks for taking the time to learn about Alchemy.
For additional information check out our <a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/edit">FAQ</a> and this <a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23">Intro to Alchemy</a> article.</p>
            <button className={css.startButton} onClick={this.handleClickEndTour}><img src="/assets/images/Tour/StartTour.svg"/> Start using Alchemy</button>
          </div>
        </div>
        <Joyride
          callback={this.handleJoyrideCallback}
          continuous
          key={"joyride_" + this.state.tourCount /* This is a hack to get the tour to reset after it ends, so it can be shown again */}
          run={tourVisible}
          steps={tourSteps}
          showProgress
          styles={{
            options: {
              arrowColor: "#fff",
              backgroundColor: "#fff",
              primaryColor: "#000",
              borderRadius: 0,
              textColor: "rgba(20, 20, 20, 1.000)",
              overlayColor: "rgba(0,0,0,.7)",
            },
            tooltip: {
              borderRadius: 0,
              fontSize: "16px"
            },
            beaconInner: {
              borderRadius: 0,
              backgroundColor: "rgba(255, 0, 72, 1.000)"
            },
            beaconOuter: {
              borderRadius: 0,
              backgroundColor: "rgba(255, 0, 72, .2)",
              border: "2px solid rgba(255, 0, 72, 1.000)"
            },
            beacon: {
              transform: "rotate(45deg)"
            },
            buttonNext: {
              borderRadius: 0,
              border: "1px solid rgba(58, 180, 208, 1.000)",
              color: "rgba(58, 180, 208, 1.000)",
              background: "none",
              cursor: "pointer"
            },
            buttonBack: {
              borderRadius: 0,
              border: "1px solid rgba(0,0,0,.3)",
              color: "rgba(0,0,0,.6)",
              background: "none",
              opacity: ".7",
              cursor: "pointer"
            },
            buttonSkip: {
              borderRadius: 0,
              border: "1px solid rgba(0,0,0,1)",
              color: "rgba(0,0,0,1)",
              background: "none",
              cursor: "pointer"
            }
          }}
        />
        <DaoSidebar address={dao.address} />
        <div className={css.wrapper}>
          <div className={css.noticeWrapper}>
            <div className={css.noticeBuffer}></div>
            <div className={css.notice}>
              <div>
                <img src="/assets/images/Icon/notice.svg"/>
                Alchemy and Arc are in Alpha. There will be BUGS! All reputation accumulated will be reset.
                We don't guarantee complete security. *Play at your own risk*
                <button className={css.closeNotice}>
                  <img src="/assets/images/Icon/x.svg"/>
                </button>
              </div>
            </div>
          </div>
          <Switch>
            <Route exact path="/dao/:daoAvatarAddress/history"
              render={(props) => <DaoHistoryContainer {...props} currentAccountAddress={currentAccountAddress} />} />
            <Route exact path="/dao/:daoAvatarAddress/members"
              render={(props) => <DaoMembersContainer {...props} dao={dao} />} />
            <Route exact path="/dao/:daoAvatarAddress/redemptions"
              render={(props) =>
                <DaoRedemptionsContainer {...props} dao={dao} currentAccountAddress={currentAccountAddress} />
              }
            />
            <Route exact path="/dao/:daoAvatarAddress/proposal/:proposalId"
              render={(props) =>
                <ProposalDetailsContainer {...props} dao={dao} currentAccountAddress={currentAccountAddress} proposalId={props.match.params.proposalId} />
              }
            />
            <Route path="/dao/:daoAvatarAddress"
              render={(props) => <DaoProposalsContainer {...props} currentAccountAddress={currentAccountAddress} />} />
          </Switch>
        </div>
      </div>
    );
  }
}

const ConnectedViewDaoContainer = connect(mapStateToProps, mapDispatchToProps)(withCookies(ViewDaoContainer));

export default (props: RouteComponentProps<any>) => {
  const daoAddress = props.match.params.daoAvatarAddress;
  const arc = getArc();
  return <Subscribe observable={arc.dao(daoAddress).state()}>{(state: IObservableState<IDAOState>) => {
      if (state.error) {
        return <div>{ state.error.message }</div>;
      } else if (state.data) {
        return <ConnectedViewDaoContainer dao={state.data} {...props }/>;
      } else {
        return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
      }
    }
  }</Subscribe>;
};
