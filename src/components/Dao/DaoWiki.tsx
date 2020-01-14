import * as React from "react";
import * as Sticky from "react-stickynode";
import * as arcActions from "actions/arcActions";
import { showNotification } from "reducers/notifications";
import { schemeName } from "lib/util";

import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import Loading from "components/Shared/Loading";

import { IDAOState, ISchemeState, Scheme } from "@daostack/client";
import { WikiContainer, actualHash, ReactiveWiki } from "@dorgtech/daosmind";
import * as css from "./Dao.scss";

type IExternalProps = {
  daoState: IDAOState;
  match: Object;
} & RouteComponentProps<any>;

const mapDispatchToProps = {
  createProposal: arcActions.createProposal,
  showNotification
};

interface IDispatchProps {
  createProposal: typeof arcActions.createProposal;
  showNotification: typeof showNotification;
}

type IProps = IDispatchProps & IExternalProps & ISubscriptionProps<Scheme[]>;

function DaoWiki(props: IProps) {
  React.useEffect(() => {
    checkIfWikiSchemeExists();
  }, []);

  const checkIfWikiSchemeExists = async () => {
    const genericSchemes = props.data;
    const states: ISchemeState[] = [];
    const getSchemeState = () => {
      return new Promise((resolve, reject) => {
        genericSchemes.map((scheme: Scheme) => scheme.state().subscribe(state => states.push(state)));
        resolve();
      });
    };
    await getSchemeState();
    const checkSchemes = (schemeState: ISchemeState) => {
      return "WikiUpdate" === schemeName(schemeState, "[Unknown]");
    };
    const hasWikiScheme = states.some(checkSchemes);

    if (hasWikiScheme) {
      renderWikiComponent();
    } else {
      // here we create the proposal
    }
  };

  const renderWikiComponent = () => {
    const { daoAvatarAddress, perspectiveId, pageId } = props.match.params;
    actualHash["dao"] = daoAvatarAddress;
    actualHash["wiki"] = perspectiveId;
    actualHash["page"] = pageId;
    return WikiContainer.getInstance({});
  };

  return (
    <div>
      <Sticky enabled top={50} innerZ={10000}>
        <div className={css.daoHistoryHeader}>Wiki</div>
      </Sticky>
      <ReactiveWiki {...props} />
    </div>
  );
}

const SubscribedDaoWiki = withSubscription({
  wrappedComponent: DaoWiki,
  loadingComponent: (
    <div className={css.loading}>
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
          name: "GenericScheme"
        }
      },
      { fetchAllData: true }
    );
  }
});

export default connect(
  null,
  mapDispatchToProps
)(SubscribedDaoWiki);
