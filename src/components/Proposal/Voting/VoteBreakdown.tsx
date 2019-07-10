import { Address, IDAOState, IMemberState, IProposalOutcome, IProposalState } from "@daostack/client";
import { checkMetaMaskAndWarn, getArc } from "arc";
import BN = require("bn.js");
import * as classNames from "classnames";
import ReputationView from "components/Account/ReputationView";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { connect } from "react-redux";
import { showNotification } from "reducers/notifications";
import { of } from "rxjs";
import * as css from "./VoteBreakdown.scss";

interface IContainerProps {
  currentAccountAddress: Address;
  currentAccountState: IMemberState|undefined;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  proposal: IProposalState;
  showNotification: typeof showNotification;
  isVotingNo?: boolean;
  isVotingYes?: boolean;
}

interface IState {
  currentVote: number;
  showPreVoteModal: boolean;
}

const mapDispatchToProps = {
  showNotification
};

class VoteBreakdown extends React.Component<IContainerProps, IState> {

  constructor(props: IContainerProps) {
    super(props);

    this.state = {
      currentVote: this.props.currentVote,
      showPreVoteModal: false
    };
  }

  public async handleClickVote(vote: number, event: any) {
    if (!(await checkMetaMaskAndWarn(this.props.showNotification))) { return; }
    const { currentAccountState } = this.props;
    if (currentAccountState.reputation.gt(new BN(0))) {
      this.setState({ showPreVoteModal: true, currentVote: vote });
    }
  }

  public closePreVoteModal(event: any) {
    this.setState({ showPreVoteModal: false });
  }

  public render() {
    const {
      currentVote,
      detailView,
      proposal,
      dao,
      isVotingNo,
      isVotingYes,
    } = this.props;

    const wrapperClass = classNames({
      [css.wrapper]: true,
      [css.detailView]: detailView
    });

    const voteUpClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteUp]: true,
      [css.votedFor]: !isVotingYes && currentVote === IProposalOutcome.Pass,
      [css.upvotePending]: isVotingYes,
    });

    const voteDownClass = classNames({
      [css.voteBreakdown]: true,
      [css.voteDown]: true,
      [css.votedAgainst]: !isVotingNo && currentVote === IProposalOutcome.Fail,
      [css.downvotePending]: isVotingNo,
    });

    return (
      <div className={wrapperClass}>
        <div className={voteUpClass}>
          <img className={css.upvote} src="/assets/images/Icon/vote/for-gray.svg"/>
          <img className={css.upvoted} src="/assets/images/Icon/vote/for-fill.svg"/>
          <svg className={css.upvotePendingIcon} viewBox="0 0 41 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
              <defs>
                  <path d="M0,20.3763021 L20.3990885,0 L40.6751302,20.3763021 L37.7789714,23.491862 L20.3027344,6.04589844 L2.99348958,23.491862 L0,20.3763021 Z M5,25.535319 L20.4567057,10 L35.7426758,25.3149414 L32.6529948,28.3733724 L20.3713379,16.0996094 L7.94677734,28.6004232 L5,25.535319 Z" id="path-1"></path>
              </defs>
              <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g id="Artboard-2" transform="translate(-297.000000, -659.000000)">
                      <g id="Rectangle-2-Copy-3" transform="translate(317.500000, 673.500000) rotate(-360.000000) translate(-317.500000, -673.500000) translate(297.000000, 659.000000)">
                          <mask id="mask-2" fill="white">
                              <use xlinkHref="#path-1"></use>
                          </mask>
                          <use id="Mask" fill="#D8D8D8" opacity="0.400000006" xlinkHref="#path-1"></use>
                          <g id="Group-4" mask="url(#mask-2)" fill="#3AB4D0">
                              <g className={css.verifyMask} transform="translate(-1.000000, 6.000000)">
                                  <rect id="Rectangle-2" opacity="0.5" x="0" y="10" width="42" height="3.94661642"></rect>
                                  <rect id="Rectangle-2-Copy-2" opacity="0.300000012" x="1" y="16" width="42" height="1.94661642"></rect>
                                  <rect id="Rectangle-2-Copy" x="0" y="0" width="42" height="7.94661642"></rect>
                              </g>
                          </g>
                      </g>
                  </g>
              </g>
          </svg>
          <span className={css.reputation}>
            <span className={css.label}>For</span>
            <br className={css.label}/>
            <ReputationView daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesFor} hideSymbol={true} hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
        <div className={voteDownClass}>
          <img className={css.downvote} src="/assets/images/Icon/vote/against-gray.svg"/>
          <img className={css.downvoted} src="/assets/images/Icon/vote/against-fill.svg"/>
          <svg className={css.downvotePendingIcon} width="41px" height="29px" viewBox="0 0 41 29" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
              <defs>
                  <path d="M0,20.3763021 L20.3990885,0 L40.6751302,20.3763021 L37.7789714,23.491862 L20.3027344,6.04589844 L2.99348958,23.491862 L0,20.3763021 Z M5,25.535319 L20.4567057,10 L35.7426758,25.3149414 L32.6529948,28.3733724 L20.3713379,16.0996094 L7.94677734,28.6004232 L5,25.535319 Z" id="path-1"></path>
              </defs>
              <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                  <g id="Artboard-2" transform="translate(-235.000000, -659.000000)">
                      <g id="Rectangle-2" transform="translate(255.500000, 673.500000) rotate(-180.000000) translate(-255.500000, -673.500000) translate(235.000000, 659.000000)">
                          <mask id="mask-2" fill="white">
                              <use xlinkHref="#path-1"></use>
                          </mask>
                          <use id="Mask" fill="#D8D8D8" opacity="0.400000006" xlinkHref="#path-1"></use>
                          <g id="Group-4" mask="url(#mask-2)" fill="#F5A623">
                              <g className={css.verifyMask} transform="translate(-1.000000, 6.000000)">
                                  <rect id="Rectangle-2" opacity="0.5" x="0" y="10" width="42" height="3.94661642"></rect>
                                  <rect id="Rectangle-2-Copy-2" opacity="0.300000012" x="1" y="16" width="42" height="1.94661642"></rect>
                                  <rect id="Rectangle-2-Copy" x="0" y="0" width="42" height="7.94661642"></rect>
                              </g>
                          </g>
                      </g>
                  </g>
              </g>
          </svg>
          <span className={css.reputation}>
            <span className={css.label}>Against</span>
            <br className={css.label}/>
            <ReputationView daoName={dao.name} totalReputation={proposal.totalRepWhenCreated} reputation={proposal.votesAgainst} hideSymbol={true} hideTooltip={!detailView} />
            <b className={css.label}> Rep</b>
          </span>
        </div>
      </div>
    );
  }
}

const ConnectedVoteBreakdown = connect(null, mapDispatchToProps)(VoteBreakdown);

interface IProps {
  currentAccountAddress: Address;
  currentVote: number;
  dao: IDAOState;
  detailView?: boolean;
  proposal: IProposalState;
  isVotingNo?: boolean;
  isVotingYes?: boolean;
}

export default (props: IProps) => {

  const arc = getArc();
  const dao = arc.dao(props.dao.address);
  const observable = props.currentAccountAddress ? dao.member(props.currentAccountAddress).state() : of(null);

  return <Subscribe observable={observable}>{
    (state: IObservableState<IMemberState>): any => {
      if (state.isLoading) {
        return <div>Loading votebox...</div>;
      } else if (state.error) {
        return <div>{ state.error.message }</div>;
      } else {
        return <ConnectedVoteBreakdown currentAccountState={state.data} { ...props } />;
      }
    }
  }</Subscribe>;
};
