import Loading from "components/Shared/Loading";

import { SelectProposal } from "./SelectProposal";

import withSubscription from "components/Shared/withSubscription";
import { standardPolling } from "lib/util";

export default withSubscription({
  wrappedComponent: (SelectProposal as any),
  loadingComponent: (Loading as any),
  checkForUpdate: [],
  createObservable: (props: any) => {
    const dao = props.daoState.dao;

    return dao.schemes({ where: { isRegistered: true } }, standardPolling(true));
  },
});

