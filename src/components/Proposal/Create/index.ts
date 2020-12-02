import { History } from "history";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";
import { IRootState } from "reducers";

import { Address } from "@daostack/arc.js";
import { getArc } from "arc";

import withSubscription from "components/Shared/withSubscription";
import Loading from "components/Shared/Loading";

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
  loadingComponent: Loading,
  errorComponent: null,
  checkForUpdate: ["daoAvatarAddress"],
  createObservable: (props: IExternalStateProps) => {
    const arc = getArc();
    const scheme = arc.scheme(props.schemeId);
    return scheme.state();
  },
});

export default connect(mapStateToProps)(SubscribedCreateProposalPage);
