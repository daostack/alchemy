## 0.10.12
  - Features Added
    - added custom landing page data for Venus Project
    - made it easier for anyone to submit a PR to create their own DAO custom landing page
    - added support for awarding the GEM token
    - added support for DXD token

  - Bugs Fixed
    - DAO and account balances are now computed correctly on xDAI
    - contract and account etherscan links now direct to blockscout, for xDAI
    - enabling predictions now works on xDAI
    - fixed several visual bugs
    - fixed layout of description label on Blockchain interaction proposal create modal
    - fix crash when clicking on a DAO on the DAO Langing page.

## 0.10.11
  - Features Added
    - added the ability to receive email notifications, per DAO, when proposals are created
    - added support for DXSwap governance plugin
    - added support for creating DAOs on the xDAI network

  - Bugs Fixed
    - fix proposal count not automatically updating in the Plugin Proposals page, when proposals are created or expired or move between queues
    - don't add spaces to GenericScheme plugin names in the UI
    - fix layout in a known-GenericScheme proposal summary UI when the callData is very wide

## 0.10.10
  - Several code refactorings

  - Features Added
    - add OK button to the modal prompt that appears on the DAO landing page when clicking the Edit Home Page button
    - page the fetching of preboosted proposals on the Plugin Proposals page, 100 proposals at a time
    - display the scheme "alias" instead of contract name, when available

  - Bugs Fixed
    - in the DAO side bar menu, improve appearance and behavior of the scrollbar that appears when more than three ETH/token balances are listed
    - in the DAO side bar menu, the DAO Holdings link now opens in a new browser tab instead of replacing the current page
    - in the DAO side bar menu, fix DAOstack icon color when not in the context of a DAO
    - when clicking "Redeem" in the Redemptions menu, the menu now disappears to avoid obscuring the Redeem popup.
    - copy-to-clipboard buttons now all show an explanative tooltip
    - improved plugin Information tab layout on mobile platforms
    - improve layout of the account profile page when there is no account profile
    - remove spurious dash at the bottom of the DAO Members and other pages

## 0.10.9
  - Features Added
    - extend Scheme URL Params => Proposal Templates to Competition proposal & competition submission
    - top three boosted proposals shown on plugin cards are now sorted by when they were boosted, descending
    - custom DAO landing page data for the SOS Hackathon
    - enable Competition proposals and Competition Submissions to have embedded videos in their description
    - allow "Recipient address" in proposal form to be empty (and be populated with proposer address)
    - enable Redemptions dropdown menu to automatically update with blockchain changes
    - show Redemptions tooltip on Redeem button when the button is disabled
    - add new ENSPublicResolver GenericScheme target contract
    - page the fetching of preboosted proposals at 100 per page
    - remove redundant New Proposal button on the Plugin Proposals page
    - improve description of plugin permission Mint and Burn
    
  - Bugs Fixed
    - fix erroneous reputation and GEN redemption sums in Redemption dropdown menu cards
    - enable voter 3Box profiles to always all show in proposal Voters popup
    - fix GEN label position in staking popup
    - fix proposal status countdown when the number of days exceeds 30
    - improvments to the All DAOs layout, the DAO sidebar on mobile, the mobile dropdown with no DAO selected, Proposal Details page, DAO Landing page on mobile
    - fixed bug on proposal History page when displaying voting results and YES got 100%
    - reject displaying proposal in the context of a DAO that wasn't responsible for creating it

## 0.10.8
  - Features Added
    -- nicer formatting of embedded videos in proposal descriptions
    -- added help text for proposal descriptions
    -- in the Plugin Manager, Edit Plugin Proposal details, make the copy-to-clipboard button issue a notification when complete
    
  - Bugs Fixed
    -- reenabled the "+ New Proposal" button at the bottom of plugin pages when there are currently no proposals
    -- fixed Disqus conversations that were leaking between proposals and DAOs
    -- fixed required permissions when editing a Plugin Manager scheme
    -- correct the ABI on the ensPublicResolver GenericScheme which caused execution of proposals to fail while seeming to succeed
    -- prevent embedded videos that are playing from stopping when an app notification appears
    -- remove the "+ New Proposal" button on non-supported schemes
    -- fix the Edit Scheme button to bring up the Edit Scheme popup isnteadl of the New Proposal popup
    
## 0.10.7
  - Features Added
    - Added "Stake for Reputation Plugin" to the list of known plugins that can be registered to a DAO
    - Use Tor.us and Metamask providers when running against xDAI network (removes Burner Connect)

  - Bugs Fixed
    - Display a proper msg for daos members with no reputation at the moment of a proposal creation
    - Fix summing up the number of schemes open proposals
    - Cosmetic improvement to the New Proposal button
    - Fix to breadcrumbs relating to the new DAO landing page
    - Don't display unregistered schemes in the Plugin Manager plugins dropdown

## 0.10.6
  - Features Added
    - new DAO landing page
    - added help text in the Plugin Editor popup

  - Bugs Fixed
    - Make sure proposer name doesn't overlap avatar on proposal history rows

## 0.10.5
  - Features Added
    - change home page to show DAOs again instead of feed. Show separate "Your DAOs" section containing DAOs the user follows or is a member of, then the list of other DAOs below.
    - added support for embedded youtube and vimeo videos in proposal descriptions
    - recommended node.js version to build Alchemy is set to 12.16.2
    - upgrade to use subgraph v39_3
    - add subgraph_endpoints.json so it could be read externally
    - add CENNZ ERC20 token to be shown as dao owned tokens/balance

  - Bugs Fixed
    - fix Torus not connecting on first try
    - fix Torus should not describe itself as "Metamask"

## 0.10.4
  - Features Added
    - Add Torus configuration button
    - Recommended node.js version to build Alchemy is set to 12.16.1
    - Only show registered schemes in DAOs
    - Added support for the CO2ken generic scheme
    - Enable Alchemy to run against kovan

  - Bugs Fixed
    - Allow following/unfollowing DAOs again
    - Fix crash on the redemptions page when there are more than 100 DAOs and not all of them initially load. Only currently an issue in Rinkeby
    - Removed "Powered by DAOstack" from Create DAO page

## 0.10.3
  - Features Added
    - Add support for Torus wallet
    - New embedded UI for creating DAOs

  - Bugs Fixed
    - On the All DAOS page, make sure the filter finds all DAOs even if they have not yet been loaded on the client
    - Fix error when navigating to the All Redemptions when there exist more than 100 DAOs.

## 0.10.2
  - Features Added
    - Fix bug when entering numbers for uint256 data types in the GenericScheme new proposal modal
    - New busy waiting animation

  - Bugs Fixed

## 0.10.1

  - Features Added
    - improved some display of staking/preboosting amounts feedback
    - Unknown schemes now link to Scheme page and show permissions

  - Bugs Fixed
    - hide trailing slash in PreTransaction modal header
    - validate all required fields in CreateUnknownGenericSchemeProposal modal
    - workaround crash in Proposal History page

## 0.10.0

  - Features Added
    - added support for EnsRegistrar generic scheme
    - added support for Bounty Network
    - Ctrl-clicking on proposal in history window now goes to new tab
    - Show DAO's reputation total in the sidebar
    - Prevent setting wrong permissions on known plugins in Plugin Manager

  - Bugs Fixed

## 2020-03-03

    - Add curaDAI
    - On the All DAOs page:
      - Added a Search box to filter visible DAOs
      - Add infinite scrolling
      - Always show DAOs in which the current user is a member or is following

  - Bugs Fixed
    - Improve form validation layout
    - fix Wallet Connect
    - rename "scheme" to "plugin"
    - restore original footer
    - fix hex byte pattern in generic scheme proposal form


## 2020-02-11

  - Features added
    - arc version rc.40v1; subgraph v38_0; client 0.2.60
    - Support XDAI network
    - Support Burner Wallet
    - DAO Creator added
    - Decrease bundle size with ~40%
    - Retry on failed queries

  - Bugs fixed
    - update repfromtokens when switching accounts
    - Various UI fixes
    -
## 2020-02-03
  - Features Added
    - Support for Competitions
    - MixPanel Support

  - Bugs Fixed
    - representation of durations in schmeme info page
    - fix plugin manager form
    - do not show the redeem button for expired proposals
    - optimize the bundle size
    - support new ABI for ReputationFromToken
    - add mixpanel support
    - upgrade client to version 0.2.56 (which includes various fixes, and competition support)
    - upgrade subgraph to v37_2 (which included various fixes, and competition supprt)
    - add new ENS registry address

## 2020-01-22

  - TLDR
    - Many tweaks to the language throughout the app
    - Create proposal urls can now be exported and shared
    - Improvements in feed and feed representation
    - Various UI improvements

  - Features Added
    - Can click on whole proposal card to go to proposal details page
    - Can click on whole proposal history row to go to proposal details page
    - Can click on DAO member row to go to account profile page
    - Improvements to language of disabled vote and stake buttons
    - Improvements to language of proposal countdown to show what status it will change to
    - Can now press enter to vote or stake from pre transaction modal, or ESC to close the modal
    - Add follow buttons to feed items
    - fix display for really small screens where the feed item timestamp would mess up layout of feed items
    - Add follow button to DAO sidebar
    - Add modal to ask about connecting to 3box
    - And speed up 3box  use by storing in redux for later use
    - Get logging out of 3box to work when pressing Logout or switching accounts
    - Lessen box shadow on feed items
    - Update banner text on not connected feed page
    - Don't show "not following anything" while loading feed
    - Load less events on initial page load
    - Change event title text for proposal state changes
    - Change "Quiet Ending" to "Boosted (overtime)"
    - Always show Show proposal details link at the bottom of every proposal feed item
    - Dont show 3box interstitial if 3box has cached their signature
    - Change text of follow button while it is pending a change
    - Fade out bottom of proposal description in feed
    - Tabbing in create proposal form is now more usable
    - Upgrade client and subgraph dependencies (which fixes various bugs)
    - Correctly wrap new lines in proposal descriptions
    - Dont show "Proposal" before every proposal title
    - Proposal feed item: Fix fade out to not cover Show more details link
    - Don't show expired proposal feed items when following a DAO
     -Also correctly show proposal items as expired

  - Bugs Fixed
    - Fixed up meta tags for various pages and when sharing to Twitter and Facebook
    - If proposal card action menu would go off screen to the right then it now appears to the left of the button
    - Improve performance of 3box actions like follow items for feed.
    - Add informational popup before any action that interacts with 3box.
    - Add follow button to DAO sidebar
    - Improve copy of home page when not logged in
    - Improve and clean up header text for feed items
    - Fix bug where tooltips in sidebar would cover other menu items. Move them to the right of the sidebar
    - Log out of 3box when clicking the Log Out button
    - Recognize latest ENS contract
    - Remove duplicate privacy policy
    - Fix reputation display for vote and stake events
    - Fix display of enable predictions button in proposal action menu
    - fix ability to execute proposals when DAO doesnt have funds to redeem for beneficiary.
    - Fix display of external token rewards


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
