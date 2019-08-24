import { Scheme, ISchemeState } from "@daostack/client";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { linkToEtherScan, splitByCamelCase } from "lib/util";
import * as React from "react";
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
          <h2>{schemes.length} Unsupported Schemes</h2>
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
      {schemeState.name ?
        <a href={linkToEtherScan(schemeState.address)} target="_blank" rel="noopener noreferrer">{splitByCamelCase(schemeState.name)}</a> :
        <a className={css.address} target="_blank" rel="noopener noreferrer" href={linkToEtherScan(schemeState.address)}>{schemeState.address}</a>
      }
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
