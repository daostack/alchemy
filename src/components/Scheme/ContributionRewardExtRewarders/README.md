# ContributionRewardExt Rewarder Registry

`ContributionRewardExt` is a scheme like `ContributionReward` with one major enhancement: The act of redeeming the CrExt rewards may optionally be limited to a "rewarder" agent.  The agent can be a contract that can do stuff like hold the rewards in escrow.  The first example of such a contract is the "Competition" contract that rewards to the most highly-voted suggesters of solutions to a given challenge.

Unlike the GenericSchemeRegistry, Alchemy does not at this time contain a system by which one may configure an interface for interacting with any arbitrary `ContributionRewardExt` rewarder contract.  but one can add a rewarder UI with minimal changes to existing Alchemy code by following the pattern set by the Competition rewarder contract.  You must supply components called "CreateProposal", "Details", and "List", and a json file called "props.json".
