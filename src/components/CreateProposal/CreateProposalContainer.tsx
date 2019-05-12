import * as H from "history";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { connect } from "react-redux";
import { IRootState } from "reducers";
import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
import CreateSchemeRegistrarProposal from "components/CreateProposal/SchemeForms/CreateSchemeRegistrarProposal";
import * as css from "./CreateProposal.scss";

interface IProps {
  daoAvatarAddress: string;
  schemeName: string;
  history: H.History;

}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    schemeName : ownProps.match.params.schemeName,
    history: ownProps.history
  };
};

class CreateProposalContainer extends React.Component<IProps, null> {

  public goBack(e: any) {
    const { history, daoAvatarAddress } = this.props;
    e.preventDefault();

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + daoAvatarAddress);
    }
  }

  public render() {
    const {  daoAvatarAddress } = this.props;
    const schemeName = this.props.schemeName || "ContributionReward";
    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={"/dao/" + daoAvatarAddress + "/proposals/" + schemeName + "/create"}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>

        <h2>
          <span>+ New proposal <b>|{schemeName}</b></span>
        </h2>

        { schemeName === "ContributionReward" ?
            <CreateContributionRewardProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
          : schemeName === "SchemeRegistrar" ?
            <CreateSchemeRegistrarProposal daoAvatarAddress={daoAvatarAddress} handleClose={this.goBack.bind(this)} />
          : ""
        }
      </div>
    );
  }
}

export default connect(mapStateToProps)(CreateProposalContainer);
