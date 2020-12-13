import { of } from "rxjs";

import { standardPolling } from "lib/util";

import withSubscription from "components/Shared/withSubscription";

import { SelectProposal, IExternalSelectProposalProps } from "./SelectProposal";

export default withSubscription<IExternalSelectProposalProps, any>({
  wrappedComponent: (SelectProposal as any),
  loadingComponent: null,
  checkForUpdate: [],
  createObservable: (props: IExternalSelectProposalProps) => {
    const dao = props.dao;
    if (!dao?.schemes) {
      return of([]);
    }
    return dao.schemes({ where: { isRegistered: true } }, standardPolling(true));
  },
});

