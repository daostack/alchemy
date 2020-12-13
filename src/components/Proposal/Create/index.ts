import { History } from "history";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";
import { of } from "rxjs";

import { Address } from "@daostack/arc.js";
import { getArcByDAOAddress } from "lib/util";

import withSubscription from "components/Shared/withSubscription";

import { CreateProposalPage } from "./CreateProposalPage";

type IExternalProps = RouteComponentProps<any>;

interface IExternalStateProps {
  currentAccountAddress: Address;
  daoAvatarAddress: string;
  history: History;
  schemeId: string;
}

const mapStateToProps = (state: IRootState, ownProps: IExternalProps): IExternalProps & IExternalStateProps => {
  return {
    ...ownProps,
    currentAccountAddress: state.web3.currentAccountAddress,
    daoAvatarAddress: ownProps.match.params.daoAvatarAddress,
    schemeId: ownProps.match.params.schemeId,
  };
};

const SubscribedCreateProposalPage: any = withSubscription<any, any>({
  wrappedComponent: CreateProposalPage,
  loadingComponent: null,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress", "schemeId"],
  createObservable: (props: IExternalStateProps) => {
    const arc = getArcByDAOAddress(props.daoAvatarAddress);
    if (props.schemeId) {
      const scheme = arc.scheme(props.schemeId);
      return scheme.state();
    }

    return of(null);
  },
});

export default connect(mapStateToProps)(SubscribedCreateProposalPage);
