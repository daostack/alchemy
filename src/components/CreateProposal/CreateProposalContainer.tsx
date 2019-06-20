import { Scheme } from "@daostack/client";
import { getArc } from "arc";
import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
import CreateGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "components/CreateProposal/SchemeForms/CreateSchemeRegistrarProposal";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
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
        const schemeName = arc.getContractInfo(scheme.address).name;
        if (!schemeName) {
          throw Error(`Unknown Scheme: ${scheme}`);
        }
        return <div className={css.createProposalWrapper}>

          <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/proposals/${scheme.id}`}>{schemeName.replace(/([A-Z])/g, " $1")}</BreadcrumbsItem>
          <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/proposals/${scheme.id}/create`}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>

          <h2 className={css.header}>
            <span>+ New proposal <b>| {schemeName}</b></span>
          </h2>

          { schemeName === "ContributionReward" ?
              <CreateContributionRewardProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} scheme={scheme}  />
            : schemeName === "SchemeRegistrar" ?
              <CreateSchemeRegistrarProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} scheme={scheme}   />
            : schemeName === "GenericScheme" ?
              <CreateGenericSchemeProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} scheme={scheme}  />
            : ""
          }
        </div>;
      }
    }}
    </Subscribe>;
  }
}

export default connect(mapStateToProps)(CreateProposalContainer);
