import * as Arc from "@daostack/arc.js";
import * as classNames from "classnames";
import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";

import * as arcActions from "actions/arcActions";
import Util from "lib/util";
import { IRootState } from "reducers";
import { IDaoState, IProposalState } from "reducers/arcReducer";
import * as selectors from "selectors/daoSelectors";
import * as schemas from "../../schemas";

import ViewProposalContainer from "components/Proposal/ViewProposalContainer";
import DaoHeader from "./DaoHeader";
import DaoHistoryContainer from "./DaoHistoryContainer";
import DaoMembersContainer from "./DaoMembersContainer";
import DaoNav from "./DaoNav";
import DaoProposalsContainer from "./DaoProposalsContainer";

import * as css from "./ViewDao.scss";

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  dao: IDaoState;
  daoAddress: string;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
    daoAddress : ownProps.match.params.daoAddress,
  };
};

interface IDispatchProps {
  confirmStake: typeof arcActions.confirmStake;
  getDAO: typeof arcActions.getDAO;
  getProposal: typeof arcActions.getProposal;
}

const mapDispatchToProps = {
  confirmStake: arcActions.confirmStake,
  getDAO: arcActions.getDAO,
  getProposal: arcActions.getProposal,
};

type IProps = IStateProps & IDispatchProps;

class ViewDaoContainer extends React.Component<IProps, null> {
  public proposalEventWatcher: Arc.EventFetcher<Arc.NewContributionProposalEventResult>;
  public stakeEventWatcher: Arc.EventFetcher<Arc.StakeEventResult>;

  public async componentDidMount() {
    const { confirmStake, currentAccountAddress, daoAddress, dao, getDAO, getProposal } = this.props;
    const web3 = Arc.Utils.getWeb3();

    // TODO: we should probably always load the up to date DAO data, but this is kind of a hack
    //       to make sure we dont overwrite all proposals after creating an unconfirmed proposal
    //       and coming back to this page. This should be handled by better merging in the reducer.
    if (!dao || !dao.proposalsLoaded) {
      await getDAO(daoAddress);
    }

    // Watch for new, confirmed proposals coming in
    const contributionRewardInstance = await Arc.ContributionReward.deployed();
    this.proposalEventWatcher = contributionRewardInstance.NewContributionProposal({ _avatar: daoAddress }, { fromBlock: "latest" });
    this.proposalEventWatcher.watch((error, result) => {
      getProposal(daoAddress, result[0].args._proposalId);
    });

    // Watch for new, confirmed stakes coming in for the current account
    // TODO: watch for all new stakes from anyone?
    const genesisProtocolInstance = await Arc.GenesisProtocol.deployed();
    this.stakeEventWatcher = genesisProtocolInstance.Stake({ _voter: currentAccountAddress }, { fromBlock: "latest" });
    this.stakeEventWatcher.watch((error, result) => {
      confirmStake(daoAddress, result[0].args._proposalId, result[0].args._voter, result[0].args._vote, Util.fromWei(result[0].args._amount));
    });
  }

  public componentWillUnmount() {
    if (this.proposalEventWatcher) {
      this.proposalEventWatcher.stopWatching();
    }

    if (this.stakeEventWatcher) {
      this.stakeEventWatcher.stopWatching();
    }
  }

  public render() {
    const { dao } = this.props;

    if (dao) {
      return(
        <div className={css.wrapper}>
          <DaoHeader dao={dao} />
          <DaoNav dao={dao} />

          <Switch>
            <Route exact path="/dao/:daoAddress" component={DaoProposalsContainer} />
            <Route exact path="/dao/:daoAddress/history" component={DaoHistoryContainer} />
            <Route exact path="/dao/:daoAddress/members" component={DaoMembersContainer} />
            <Route exact path="/dao/:daoAddress/proposal/:proposalId" component={ViewProposalContainer} />
          </Switch>
        </div>
      );
    } else {
      return (<div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);
