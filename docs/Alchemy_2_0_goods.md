# Alchemy 2.0 goods

## none universal schemes/plugins

 - In stack 2.0 we gave off the universal schemes approach. 
 - All schemes/plugins are none universals- means a scheme instance per dao .
 - This reduce complexity at the contract level and increase security.

## All contracts are proxy upgradable contracts.
 - Enable upgrading all daos contracts implementations while maintaining its addresses and storage.
 - The DAO is the proxy admin of its own contracts .
 - Increase security ,ux and upgradability.

## DAOstack’s contracts/daos ArcHive
 - All daostack’s contracts onchain implementation are registered.
 - Only Contract/DAOs which are registered in daostack’s archive will be supported(indexed and show up in alchemy) by the higher layers .\
 - The ArchHive is owned by daostack !. A schemes/plugin which would like to be added to the ArcHive need to be approved and verified by daostack.
 - This increase security there is a tool which make sure there is no surprises in the contact level and higher layers.

## DAOFactory 
 - Enable instance(deploy) a DAO with a single transaction.
 - The overall cost of DAOCreation is reduced by 10x. 
 - Only ArcHive contracts can be used to create a dao .
 - Only DAOFactory daos are indexed and will be shown in alchemy.
 - The beauty of the DAOFactory can be experience using the DAOCreator.
 - Cheap and fast dao creation increase UX.

## PluginManager / SchemeFactory
 - Bring the easiness of register a new scheme to the dao.
 - All schemes parameters are  passed via the proposal. A scheme instance is created and deployed upon execution.
 - No need to pre deploy scheme and parameters set.
 - Easy and friendly UX

## GenesisProtocol parameters are set upon scheme initialization 
 - As Genesis protocol (and other voting machines)l parameters are set upon scheme initialization...
   there is no need to pre set governance parameters.

## Tx Cost
 - Some optimization where added to genesis protocol and schemes structure which reduce gas needed for proposing/voting/staking.

## Subgraph auto indexing
 - All ArcHive schemes/DAOs are automatically indexed by subgraph . (no need to manually indexed).

## Misc 
 - NFT management scheme - send/mint/list 
 - Arc.react  - enable easy custom react ui components on top of subgraph and arc.js 
 - 2 new Common schemes - JoinAndQuit and Funding Request .
 - Key value on chain dao db (implemented for common) though can be used by other daos.
 - Automatic etherscan/blockscout contract verification upon each dao deployment. 
