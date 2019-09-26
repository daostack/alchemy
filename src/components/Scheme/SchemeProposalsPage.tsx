import * as H from "history";
import { Address, IDAOState, IProposalStage, ISchemeState, Proposal } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import * as InfiniteScroll from "react-infinite-scroll-component";
import { Link, RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import ProposalCard from "../Proposal/ProposalCard";
import * as css from "./SchemeProposals.scss";

// For infinite scrolling
const PAGE_SIZE = 100;

// Have to fix this so that scrolling doesn't load weird different sets of proposals as the time changes
// TODO: This is somewhat broken, it needs to get set on the initial render and reset/updated over time somehow?
const currentTime = Math.floor(new Date().getTime() / 1000);

const Fade = ({ children, ...props }: any): any => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IExternalProps extends RouteComponentProps<any> {
  currentAccountAddress: Address;
  history: H.History;
  scheme: ISchemeState;
}

interface IDispatchProps {
  showNotification: typeof showNotification;
}

type SubscriptionData = [Proposal[], Proposal[], Proposal[], IDAOState];
type IProps = IExternalProps & IDispatchProps & ISubscriptionProps<SubscriptionData>;

const mapDispatchToProps = {
  showNotification,
};

class SchemeProposalsPage extends React.Component<IProps, null> {

  private async handleNewProposal(daoAvatarAddress: Address, schemeId: any): Promise<void> {
    if (!await enableWalletProvider({ showNotification: this.props.showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  }

  private _handleNewProposal = (e: any): void => {
    this.handleNewProposal(this.props.data[3].address, this.props.scheme.id);
    e.preventDefault();
  };

  public render(): RenderOutput {
    const { data } = this.props;

    const [proposalsQueued, proposalsPreBoosted, proposalsBoosted, dao] = data;
    const { currentAccountAddress, fetchMore, hasMoreToLoad, scheme } = this.props;

    const queuedProposalsHTML = (
      <TransitionGroup className="queued-proposals-list">
        { proposalsQueued.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const preBoostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsPreBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    const boostedProposalsHTML = (
      <TransitionGroup className="boosted-proposals-list">
        { proposalsBoosted.map((proposal: Proposal): any => (
          <Fade key={"proposal_" + proposal.id}>
            <ProposalCard proposal={proposal} daoState={dao} currentAccountAddress={currentAccountAddress} />
          </Fade>
        ))}
      </TransitionGroup>
    );

    return (
      <div>
        <BreadcrumbsItem to={`/dao/${dao.address}/scheme/${scheme.id}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        { proposalsQueued.length === 0 && proposalsPreBoosted.length === 0 && proposalsBoosted.length === 0
          ?
          <div className={css.noDecisions}>
            <img className={css.relax} src="/assets/images/yogaman.svg"/>
            <div className={css.proposalsHeader}>
              No upcoming proposals
            </div>
            <p>You can be the first one to create a {scheme.name && scheme.name.replace(/([A-Z])/g, " $1") || scheme.address} proposal today! (:</p>
            <div className={css.cta}>
              <Link to={"/dao/" + dao.address}>
                <img className={css.relax} src="/assets/images/lt.svg"/> Back to schemes
              </Link>
              <a className={css.blueButton}
                href="javascript:void(0)"
                onClick={this._handleNewProposal}
                data-test-id="createProposal"
              >+ New Proposal</a>
            </div>
          </div>
          :
          <div>
            <div className={css.boostedContainer}>
              <div className={css.proposalsHeader}>
                Boosted Proposals ({proposalsBoosted.length})
                {proposalsBoosted.length === 0
                  ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer + " " + css.boostedProposalsContainer}>
                {boostedProposalsHTML}
              </div>
            </div>

            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                Pending Proposals ({proposalsPreBoosted.length})
                {proposalsPreBoosted.length === 0
                  ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                {preBoostedProposalsHTML}
              </div>
            </div>
            <div className={css.regularContainer}>
              <div className={css.proposalsHeader}>
                Regular Proposals ({proposalsQueued.length}{hasMoreToLoad ? "+" : ""})
                {proposalsQueued.length === 0
                  ?
                  <div>
                    <img src="/assets/images/yoga.svg"/>
                  </div>
                  : " "
                }
              </div>
              <div className={css.proposalsContainer}>
                <InfiniteScroll
                  dataLength={proposalsQueued.length} //This is important field to render the next data
                  next={fetchMore}
                  hasMore={hasMoreToLoad}
                  loader={<h4>Fetching more proposals...</h4>}
                  endMessage={
                    <p style={{textAlign: "center"}}>
                      <b>&mdash;</b>
                    </p>
                  }
                >
                  {queuedProposalsHTML}
                </InfiniteScroll>
              </div>
            </div>
          </div>
        }
      </div>
    );
  }
}

// For some reason there is a weird maybe bug in TypeScript where adding the functions for fetchingMOre
//   is causing it to misinterpret the type of the SubscriptionData, so have to manually specificy here
const SubscribedSchemeProposalsPage = withSubscription<IProps, SubscriptionData>({
  wrappedComponent: SchemeProposalsPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.match.params.daoAvatarAddress !== oldProps.match.params.daoAvatarAddress
           || oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: (props: IExternalProps) => {
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);
    const schemeId = props.scheme.id;

    return combineLatest(
      // the list of queued proposals
      dao.proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage: IProposalStage.Queued, expiresInQueueAt_gt: currentTime },
        orderBy: "confidence",
        orderDirection: "desc",
        first: PAGE_SIZE,
        skip: 0,
      }),

      // the list of preboosted proposals
      dao.proposals({
        where: { scheme: schemeId, stage: IProposalStage.PreBoosted },
        orderBy: "preBoostedAt",
      }),

      // the list of boosted proposals
      arc.dao(daoAvatarAddress).proposals({
        // eslint-disable-next-line @typescript-eslint/camelcase
        where: { scheme: schemeId, stage_in: [IProposalStage.Boosted, IProposalStage.QuietEndingPeriod] },
        orderBy: "boostedAt",
      }),

      // DAO state
      dao.state()
    );
  },

  // used for hacky pagination tracking
  pageSize: PAGE_SIZE,

  getFetchMoreObservable: (props: IExternalProps, data: SubscriptionData) => {
    const daoAvatarAddress = props.match.params.daoAvatarAddress;
    const arc = getArc();
    const dao = arc.dao(daoAvatarAddress);

    return dao.proposals({
      // eslint-disable-next-line @typescript-eslint/camelcase
      where: { scheme: props.scheme.id, stage: IProposalStage.Queued, expiresInQueueAt_gt: currentTime },
      orderBy: "confidence",
      orderDirection: "desc",
      first: PAGE_SIZE,
      skip: data[0].length,
    });
  },

  fetchMoreCombine: (prevState: SubscriptionData, newData: Proposal[]) => {
    return [prevState[0].concat(newData), prevState[1], prevState[2], prevState[3]];
  },
});

export default connect(null, mapDispatchToProps)(SubscribedSchemeProposalsPage);
