# Benefits of Alchemy 2.0

## Non-universal plugins (schemes)

 - In stack 2.0 we left behind the universal plugins approach. 
 - All plugins/plugins are non universal - meaning a per-dao instance of a plugin proxy.
 - This reduced complexity at the contract level and increase security.

## All contracts are proxy upgradable contracts.
 - Enables upgrading all daos' contract implementations while maintaining its addresses and storage.
 - The DAO is the proxy admin of its contracts.
 - Increases security, ux and upgradability.

## DAOstack’s contracts/DAOs ArcHive
 - All DAOstack’s contracts' onchain implementations are registered in DAOstack’s ArcHive.
 - Only Contract/DAOs that are registered in DAOstack’s archive will be supported (indexed and appearing in Alchemy) by the higher layers.
 - The ArcHive is owned by DAOstack. A plugin which would like to be added to the ArcHive must be approved and verified by DAOstack.
 - This increased security helps ensure there are no surprises in the contact level and higher layers.

## DAOFactory 
 - Deploy a DAO with a single transaction.
 - The overall cost of DAOCreation is reduced by 10x. 
 - Only ArcHive contracts can be used to create a DAO.
 - Only DAOFactory DAOs are indexed and will be shown in alchemy.
 - The beauty of the DAOFactory can be experience using the DAOCreator.
 - Cheap and fast DAO creation increase UX.

## PluginManager / SchemeFactory
 - Brings the easiness of register a new plugin to the DAO.
 - All plugin parameters are passed via the proposal. A plugin instance is created and deployed upon execution.
 - No longer a need to deploy and initialize a plugin in two separate steps.
 - Easy and friendly UX.

## GenesisProtocol parameters are set upon plugin initialization 
 - As Genesis protocol (and other voting machines)l parameters are set upon plugin initialization,
   there is no need to preset governance parameters.

## Tx Cost
 - Some optimizations were added to GenesisProtocol and plugin structure to reduce gas needed for proposing/voting/staking.

## Subgraph auto indexing
 - All ArcHive plugins/DAOs are automatically indexed by subgraph (no need to manually index).

## Misc 
 - NFT management plugin - send/mint/list 
 - Arc.react  - enable easy custom React UI components on top of subgraph and arc.js 
 - 2 new Common plugins - JoinAndQuit and Funding Request.
 - Key value on chain DAO DB (implemented for Common) though can be used by other DAOs.
 - Automatic etherscan/blockscout contract verification upon each DAO deployment. 
