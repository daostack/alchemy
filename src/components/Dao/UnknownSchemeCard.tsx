import { Scheme, ISchemeState } from "@daostack/client";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import { linkToEtherScan, splitByCamelCase } from "lib/util";
import * as React from "react";
import * as css from "./UnknownSchemeCard.scss";

interface IExternalProps {
  schemes: Scheme[];
}

interface IInternalProps {
  schemes: Scheme[];
}

const UnknownSchemeCard = (props: IInternalProps) => {

  const { schemes } = props;

  return !schemes.length ? <span></span> :
    (
      <div className={css.wrapper} data-test-id={"schemeCard-unknown"}>
        <div className={css.body}>
          <h2>{schemes.length} Unsupported Schemes</h2>
        </div>
        <table><tbody>
          {
            schemes.map((scheme: Scheme) => {
              return <Subscribe observable={scheme.state()} key={scheme.id}>{
                (state: IObservableState<ISchemeState>): any => {
                  if (state.isLoading) {
                    return  <div>Loading..</div>;
                  } else if (state.error) {
                    throw state.error;
                  } else {
                    const schemeState = state.data;
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
                  }
                }
              }</Subscribe>;
            })
          }
        </tbody></table>
      </div>
    );
};

export default (props: IExternalProps) => {
  return <UnknownSchemeCard {...props} />;
};
