import { ISchemeState } from "@daostack/client";
import { getArc } from "arc";
import CreateContributionRewardProposal from "components/Proposal/Create/SchemeForms/CreateContributionRewardProposal";
import CreateKnownGenericSchemeProposal from "components/Proposal/Create/SchemeForms/CreateKnownGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "components/Proposal/Create/SchemeForms/CreateSchemeRegistrarProposal";
import CreateUnknownGenericSchemeProposal from "components/Proposal/Create/SchemeForms/CreateUnknownGenericSchemeProposal";
import Loading from "components/Shared/Loading";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { RouteComponentProps } from "react-router-dom";
import * as css from "./CreateProposal.scss";

type IExternalProps = RouteComponentProps<any>;

interface IStateProps {
  daoAvatarAddress: string;
  history: H.History;
  schemeId: string;
}

type IProps = IExternalProps & IStateProps & ISubscriptionProps<ISchemeState>;

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IStateProps => {
  return {
    ...ownProps,
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    schemeId: ownProps.match.params.schemeId,
  };
};

class CreateProposalPage extends React.Component<IProps, null> {

  public handleClose(): void {
    const { daoAvatarAddress, history, schemeId } = this.props;
    history.push("/dao/" + daoAvatarAddress + "/scheme/" + schemeId);
  }

  public render(): RenderOutput {
    const { daoAvatarAddress } = this.props;
    const scheme = this.props.data;

    const arc = getArc();
    let schemeName = arc.getContractInfo(scheme.address).name;
    if (!schemeName) {
      throw Error(`Unknown Scheme: ${scheme}`);
    }

    let createSchemeComponent = <div />;
    const props = {
      daoAvatarAddress,
      handleClose: this.handleClose.bind(this),
      scheme,
    };
    if (schemeName === "ContributionReward") {
      createSchemeComponent = <CreateContributionRewardProposal {...props}  />;
    } else if (schemeName === "SchemeRegistrar") {
      createSchemeComponent = <CreateSchemeRegistrarProposal {...props} />;
    } else if (schemeName === "GenericScheme") {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      let contractToCall: string;
      if (scheme.genericSchemeParams) {
        contractToCall  = scheme.genericSchemeParams.contractToCall;
      } else if (scheme.uGenericSchemeParams) {
        // TODO: these lins are a workaround because of a  subgraph bug: https://github.com/daostack/subgraph/issues/342
        contractToCall  = scheme.uGenericSchemeParams.contractToCall;
      } else {
        throw Error("No contractToCall for this genericScheme was found!");
      }
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(contractToCall);
      if (genericSchemeInfo) {
        createSchemeComponent = <CreateKnownGenericSchemeProposal  {...props} genericSchemeInfo={genericSchemeInfo} />;
        schemeName = genericSchemeInfo.specs.name;
      } else {
        createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
      }
    } else if (schemeName === "UGenericScheme") {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(props.scheme.uGenericSchemeParams.contractToCall);
      if (genericSchemeInfo) {
        createSchemeComponent = <CreateKnownGenericSchemeProposal  {...props} genericSchemeInfo={genericSchemeInfo} />;
        schemeName = genericSchemeInfo.specs.name;
      } else {
        createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
      }
    }

    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/proposals/create`}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>
        <h2 className={css.header}>
          <span>+ New proposal <b>| {schemeName}</b></span>
        </h2>
        { createSchemeComponent }
      </div>
    );
  }
}

const SubscribedCreateProposalPage = withSubscription({
  wrappedComponent: CreateProposalPage,
  loadingComponent: <div className={css.loading}><Loading/></div>,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IStateProps) => {
    const arc = getArc(); // TODO: maybe we pass in the arc context from withSubscription instead of creating one every time?
    const scheme = arc.scheme(props.schemeId);
    return scheme.state();
  },
});

export default connect(mapStateToProps)(SubscribedCreateProposalPage);
