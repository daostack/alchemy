import { CompetitionScheme, IDAOState, ISchemeState, Scheme } from "@daostack/client";
import { enableWalletProvider, getArc } from "arc";
import classNames from "classnames";
import Loading from "components/Shared/Loading";
import TrainingTooltip from "components/Shared/TrainingTooltip";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import UnknownSchemeCard from "components/Dao/UnknownSchemeCard";
import Analytics from "lib/analytics";
import { getSchemeIsActive, KNOWN_SCHEME_NAMES, PROPOSAL_SCHEME_NAMES } from "lib/schemeUtils";
import { Page } from "pages";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { combineLatest, Observable, of } from "rxjs";
import { mergeMap } from "rxjs/operators";
import * as css from "./DaoSchemesPage.scss";
import ProposalSchemeCard from "./ProposalSchemeCard";
import SimpleSchemeCard from "./SimpleSchemeCard";

const Fade = ({ children, ...props }: any) => (
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

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

type IExternalProps = {
  daoState: IDAOState;
} & RouteComponentProps<any>;

type IProps = IExternalProps & ISubscriptionProps<[Scheme[], ISchemeState]> & IDispatchProps;

class DaoSchemesPage extends React.Component<IProps, null> {

  public componentDidMount() {
    Analytics.track("Page View", {
      "Page Name": Page.DAOSchemes,
      "DAO Address": this.props.daoState.address,
      "DAO Name": this.props.daoState.name,
    });
  }

  public handleNewProposal = (schemeId: string) => async (): Promise<void> => {
    const { showNotification, daoState } = this.props;
    const daoAvatarAddress = daoState.address;

    if (!await enableWalletProvider({ showNotification })) { return; }

    this.props.history.push(`/dao/${daoAvatarAddress}/scheme/${schemeId}/proposals/create/`);
  };

  public render() {
    const { data } = this.props;
    const dao = this.props.daoState;
    const allSchemes = data[0];

    const contributionReward = allSchemes.filter((scheme: Scheme) => scheme.staticState.name === "ContributionReward");
    const knownSchemes = allSchemes.filter((scheme: Scheme) => scheme.staticState.name !== "ContributionReward" && KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) >= 0);
    const unknownSchemes = allSchemes.filter((scheme: Scheme) =>  KNOWN_SCHEME_NAMES.indexOf(scheme.staticState.name) === -1 );
    const allKnownSchemes = [...contributionReward, ...knownSchemes];

    const schemeManager = data[1];
    const schemeManagerActive = getSchemeIsActive(schemeManager);

    const schemeCardsHTML = (
      <TransitionGroup>
        { allKnownSchemes.map((scheme: Scheme) => (
          <Fade key={"scheme " + scheme.id}>
            {PROPOSAL_SCHEME_NAMES.includes(scheme.staticState.name)
              ?
              <ProposalSchemeCard dao={dao} scheme={scheme} />
              : <SimpleSchemeCard dao={dao} scheme={scheme} />
            }
          </Fade>
        ))
        }

        {!unknownSchemes ? "" :
          <Fade key={"schemes unknown"}>
            <UnknownSchemeCard schemes={unknownSchemes} />
          </Fade>
        }
      </TransitionGroup>
    );

    return (
      <div className={css.wrapper}>
        <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

        <Sticky enabled top={50} innerZ={10000}>
          <h1>All Plugins</h1>
          { schemeManager ?
            <TrainingTooltip placement="topLeft" overlay={"A small amount of ETH is necessary to submit a proposal in order to pay gas costs"}>
              <a className={
                classNames({
                  [css.addPluginButton]: true,
                  [css.disabled]: !schemeManagerActive,
                })}
              data-test-id="createProposal"
              href="#!"
              onClick={schemeManagerActive ? this.handleNewProposal(schemeManager.id) : null}
              >
                Add a Plugin
              </a>
            </TrainingTooltip>
            : ""}
        </Sticky>
        {(allKnownSchemes.length + unknownSchemes.length) === 0
          ? <div>
            <img src="/assets/images/meditate.svg" />
            <div>
              No schemes registered
            </div>
          </div>
          :
          <div className={css.allSchemes}>{schemeCardsHTML}</div>
        }
      </div>
    );
  }
}

const SubscribedDaoSchemesPage = withSubscription({
  wrappedComponent: DaoSchemesPage,
  loadingComponent: <Loading/>,
  errorComponent: (props) => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const arc = getArc();
    const dao = props.daoState.dao;

    return combineLatest(
      dao.schemes({ where: { isRegistered: true } }, { fetchAllData: true, subscribe: true }),
      // Find the SchemeManager scheme if this dao has one
      Scheme.search(arc, {where: { dao: dao.id, name: "SchemeRegistrar" }}).pipe(mergeMap((scheme: Array<Scheme | CompetitionScheme>): Observable<ISchemeState> => scheme[0] ? scheme[0].state() : of(null)))
    );
  },
});

export default connect(null, mapDispatchToProps)(SubscribedDaoSchemesPage);
