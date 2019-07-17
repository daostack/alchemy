import { ISchemeState, Scheme } from "@daostack/client";
import { getArc } from "arc";
import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
import CreateKnownGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateKnownGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "components/CreateProposal/SchemeForms/CreateSchemeRegistrarProposal";
import CreateUnknownGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateUnknownGenericSchemeProposal";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { GenericSchemeRegistry } from "genericSchemeRegistry";
import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
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
    schemeId: ownProps.match.params.schemeId
  };
};

class CreateProposalContainer extends React.Component<IProps, null> {

  public goBack() {
    const { daoAvatarAddress, history, schemeId } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + daoAvatarAddress + "/scheme/" + schemeId);
    }
  }

  public render() {
    const {  daoAvatarAddress, schemeId } = this.props;
    const arc = getArc();

    const observable = from(arc.scheme(schemeId)).pipe(concatMap((scheme: Scheme) => scheme.state()));
    return <Subscribe observable={observable}>{(state: IObservableState<ISchemeState>) => {
      if (state.isLoading) {
        return  <div className={css.loading}><Loading/></div>;
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
          const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(props.scheme.genericScheme.contractToCall);
          if (genericSchemeInfo) {
            createSchemeComponent = <CreateKnownGenericSchemeProposal  {...props} genericSchemeInfo={genericSchemeInfo} />;
          } else {
            createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
          }
        }

        return <div className={css.createProposalWrapper}>
          <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/proposals/create`}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>
          <h2 className={css.header}>
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
