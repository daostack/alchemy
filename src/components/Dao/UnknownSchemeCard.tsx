import { Scheme, ISchemeState } from "@daostack/arc.js";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { splitByCamelCase } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";

import * as css from "./UnknownSchemeCard.scss";

interface IExternalProps {
  schemes: Scheme[];
}

export default (props: IExternalProps) => {
  const { schemes } = props;

  return !schemes.length ? <span></span> :
    (
      <div className={css.wrapper} data-test-id={"schemeCard-unknown"}>
        <div className={css.body}>
          <h2>{schemes.length} Unsupported Plugins</h2>
        </div>
        <table><tbody>
          { schemes.map((scheme: Scheme) => <SubscribedUnknownSchemeRow key={scheme.id} scheme={scheme} />) }
        </tbody></table>
      </div>
    );
};

interface IRowProps extends ISubscriptionProps<ISchemeState> {
  scheme: Scheme;
}

const UnknownSchemeRow = (props: IRowProps) => {
  const schemeState = props.data;
  return <tr key={schemeState.address}>
    <td className={css.left}>&nbsp;</td>
    <td>
      <img className={css.attention} src="/assets/images/Icon/Alert-red.svg" />
      <Link className={css.schemeLink} to={`/dao/${schemeState.dao}/scheme/${schemeState.id}`}>
        {schemeState.name ?
          splitByCamelCase(schemeState.name) :
          schemeState.address
        }
      </Link>
    </td>
  </tr>;
};

const SubscribedUnknownSchemeRow = withSubscription({
  wrappedComponent: UnknownSchemeRow,
  loadingComponent: <tr><td>Loading...</td></tr>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.scheme.id !== newProps.scheme.id;
  },

  createObservable: (props: IRowProps) => {
    return props.scheme.state();
  },
});
