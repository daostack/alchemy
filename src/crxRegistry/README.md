# ContributionRewardExt Rewarder Registry


`ContributionRewardExt` is a scheme like `ContributionReward` but with two distinctions:

1. it enables multiple beneficiaries to be rewarded (proportionally), and
1. the act of redeeming the CrExt rewards may optionally be limited to a "rewarder" agent.  This agent can  be a contract that can do stuff like hold the rewards in escrow.  The first example of such a contract is the "Competition" contract that rewards to the most highly-voted suggesters of solutions to a given challenge.

Unlike the GenericSchemeRegistry, Alchemy does not at this time contain a system by which one may configure an interface for interacting with any `ContributionRewardExt` rewarder contract.  Rather, this ContributionRewardExt Rewarder registry simply allows us to map `ContributionRewardExt.rewarder` to some basic information like name, description, and a static GUI that is already built-in to Alchemy.
