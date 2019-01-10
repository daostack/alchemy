// A container without much layout to use for printing simple information
import * as React from "react";
import { connect } from "react-redux";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import gql from 'graphql-tag'

import * as arcActions from "actions/arcActions";
import * as profilesActions from "actions/profilesActions";
import * as uiActions from "actions/uiActions";
import { IRootState } from "reducers";
import { showNotification } from "reducers/notifications";
import { IProfileState } from "reducers/profilesReducer";

import { arc } from 'arc'
import { IDAOState, IProposalState } from '@daostack/client'
import Subscribe, { IObservableState } from "components/Shared/Subscribe"

interface IStateProps extends RouteComponentProps<any> {
  currentAccountAddress: string;
  currentAccountProfile: IProfileState;
  dao: IDAOState;
  daoAvatarAddress: string;
  lastBlock: number;
  // numRedemptions: number;
}

const mapStateToProps = (state: IRootState, ownProps: any) => {
  // const account = denormalize(state.arc.accounts[`${state.web3.ethAccountAddress}-${ownProps.match.params.daoAvatarAddress}`], schemas.accountSchema, state.arc) as IAccountState;
  // let numRedemptions = 0;
  //
  // if (account) {
  //   numRedemptions = Object.keys(account.redemptions).length;
  // }

  return {
    currentAccountAddress: state.web3.ethAccountAddress,
    currentAccountProfile: state.profiles[state.web3.ethAccountAddress],
    dao: ownProps.dao,
    daoAvatarAddress : ownProps.match.params.daoAvatarAddress,
    // numRedemptions,
    // openProposals: dao ? selectors.createOpenProposalsSelector()(state, ownProps) : [],
  };
};

interface IDispatchProps {
  getProfilesForAllAccounts: typeof profilesActions.getProfilesForAllAccounts;
  hideTour: typeof uiActions.hideTour;
  showNotification: typeof showNotification;
  updateDAOLastBlock: typeof arcActions.updateDAOLastBlock;
}

const mapDispatchToProps = {
  getProfilesForAllAccounts: profilesActions.getProfilesForAllAccounts,
  updateDAOLastBlock: arcActions.updateDAOLastBlock,
};

type IProps = IStateProps & IDispatchProps;

const ProposalsContainer = (props: { daoAvatarAddress: string }) => {
  return <Subscribe observable={arc.dao(props.daoAvatarAddress).proposals()}>{
    (state: IObservableState<IProposalState[]>): any => {
      if (state.isLoading) {
        return  <div>loading proposals</div>
      } else if (state.error) {
        throw state.error
      } else {
        if (state.data.length == 0) {
          return <div> no proposals found</div>
        }
        return <div>
            <span>found {state.data.length} proposals: </span>
            { state.data.map((proposal: IProposalState) => {
              return <div key={"proposal_" + proposal.id}>
                id: { proposal.id }
              </div>
            })}
          </div>
      }
    }}
    </Subscribe>

}

const ReputationMintsContainer = () => {
  const query = gql`{
      reputationMints {
        contract
        amount
        address
      }
    }
  `
  return <Subscribe observable={arc.getObservable(query)}>{
    (state: IObservableState<any>) => {
      if (state.isLoading) {
        return <div>loading mints</div>
      } else if (state.error) {
        throw state.error
      } else {
        return <span>found {state.data.data.reputationMints.length} reputation mints</span>
      }
    }
  }</Subscribe>
}
const DebugContainer = (props: IProps) =>  {

  const { dao, currentAccountAddress, currentAccountProfile } = props;

  return <div>
    <pre>
      <a href="/">Back to APP</a><br />
      <b>DAO Info:</b><br />
      -------------------------------<br />
      adress: { dao.address }<br />
      name: { dao.name }<br />
      memberCount: { dao.memberCount }<br />
      token: { dao.token.address }<br />
      tokenTotalSupply: { dao.tokenTotalSupply }<br />
      reputation: { dao.reputation.address }<br />
      reputationTotalSupply: { dao.reputationTotalSupply }<br />
      <br />
      Current Account address: {currentAccountAddress}<br />
      <br />
      currentAccountProfile: { currentAccountProfile}<br />
      <br />
      <h2>Proposals</h2>
      <ProposalsContainer daoAvatarAddress={dao.address} />
      <br />
      <h2>Reputation Mints (subscriptions are known to work for these in the client)</h2>
      <ReputationMintsContainer />
      <br />
    </pre>
  </div>
}

const ConnectedDebugContainer = connect(mapStateToProps, mapDispatchToProps)(DebugContainer);

export default (props: RouteComponentProps<any>) => {
  const daoAddress = props.match.params.daoAvatarAddress
  if (daoAddress) {
      return <Subscribe observable={arc.dao(daoAddress).state}>{(state: IObservableState<IDAOState>) => {
          if (state.error) {
            return <div>{ state.error.message }</div>
          } else if (state.data) {
            return <ConnectedDebugContainer dao={state.data} {...props }/>
          } else {
            return <div>Loading DebugContainer</div>
          }
        }
      }</Subscribe>
  } else {
    throw Error(`no address! `)
  }
}
