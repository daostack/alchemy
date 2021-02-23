import { Address } from "@daostack/arc.js";
import { getArcs } from "arc";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import gql from "graphql-tag";
import * as React from "react";
import Tooltip from "rc-tooltip";
import { Link } from "react-router-dom";
import { of, concat } from "rxjs";
import { map, first } from "rxjs/operators";
import RedemptionsMenu from "./RedemptionsMenu";
import * as css from "./RedemptionsButton.scss";
import { standardPolling } from "lib/util";

interface IExternalProps {
  currentAccountAddress?: Address;
}

type IProps = IExternalProps & ISubscriptionProps<any[][]>;

class RedemptionsButton extends React.Component<IProps, null> {
  private menu = React.createRef<Tooltip>()

  public render(): RenderOutput {
    const { data: redeemableProposals } = this.props;

    if (redeemableProposals === null || redeemableProposals.length === 0) {
      return null;
    }

    return <div className={css.button} data-test-id="redemptionsButton">
      {document.documentElement.clientWidth < 640 ?
        this.renderDirectLink()
        : this.renderQuickMenuLink()
      }
    </div>;
  }

  private renderDirectLink(): RenderOutput {
    const { data: redeemableProposals } = this.props;
    return <Link to="/redemptions">
      Redemptions
      <span className={css.notification}>{redeemableProposals.length}</span>
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
        Redemptions
        <span className={css.notification}>{redeemableProposals.length}</span>
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

    const quaries = [];
    const arcs = getArcs();
    const redeemableProposalsQuery = gql`query proposalsWithUnclaimedRewards
      {
        proposals(where: {
          accountsWithUnclaimedRewards_contains: ["${currentAccountAddress}"]
        }) {
          id
          dao { id }
        }
      }`;
    for (const network in arcs) {
      quaries.push(arcs[network].getObservable(redeemableProposalsQuery, standardPolling())
        .pipe(map((result: any) => result.data.proposals)));
    }
    return concat(quaries).pipe(first()).toPromise();
  },

});
