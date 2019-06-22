import { IProposalStage, IProposalState } from "@daostack/client";
import * as classNames from "classnames";
import * as moment from "moment";
import * as React from "react";
import { closingTime } from "reducers/arcReducer";
import { proposalEnded, proposalFailed, proposalPassed } from "reducers/arcReducer";
import * as css from "./ProposalStatus.scss";

export default class ProposalStatus extends React.Component<IProps, null> {

  constructor(props: IProps) {
    super(props);
  }

  public render() {
    const {
      proposalState,
    } = this.props;

    const ended = proposalEnded(proposalState);
    const expired = closingTime(proposalState).isSameOrBefore(moment());
    const passed = ended && proposalPassed(proposalState);
    const failed = ended && proposalFailed(proposalState);

    const wrapperClass = classNames({
      [css.wrapper]: true
    });

    return (
      <div className={wrapperClass}>
        {((proposalState.stage === IProposalStage.Queued) && !expired) ?
          <div className={classNames({
            [css.status]: true,
            [css.regular]: true
          })}>Regular</div> :
          ((proposalState.stage === IProposalStage.PreBoosted) && !expired) ?
            <div className={classNames({
              [css.status]: true,
              [css.pending]: true
            })}><img src="/assets/images/Icon/pending.svg" />Pending</div> :
            (proposalState.stage === IProposalStage.Boosted && !expired) ?
              <div className={classNames({
                [css.status]: true,
                [css.boosted]: true
              })}><img src="/assets/images/Icon/boosted.svg" />Boosted</div> :
              (passed) ?
                <div className={classNames({
                  [css.status]: true,
                  [css.passed]: true
                })}><img src="/assets/images/Icon/vote/for-fill-green.svg" />Passed</div> :
                (failed) ?
                  <div className={classNames({
                    [css.status]: true,
                    [css.failed]: true
                  })}><img src="/assets/images/Icon/vote/against-btn-fill-red.svg" />Failed</div> :
                  (expired || ended) ?
                    <div className={classNames({
                      [css.status]: true,
                      [css.expired]: true
                    })}>Expired</div> :
                    <div className={classNames({
                      [css.status]: true,
                      [css.expired]: true
                    })}>[unknown status]</div>
        }
      </div>
    );
  }
}

interface IProps {
  proposalState: IProposalState;
}
