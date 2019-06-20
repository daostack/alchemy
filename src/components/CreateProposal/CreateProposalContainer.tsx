import { Scheme } from "@daostack/client";
import { getArc } from "arc";
import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
import CreateKnownGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateKnownGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "components/CreateProposal/SchemeForms/CreateSchemeRegistrarProposal";
import CreateUnknownGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateUnknownGenericSchemeProposal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { from } from "rxjs";
import * as css from "./CreateProposal.scss";

interface IProps {
  daoAvatarAddress: string;
  history: H.History;
  schemeId: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    history: ownProps.history,
    schemeId: ownProps.match.params.scheme
  };
};

class CreateProposalContainer extends React.Component<IProps, null> {

  public goBack() {
    const { daoAvatarAddress, history, schemeId } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + daoAvatarAddress + "/proposals/" + schemeId);
    }
  }

  public render() {
    const {  daoAvatarAddress, schemeId } = this.props;
    const arc = getArc();

    const observable = from(arc.scheme(schemeId));
    return <Subscribe observable={observable}>{(state: IObservableState<Scheme>) => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        const scheme = state.data;
        let schemeName = arc.getContractInfo(scheme.address).name;
        if (!schemeName) {
          throw Error(`Unknown Scheme: ${scheme}`);
        }

        let createSchemeComponent = <div />;
        const props = {
          daoAvatarAddress,
          handleClose: this.goBack.bind(this),
          scheme
        };

        if (schemeName === "ContributionReward") {
          createSchemeComponent = <CreateContributionRewardProposal {...props}  />;
        } else if (schemeName === "SchemeRegistrar") {
          createSchemeComponent = <CreateSchemeRegistrarProposal { ...props} />;
        } else if (schemeName === "GenericScheme") {
          const genericSchemeRegistry = new GenericSchemeRegistry();
          const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(props.scheme.address);
          if (genericSchemeInfo) {
            createSchemeComponent = <CreateKnownGenericSchemeProposal  {...props} genericSchemeInfo={genericSchemeInfo} />;
          } else {
            createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
          }
        }

        return <div className={css.createProposalWrapper}>
          <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/proposals/${scheme.id}`}>{schemeName.replace(/([A-Z])/g, " $1")}</BreadcrumbsItem>
          <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/proposals/${scheme.id}/create`}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>
          <h2>
            <span>+ New proposal <b>| {schemeName}</b></span>
          </h2>
          { createSchemeComponent }
      </div>;
      }
    }}
    </Subscribe>;
  }
}

export default connect(mapStateToProps)(CreateProposalContainer);
