import * as Arc from '@daostack/client'
const graphqlHttpProvider: string = 'http://127.0.0.1:8000/by-name/daostack/graphql'
const graphqlWsProvider: string = 'ws://127.0.0.1:8001/by-name/daostack'
const web3Provider: string = 'http://127.0.0.1:8545'

export const arc = new Arc.Arc({
  graphqlHttpProvider,
  graphqlWsProvider,
  web3Provider
})
