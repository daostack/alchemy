import * as Arc from '@daostack/arc.js';
import * as classNames from 'classnames';
import { denormalize } from 'normalizr';
import * as React from 'react';
import { connect, Dispatch } from 'react-redux';
import { Link, Route, RouteComponentProps, Switch } from 'react-router-dom'

import * as arcActions from 'actions/arcActions';
import { IRootState } from 'reducers';
import { IDaoState, IMemberState, IProposalState } from 'reducers/arcReducer';
import * as schemas from '../../schemas';
import * as selectors from 'selectors/daoSelectors';

import DaoHeader from './DaoHeader';
import DaoNav from './DaoNav';
import DaoProposalsContainer from './DaoProposalsContainer';
import DaoHistoryContainer from './DaoHistoryContainer';
import DaoMembersContainer from './DaoMembersContainer';
import ViewProposalContainer from 'components/Proposal/ViewProposalContainer';

import * as css from './ViewDao.scss';

interface IStateProps extends RouteComponentProps<any> {
  dao: IDaoState
  daoAddress : string
}

const mapStateToProps = (state : IRootState, ownProps: any) => {
  return {
    dao: denormalize(state.arc.daos[ownProps.match.params.daoAddress], schemas.daoSchema, state.arc),
    daoAddress : ownProps.match.params.daoAddress
  };
};

interface IDispatchProps {
  getDAO: typeof arcActions.getDAO
  getProposal: typeof arcActions.getProposal
}

const mapDispatchToProps = {
  getDAO: arcActions.getDAO,
  getProposal: arcActions.getProposal
};

type IProps = IStateProps & IDispatchProps

class ViewDaoContainer extends React.Component<IProps, null> {
  proposalEventWatcher : Arc.EventFetcher<Arc.NewContributionProposalEventResult>;

  async componentDidMount() {
    const { daoAddress, getDAO, getProposal } = this.props;

    await getDAO(daoAddress);

    const contributionRewardInstance = await Arc.ContributionReward.deployed();
    this.proposalEventWatcher = contributionRewardInstance.NewContributionProposal({ _avatar: daoAddress }, { fromBlock: 'latest' });
    this.proposalEventWatcher.watch((error, result) => {
      getProposal(daoAddress, result[0].args._proposalId);
    });
  }

  componentWillUnmount() {
    this.proposalEventWatcher.stopWatching();
  }

  render() {
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
      return (<div>Loading... </div>);
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ViewDaoContainer);