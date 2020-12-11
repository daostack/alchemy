import * as React from "react";

import { History } from "history";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import { Page } from "pages";

import { GenericSchemeRegistry } from "genericSchemeRegistry";
import Analytics from "lib/analytics";
import { schemeName } from "lib/schemeUtils";

import { ISchemeState, Address, DAO } from "@daostack/arc.js";
import { CrxRewarderComponentType, getCrxRewarderComponent, rewarderContractName } from "components/Scheme/ContributionRewardExtRewarders/rewardersProps";
import { ISubscriptionProps } from "components/Shared/withSubscription";
import Loading from "components/Shared/Loading";

import CreateKnownGenericSchemeProposal from "./SchemeForms/CreateKnownGenericSchemeProposal";
import CreateSchemeRegistrarProposal from "./SchemeForms/CreateSchemeRegistrarProposal";
import CreateUnknownGenericSchemeProposal from "./SchemeForms/CreateUnknownGenericSchemeProposal";
import CreateGenericMultiCallProposal from "./SchemeForms/CreateGenericMultiCallProposal";
import CreateContributionRewardProposal from "./SchemeForms/CreateContributionRewardProposal";
import SelectProposal from "./SelectProposal";

import * as css from "./CreateProposal.scss";

type IExternalProps = RouteComponentProps<any>;

interface IExternalStateProps {
  dao: DAO;
  currentAccountAddress: Address;
  daoAvatarAddress: string;
  history: History;
  schemeId: string;
  parentPath: string;
}

interface IStateProps {
  createCrxProposalComponent: any;
}

type IProps = IExternalProps & IExternalStateProps & ISubscriptionProps<ISchemeState>;

export class CreateProposalPage extends React.Component<IProps, IStateProps> {

  constructor(props: IProps) {
    super(props);
    this.state = {
      createCrxProposalComponent: null,
    };
  }

  public handleClose = (e?: any) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    this.doClose();
  }

  public doClose = () => {
    const { history, parentPath } = this.props;

    history.push(parentPath);
  }

  public async componentDidMount() {
    document.addEventListener("keydown", this.handleKeyPress, false);

    Analytics.track("Page View", {
      "Page Name": Page.CreateProposal,
      "DAO Address": this.props.daoAvatarAddress,
      "Scheme Address": this.props.schemeId,
    });
    const newState = {};

    /**
     * Get the "CreateProposal" modal dialog component supplied by the rewarder contract associated
     * with this CrExt scheme (if it is a CrExt scheme -- very cheap if not a CrExt).
     */
    if (!this.state.createCrxProposalComponent) {
      const scheme = this.props.data;
      Object.assign(newState, { createCrxProposalComponent: await getCrxRewarderComponent(scheme, CrxRewarderComponentType.CreateProposal) });
    }

    this.setState(newState);
  }

  public async componentDidUpdate(prevProps: Readonly<IProps>) {
    if (prevProps.data?.id !== this.props.data?.id) {
      const scheme = this.props.data;
      this.setState({ createCrxProposalComponent: await getCrxRewarderComponent(scheme, CrxRewarderComponentType.CreateProposal) });
    }
  }

  public componentWillUnmount(){
    document.removeEventListener("keydown", this.handleKeyPress, false);
  }

  private handleKeyPress = (e: any) => {
    // Close modal on ESC key press
    if (e.keyCode === 27) {
      this.doClose();
    }
  }

  private getCreateSchemeComponent = (): [JSX.Element, string] => {
    const { daoAvatarAddress, currentAccountAddress } = this.props;

    const scheme = this.props.data;

    if (!scheme) {
      return [null, "select proposal type"];
    }

    const schemeTitle = this.state.createCrxProposalComponent ? rewarderContractName(scheme) : schemeName(scheme);

    let createSchemeComponent = <div />;
    const props = {
      currentAccountAddress,
      daoAvatarAddress,
      handleClose: this.handleClose,
      scheme,
    };

    if (this.state.createCrxProposalComponent) {
      createSchemeComponent = <this.state.createCrxProposalComponent {...props} />;
    } else if (scheme.name === "ContributionReward") {
      createSchemeComponent = <CreateContributionRewardProposal {...props}/>;
    } else if (scheme.name === "SchemeRegistrar") {
      createSchemeComponent = <CreateSchemeRegistrarProposal {...props} />;
    } else if (scheme.name === "GenericScheme") {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      let contractToCall: string;
      if (scheme.genericSchemeParams) {
        contractToCall = scheme.genericSchemeParams.contractToCall;
      } else if (scheme.uGenericSchemeParams) {
        // TODO: these lins are a workaround because of a  subgraph bug: https://github.com/daostack/subgraph/issues/342
        contractToCall = scheme.uGenericSchemeParams.contractToCall;
      } else {
        throw Error("No contractToCall for this genericScheme was found!");
      }
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(contractToCall);
      if (genericSchemeInfo) {
        createSchemeComponent = <CreateKnownGenericSchemeProposal {...props} genericSchemeInfo={genericSchemeInfo} />;
      } else {
        createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
      }
    } else if (scheme.name === "UGenericScheme") {
      const genericSchemeRegistry = new GenericSchemeRegistry();
      const genericSchemeInfo = genericSchemeRegistry.getSchemeInfo(props.scheme.uGenericSchemeParams.contractToCall);
      if (genericSchemeInfo) {
        createSchemeComponent = <CreateKnownGenericSchemeProposal {...props} genericSchemeInfo={genericSchemeInfo} />;
      } else {
        createSchemeComponent = <CreateUnknownGenericSchemeProposal {...props} />;
      }
    } else if (scheme.name === "GenericSchemeMultiCall") {
      createSchemeComponent = <CreateGenericMultiCallProposal {...props} whitelistedContracts={scheme.genericSchemeMultiCallParams.contractsWhiteList} />;
    }

    return [createSchemeComponent, schemeTitle];
  }

  public render(): RenderOutput {
    const { daoAvatarAddress, match, location, history, dao, data: scheme, parentPath } = this.props;
    const [createSchemeComponent, schemeTitle] = this.getCreateSchemeComponent();

    return (
      <div className={css.createProposalWrapper}>
        <BreadcrumbsItem to={parentPath + "/proposals/create"}>Create {schemeTitle} Proposal</BreadcrumbsItem>
        <h2 className={css.header}>
          <span>+ New proposal <b>| {schemeTitle}</b></span>
          <button className={css.closeButton} aria-label="Close Create Proposal Modal" onClick={this.handleClose}>&times;</button>
        </h2>
        <div className={css.createProposalContent}>
          <SelectProposal
            scheme={scheme}
            dao={dao}
            match={match}
            location={location}
            history={history}
            daoAvatarAddress={daoAvatarAddress}
          />
          {Boolean(!createSchemeComponent) && <div className={css.loadingWrap}><Loading inline /></div>}
          { createSchemeComponent }
        </div>
      </div>
    );
  }
}
