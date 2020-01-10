### template
  - Features Added
  - Bugs Fixed

## Next release
  - Features Added
  - Bugs Fixed

## 2019-12-18

  - Features Added
    - upgrade subgraph to v36_4
  - Bugs Fixed
    - fix representation of timmes longer than a month
    - respect node_env variables
    - fix crashing on proposal page

## 2019-12-10
  - Features Added
    - Use 3box profiles 
    - Create a Feed of events
    - add new cookie policy and privacy policy 
  - Bugs Fixed
    - do not error on bad token address
    - convert deprecated React methods
    - various UI cleanups and fixes
    - add subscriptions for votes, stakes and rewards on the proposal page
    - ignore externalTokenReward when address is null
    - change old dai to sai, add new dai
    - better position notifications 
    - shorten token dropdown menu

## 2019-12-03

  - Features Added
  - Bugs Fixed
    - the proposal detail page now gets updates automatically if data changes
    - rewards do not crash anymore when token address is null
    - some UI fixes
    - refactor all UNSAFE_ methods

## 2019-12-03

## 2019-11-25
  - Features Added
    - prevent redemptions when nothing will happen due to insufficient DAO resources.  Warn on partial redemptions.
    - tooltips: show less duplicates, toggle button always shows it
    - use subgraph v33, client 0.2.34
  - Bugs Fixed
    - update DAO total rep when it changes, so rep percentages remain correct
    - go to error page on non-existent DAOs
    - eliminate rerendering of Disqus component on the proposal details apge
    - refactor arrow functions
    - eliminate empty tooltips
    - eliminate duplicate confirmation notifications


### 2019-11-12
  - Features added
    - Add controls for training tooltips
    - use subgraph v32
  - Bugs fixed
    - Recognize ENS contract addresses on main net

### 2019-11-05
  - Features Added
    - prevent attempting redemptions unless there exist sufficient resources to pay out at least one reward
    - added informative tooltips for application training
    - Gasless ReputationFromTokens using the tx-sender service
    - improved paging on scheme page
  - Bugs Fixed
    - fixed display of scheme activation time
    - fixed empty proposal page when not logged in
    - application behaves better whne the ethereum connection goes down or is unavailable

### 2019-11-05

  - Features Added
    - Proposals can now be tagged on creation
    - History (and other pages) load much faster now
  - Bugs Fixed
    - Proposals counts are fixed
    - Upgrade client to 0.2.22 and subgraph to v31_0

### 2019-10-25

  - Features Added
    - More detailed information on scheme page
    - Performance improvements
    - New proposal button not available on inactive schemes
    - ENS public resolver interface

  - Bugs fixed
    - Improved layout of cookie disclaimer on mobile devices
    - fix "nervous" account menu, now drops down instead of across
    - fix hang on malformed dao address
    - In scheme properties, round thresholdConst up
    - Added cancel button to staking preapproval prompt
    - Names on vote popup are correct now

### 2019-10-16

  - Features Added
    - Links in proposal description open in new tab
    - Show a message on startup when waiting for subgraph
    - Create a single place where all redemptions can be redeemed
    - Cached provider, when available, is now always used when connecting to one's wallet
    - Nicer layout of the list of DAO cards on mobile devices
    - Hide WalletConnect provider option on mobile devices
    - Shrink wallet providers popup window on mobile devices, so can be cancelled
    - more friendly display of error conditions (404 and uncaught exception errors)
    - List of voters in the Voters Popup now shows the user's friendly name, when available.
    - Don't allow connecting to wrong networks
    - Issue a notification when the user connects to a wrong network
    - Optimization of queries and subscriptions
    - ENS interface for generic schemes
    - Feedback when there are unread messages on DAO wall
    - Added Error and 404 pages
    - Proposals now can have tags

  - Bugs Fixed
    - Align headers of table in proposal history
    - Re-add redeem for beneficiary button to proposal details page
    - Fix error on initializing arc
    - Fix infinite scroll loading of queued scheme proposals
    - handle Metamask account changing


### 2019-09-12 [actually two releases]

  - Features Added
    - Tweaks to the wallet provider UI
    - Allow to RedeemFromToken by passing a private key in the URL
    - Use subgraph version 26 in staging
    - Allow for setting subgraph connection with environment variables
    - correct URL form validation
    - fix handling of very small amounts when staking
    - fix handling of very large amounts when displaying proposals
    - fix crash in display of proposals' redeemables when account is readonly
    - show proposals as failing when the vote is tied
    - improvements, bug fixes on the Scheme Information page
    - DAO Discussion page
    - Add link to help center
    - Reduce number of subscriptions from DAO history page
    - add breadcrums to mobile
    - add support for WalletConnect web3 providers
    - add static mint and burn permission
  - Bugs Fixed
    - Fix number formatting
    - Fix crashing of scheme page
    - Hide notifications after 10 seconds
    - Add dao address as default value for Cross-DAO redemptions
    - Fix redemptions count
    - Display proper message when no history
    - avoid duplicate Genesis Alpha cards
    - fix action button not appearing when proposal card countdown completes


### version 0.9.4; 2019-08-13

  - Improve wallet UX
  - Sharing buttons
  - Fix several redeemer bugs
  - Add unit tests
  - UI fixes
  - Added a change log!
