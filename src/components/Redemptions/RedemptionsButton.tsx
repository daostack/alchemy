import { Address } from "@daostack/client";
import { getArc } from "arc";

import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import { Link } from "react-router-dom";
import { of } from "rxjs";
import { map } from "rxjs/operators";
import * as css from "./RedemptionsButton.scss";

interface IExternalProps {
  currentAccountAddress?: Address;
}

type IProps = IExternalProps & ISubscriptionProps<any[]>;

class RedemptionsButton extends React.Component<IProps, null> {
  public render() {
    const { data: redeemableProposals } = this.props;

    if (redeemableProposals === null) {
      return null;
    }

    return <div className={css.button} data-test-id="redemptionsButton">
      <Link to="/redemptions">
        <img src="/assets/images/Icon/menu/redemption.svg" />
        { redeemableProposals.length > 0 ?
          <span className={css.notification}></span>
          : ""}
      </Link>
    </div>;
  }
}

export default withSubscription({
  wrappedComponent: RedemptionsButton,
  errorComponent: (props) => <div>{props.error.message}</div>,
  checkForUpdate: ["currentAccountAddress"],
  createObservable: ({ currentAccountAddress }: IExternalProps) => {
    if (!currentAccountAddress) {
      return of(null);
    }

    const arc = getArc();
    const redeemableProposalsQuery = gql`
      {
        proposals(where: {
          accountsWithUnclaimedRewards_contains: ["${currentAccountAddress}"]
        }) {
          id
        }
      }`;
    return arc.getObservable(redeemableProposalsQuery)
      .pipe(map((result: any) => result.data.proposals));
  },
});
