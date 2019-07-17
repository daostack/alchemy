import { Address, ISchemeState, Scheme } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { schemeName} from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { Link, Route, RouteComponentProps, Switch } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import SchemeInfo from "./SchemeInfo";
import SchemeProposals from "./SchemeProposals";
import * as css from "./Scheme.scss";


interface IProps {
  currentAccountAddress: Address;
}

export default class SchemePage extends React.Component<IProps & RouteComponentProps<any>, null> {

  public render() {
    const { currentAccountAddress, match } = this.props;
    const schemeId = match.params.schemeId;
    const daoAvatarAddress = match.params.daoAvatarAddress;

    const arc = getArc();
    const schemeObservable = from(arc.scheme(schemeId)).pipe(concatMap((scheme: Scheme) => scheme.state()))

    return <Subscribe observable={schemeObservable}>{(state: IObservableState<ISchemeState>) => {
      if (state.isLoading) {
        return  <div className={css.loading}><Loading/></div>;
      }
      if (state.error) {
        throw state.error;
      }

      const scheme = state.data;
      return <div className={css.schemeContainer}>
        <BreadcrumbsItem to={`/dao/${daoAvatarAddress}/scheme/${schemeId}`}>{schemeName(scheme, scheme.address)}</BreadcrumbsItem>

        <Sticky enabled={true} top={0} innerZ={10000}>
          <h2 className={css.schemeName}>
            {schemeName(scheme, scheme.address)}
          </h2>

          <div className={css.schemeMenu}>
            <Link className={css.proposals + " " + css.active} to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/proposals/`}>Proposals</Link>
            <Link className={css.info} to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/info/`}>Info</Link>
            <Link className={css.createProposal} to={`/dao/${daoAvatarAddress}/scheme/${scheme.id}/proposals/create`} data-test-id="createProposal">
              + New proposal
            </Link>
          </div>
        </Sticky>

        <Switch>
          <Route exact path="/dao/:daoAvatarAddress/scheme/:schemeId/info"
            render={(props) => <SchemeInfo daoAvatarAddress={daoAvatarAddress} scheme={scheme} />} />

          <Route path="/dao/:daoAvatarAddress/scheme/:schemeId"
            render={(props) => <SchemeProposals {...props} currentAccountAddress={currentAccountAddress} scheme={scheme} />} />
        </Switch>
      </div>;
    }}</Subscribe>;
  }
}

