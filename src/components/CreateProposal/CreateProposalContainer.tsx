import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
import CreateDutchXProposal from "components/CreateProposal/SchemeForms/CreateDutchXProposal";
import CreateGenericSchemeProposal from "components/CreateProposal/SchemeForms/CreateGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "components/CreateProposal/SchemeForms/CreateSchemeRegistrarProposal";
import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import * as css from "./CreateProposal.scss";

interface IProps {
  daoAvatarAddress: string;
  history: H.History;
  schemeName: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    history: ownProps.history,
    schemeName : ownProps.match.params.schemeName,
  };
};

class CreateProposalContainer extends React.Component<IProps, null> {

  public goBack() {
    const { daoAvatarAddress, history, schemeName } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + daoAvatarAddress + "/proposals/" + schemeName);
    }
  }

  public render() {
    const {  daoAvatarAddress, schemeName } = this.props;

    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={"/dao/" + daoAvatarAddress + "/proposals/" + schemeName + "/create"}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>

        <h2>
          <span>+ New proposal <b>| {schemeName}</b></span>
        </h2>

        { schemeName === "ContributionReward" ?
            <CreateContributionRewardProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
          : schemeName === "SchemeRegistrar" ?
            <CreateSchemeRegistrarProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
          : schemeName === "GenericScheme" ?
            <CreateDutchXProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
          : <CreateGenericSchemeProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
        }
      </div>
    );
  }
}

export default connect(mapStateToProps)(CreateProposalContainer);
