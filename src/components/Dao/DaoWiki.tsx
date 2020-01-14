import * as React from "react";
import * as Sticky from "react-stickynode";
import { IDAOState, ISchemeState, Scheme, IProposalType } from "@daostack/client";
import { WikiContainer, actualHash, ReactiveWiki } from "@dorgtech/daosmind";
import classNames from "classnames";

import { Link } from "react-router-dom";
import * as arcActions from "actions/arcActions";
import { showNotification } from "reducers/notifications";
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
  showNotification: typeof showNotification;
}

type IProps = IDispatchProps & IExternalProps & ISubscriptionProps<Scheme[]>;

function DaoWiki(props: IProps) {
  const [hasWikiScheme, setHasWikiScheme] = React.useState<boolean>(false);

  const renderWikiComponent = () => {
    const { daoAvatarAddress, perspectiveId, pageId } = props.match.params;
    actualHash["dao"] = daoAvatarAddress;
    actualHash["wiki"] = perspectiveId;
    actualHash["page"] = pageId;
    return WikiContainer.getInstance({});
  };

  const checkIfWikiSchemeExists = async () => {
    const genericSchemes = props.data;
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
    } else {
      // here we create the proposal to scheme registrar for the creation of generic scheme wikiupdate
    }
  };

  React.useEffect(() => {
    checkIfWikiSchemeExists();
  }, []);

  const registerWikiScheme = async () => {
    const permissions = 17;

    const proposalValues = {
      dao: props.daoState.address,
      type: IProposalType.SchemeRegistrarAdd,
      permissions: "0x" + permissions.toString(16).padStart(8, "0"),
      value: 0, // amount of eth to send with the call
      tags: ["Wiki"],
      title: "Creation of WikiUpdate scheme",
      //scheme
      //hashParams
    };

    await props.createProposal(proposalValues)

    console.log(proposalValues)
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
    return dao.schemes(
      {
        where: {
          name: "GenericScheme",
        },
      },
      { fetchAllData: true }
    );
  },
});

export default connect(
  null,
  mapDispatchToProps
)(SubscribedDaoWiki);
