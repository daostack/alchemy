import * as React from "react";
import * as Sticky from "react-stickynode";
import { IDAOState, ISchemeState, Scheme, IProposalType, Proposal, IProposalStage, IProposalState, IProposalCreateOptions } from "@daostack/client";
import { WikiContainer, actualHash, ReactiveWiki } from "@dorgtech/daosmind";
import classNames from "classnames";
import { enableWalletProvider } from "arc";
import { combineLatest } from "rxjs";

import { Link } from "react-router-dom";
import * as arcActions from "actions/arcActions";
import { showNotification, NotificationStatus } from "reducers/notifications";
import { schemeName } from "lib/util";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import Loading from "components/Shared/Loading";
import * as proposalStyle from "../Scheme/SchemeProposals.scss";
import * as daoStyle from "./Dao.scss";

type IExternalProps = {
  daoState: IDAOState;
  match: Record<string, any>;
} & RouteComponentProps<any>;

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification,
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  voteOnProposal: typeof arcActions.voteOnProposal;
  showNotification: typeof showNotification;
}

type SubscriptionData = ISubscriptionProps<[Scheme[], Proposal[]]>
type IProps = IDispatchProps & IExternalProps & SubscriptionData;

type DispatchMethods = 'createProposal';
type DispatchParams = IProposalCreateOptions;

function DaoWiki(props: IProps) {
  const [hasWikiScheme, setHasWikiScheme] = React.useState<boolean>(false);
  const [schemes, proposals] = props.data;

  const ownDispatcher = async (method: DispatchMethods, params: DispatchParams) => {
    return await props[method](params)
  }

  const renderWikiComponent = () => {
    const { daoAvatarAddress, perspectiveId, pageId } = props.match.params;
    actualHash["dao"] = daoAvatarAddress;
    actualHash["wiki"] = perspectiveId;
    actualHash["page"] = pageId;
    return WikiContainer.getInstance(ownDispatcher);
  };

  const checkIfWikiSchemeExists = async () => {
    const genericSchemes = schemes.filter((scheme: Scheme) => scheme.staticState.name === "GenericScheme")
    const states: ISchemeState[] = [];
    const getSchemeState = () => {
      return new Promise((resolve, reject) => {
        try {
          genericSchemes.map((scheme: Scheme) => scheme.state().subscribe(state => states.push(state)));
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    };
    await getSchemeState();
    const checkSchemes = (schemeState: ISchemeState) => {
      return "WikiUpdate" === schemeName(schemeState, "[Unknown]");
    };
    const wikiSchemeExists = states.some(checkSchemes);
    setHasWikiScheme(wikiSchemeExists);
    if (wikiSchemeExists) {
      renderWikiComponent();
    }
  };

  React.useEffect(() => {
    checkIfWikiSchemeExists();
  }, []);

  const registerWikiScheme = async () => {
    if (!await enableWalletProvider({ showNotification: props.showNotification })) { return; }
    
    const wikiProposalAlreadyExists =  proposals.some(proposal => {
      const state = proposal.staticState as IProposalState
      return state.title === "Creation of WikiUpdate scheme"
    })
    const dao = props.daoState.address
    const schemeRegistrar = schemes.find((scheme: Scheme) => scheme.staticState.name === "SchemeRegistrar")
    
    if (wikiProposalAlreadyExists) {
      props.showNotification(NotificationStatus.Pending, "Wiki Scheme proposal has already been created!");
      props.history.replace(`/dao/${dao}/scheme/${schemeRegistrar.id}`);
    } else {  
      const proposalValues = {
        dao,
        type: IProposalType.SchemeRegistrarAdd,
        permissions: "0x" + (17).toString(16).padStart(8, "0"),
        value: 0, // amount of eth to send with the call
        tags: ["Wiki"],
        title: "Creation of WikiUpdate scheme",
        description: "This will allow DAO to have Wiki functionality",
        parametersHash: '0x00000000000000000000000000000000000000000',
        scheme: schemeRegistrar.staticState.address,
        // this is going to be changed with the generic scheme deployed to call uprtcl's contract
        schemeToRegister: '0x9a543aef934c21da5814785e38f9a7892d3cde6e'
      };
      await props.createProposal(proposalValues);
    }
  };

  const NoWikiScheme = (
    <div className={proposalStyle.noDecisions}>
      <img className={proposalStyle.relax} src="/assets/images/yogaman.svg" />
      <div className={proposalStyle.proposalsHeader}>Wiki scheme not registered on this DAO yet</div>
      <p>You can create the proposal to register it today! (:</p>
      <div className={proposalStyle.cta}>
        <Link to={"/dao/" + props.daoState.address}>
          <img className={proposalStyle.relax} src="/assets/images/lt.svg" /> Back to home
        </Link>
        <a
          className={classNames({
            [proposalStyle.blueButton]: true,
          })}
          onClick={registerWikiScheme}
          data-test-id="createProposal"
        >
          + Register wiki scheme
        </a>
      </div>
    </div>
  );
  return (
    <div>
      <Sticky enabled top={50} innerZ={10000}>
        <div className={daoStyle.daoHistoryHeader}>Wiki</div>
      </Sticky>
      {hasWikiScheme ? <ReactiveWiki {...props} /> : NoWikiScheme }
    </div>
  );
}

const SubscribedDaoWiki = withSubscription({
  wrappedComponent: DaoWiki,
  loadingComponent: (
    <div className={daoStyle.loading}>
      {" "}
      <Loading />
    </div>
  ),
  errorComponent: props => <span>{props.error.message}</span>,
  checkForUpdate: [],
  createObservable: async (props: IExternalProps) => {
    const dao = props.daoState.dao;
    return combineLatest(
      dao.schemes({}, { fetchAllData: true }),
      dao.proposals({ where: { stage: IProposalStage.Queued } }, { subscribe: true, fetchAllData: true })
    )
  },
});

export default connect(
  null,
  mapDispatchToProps
)(SubscribedDaoWiki);
