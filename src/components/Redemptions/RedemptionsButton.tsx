import { Address, AnyProposal } from "@daostack/arc.js";
import { getArc } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import Tooltip from "rc-tooltip";
import { Link } from "react-router-dom";
import { of } from "rxjs";
import { map } from "rxjs/operators";
import RedemptionsMenu from "./RedemptionsMenu";
import * as css from "./RedemptionsButton.scss";

interface IExternalProps {
  currentAccountAddress?: Address;
}

type IProps = IExternalProps & ISubscriptionProps<AnyProposal[]>;

class RedemptionsButton extends React.Component<IProps, null> {
  private menu = React.createRef<Tooltip>()

  public render(): RenderOutput {
    const { data: redeemableProposals } = this.props;

    if (redeemableProposals === null) {
      return null;
    }

    return <div className={css.button} data-test-id="redemptionsButton">
      { document.documentElement.clientWidth < 640 ?
        this.renderDirectLink()
        : this.renderQuickMenuLink()
      }
    </div>;
  }

  private renderDirectLink(): RenderOutput {
    const { data: redeemableProposals } = this.props;
    return <Link to="/redemptions">
      <img src="/assets/images/Icon/menu/redemption.svg" />
      { redeemableProposals.length > 0 ?
        <span className={css.notification}></span>
        : ""}
    </Link>;
  }

  private renderQuickMenuLink(): RenderOutput {
    const { data: redeemableProposals } = this.props;
    const menu = <RedemptionsMenu
      redeemableProposals={redeemableProposals}
      handleClose={this.closeMenu}
    />;
    return <Tooltip
      ref={this.menu}
      placement="bottom"
      align={{
        // Ensure a bit of margin with the right edge
        targetOffset: [30, 0],
      }}
      trigger={["click"]}
      overlayClassName={css.menuTooltip}
      overlay={menu}
    >
      <div>
        <img src="/assets/images/Icon/menu/redemption.svg" />
        { redeemableProposals.length > 0 ?
          <span className={css.notification}></span>
          : ""}
      </div>
    </Tooltip>;
  }

  private closeMenu = () => {
    if (this.menu.current) {
      (this.menu.current as any).trigger.close();
    }
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
    const redeemableProposalsQuery = gql`query proposalsWithUnclaimedRewards
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
