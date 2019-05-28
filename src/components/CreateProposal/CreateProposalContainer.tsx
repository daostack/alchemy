import { Address } from "@daostack/client";
import { getArc } from "arc";
import CreateContributionRewardProposal from "components/CreateProposal/SchemeForms/CreateContributionRewardProposal";
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
  scheme: Address;
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
    const { daoAvatarAddress, history, scheme } = this.props;

    if (history.length > 0) {
      history.goBack();
    } else {
      history.push("/dao/" + daoAvatarAddress + "/proposals/" + scheme);
    }
  }

  public render() {
    const {  daoAvatarAddress, scheme } = this.props;
    const arc = getArc();
    //TODO: this should be the name of the scheme ("scheme" is the address)
    const schemeName = arc.getContractInfo(scheme).name;
    if (!schemeName) {
      throw Error(`Unknown Scheme: ${scheme}`);
    }
    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={"/dao/" + daoAvatarAddress + "/proposals/" + scheme}>{schemeName.replace(/([A-Z])/g, " $1")}</BreadcrumbsItem>
        <BreadcrumbsItem to={"/dao/" + daoAvatarAddress + "/proposals/" + scheme + "/create"}>Create {schemeName.replace(/([A-Z])/g, " $1")} Proposal</BreadcrumbsItem>

        <h2>
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
      </div>
    );
  }
}

export default connect(mapStateToProps)(CreateProposalContainer);
