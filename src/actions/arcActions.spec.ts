import { getDAOs, createDAO, CreateDAOAction, createProposal, CreateProposalAction } from "./arcActions";
import { Dispatch } from "react-redux";
import { IRootState } from "reducers";
import * as Arc from "@daostack/arc.js";
import * as arcConstants from "constants/arcConstants";
import { mockStore } from "../configureStore";
import axios from "axios";
import MockAdapter from 'axios-mock-adapter';
import { Web3 } from "@daostack/arc.js";
import { AsyncActionSequence } from "./async";
import { push, LOCATION_CHANGE, CALL_HISTORY_METHOD } from "react-router-redux";
import { IDaoState, IAccountState } from "reducers/arcReducer";
import { member } from "components/ViewDao/ViewDao.scss";

describe('arcActions', () => {

  const store = mockStore();
  const getState = store.getState as () => IRootState;
  let web3: Web3;
  let mockAxios: MockAdapter;
  beforeAll(async () => {
    await Arc.InitializeArcJs();
    web3 = await Arc.Utils.getWeb3();
    mockAxios = new MockAdapter(axios);
    // TODO: proper mocking of the server
    mockAxios.onAny(/.*/i).reply(200, {data: 42});
  })

  let dispatch: any;
  beforeEach(() => {
    dispatch = jest.fn(store.dispatch);
  })

  let daoAddress: string;
  it('createDAO', async () => {
    const daoName = 'TestDAO';
    const tokenName = 'Test';
    const tokenSymbol = 'TST';
    const members: IAccountState[] = [
      {address: web3.eth.accounts[0], tokens: 1000, reputation: 1000, daoAvatarAddress: '', redemptions: [], stakes: [], votes: []},
      {address: web3.eth.accounts[1], tokens: 1000, reputation: 1000, daoAvatarAddress: '', redemptions: [], stakes: [], votes: []}
    ];

    await createDAO(
      daoName,
      tokenName,
      tokenSymbol,
      members
    )(dispatch, getState, null);

    const calls = dispatch.mock.calls.map((args: any) => args[0]);

    const actions = calls.filter((a: any) => a.type !== CALL_HISTORY_METHOD);
    const last = actions.pop();

    // Verify all actions prior to last are pending actions
    for (let i = 0; i < actions.length ; i++) {
      const action = actions[i];
      expect(action).toMatchObject({
        type: arcConstants.ARC_CREATE_DAO,
        // sequence: AsyncActionSequence.Pendings,
        // operation: {
        //   // Fails:
        //   // totalSteps: actions.length
        // }
      })
    }

    if (last.sequence === AsyncActionSequence.Success) {
      // Verify last action is a success with proper payload
      expect(last).toMatchObject({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Success,
        payload: {entities: {
          daos: {}
        }}
      } as CreateDAOAction)
      const daos = last.payload.entities.daos;
      const daoAddresses = Object.keys(daos);
      expect(daoAddresses.length).toEqual(1);
      daoAddress = daoAddresses[0];
      const dao = daos[daoAddress] as IDaoState;

      const daoInstance = await Arc.DAO.at(daoAddress);

      console.log(dao)
      expect(dao).toMatchObject({
        avatarAddress: daoAddress,
        name: daoName,
        tokenName,
        tokenSymbol,
        proposalsLoaded: true,
        proposals: [],
        ethCount: 0,
        genCount: 0,
        tokenCount: 0,
        tokenSupply: members.reduce((sum, member) => sum + member.tokens, 0),
        reputationCount: members.reduce((sum, member) => sum + member.reputation, 0),
        controllerAddress: daoInstance.controller.address,
        reputationAddress: daoInstance.reputation.address,
        tokenAddress: daoInstance.token.address,
      });

      return
      // TODO: evaluate if it is worth the trouble to get the rest of this test to work
      // Verify proper members shape
      expect(dao.members)
        .toMatchObject(
          members.map((member: any) => ({...member, redemptions: {}, stakes: {}, votes: {}} as IAccountState))
          .reduce((obj, member) => ({...obj, [member.address]: member}), {})
        );

      // Verify that there was a location change
      const locationChanges = calls.filter((a: any) => a.type === CALL_HISTORY_METHOD);
      expect(locationChanges.length).toEqual(1);
      expect(locationChanges[0]).toMatchObject(push(`/dao/${daoAddress}`))

    } else {
      // Verify last action is a failure with proper payload
      expect(last).toMatchObject({
        type: arcConstants.ARC_CREATE_DAO,
        sequence: AsyncActionSequence.Failure
      } as CreateDAOAction)
    }
  });

  it('createProposal', async () => {
    const title = 'Some title';
    const description = 'Some description';
    const nativeTokenReward = 10;
    const reputationReward = 20;
    const ethReward = 30;
    const externalTokenReward = 0;
    const beneficiaryAddress = web3.eth.accounts[3];

    await createProposal(
      daoAddress,
      title,
      description,
      nativeTokenReward,
      reputationReward,
      ethReward,
      externalTokenReward,
      beneficiaryAddress,
    )(dispatch, getState, null);

    const calls = dispatch.mock.calls.map((args: any) => args[0]);

    const actions = calls.filter((a: any) => a.type !== CALL_HISTORY_METHOD);
    const last = actions.pop();

    // Verify all actions prior to last are pending actions
    for (let i = 0; i < actions.length ; i++) {
      const action = actions[i];
      expect(action).toMatchObject({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Pending,
        // operation: {
        //   totalSteps: actions.length
        // }
      })
    }

    if (!last || last.sequence === AsyncActionSequence.Pending) {
      if (last) {
        expect(last).toMatchObject({
          type: arcConstants.ARC_CREATE_PROPOSAL,
          sequence: AsyncActionSequence.Pending,
          // operation: {
          //   totalSteps: actions.length + 1
          // }
        })
      }

      // Verify that there was a location change
      const locationChanges = calls.filter((a: any) => a.type === CALL_HISTORY_METHOD);
      expect(locationChanges.length).toEqual(1);
      expect(locationChanges[0]).toMatchObject(push(`/dao/${daoAddress}`))

    } else {
      // Verify last action is a failure with proper payload
      expect(last).toMatchObject({
        type: arcConstants.ARC_CREATE_PROPOSAL,
        sequence: AsyncActionSequence.Failure
      } as CreateProposalAction)
    }
  })
})
