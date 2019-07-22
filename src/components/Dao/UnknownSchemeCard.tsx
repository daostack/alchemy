import { Scheme } from "@daostack/client";
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
              return (
                <tr key={scheme.address}>
                  <td className={css.left}>&nbsp;</td>
                  <td>
                    <img className={css.attention} src="/assets/images/Icon/Alert-red.svg" />
                    {scheme.name ?
                      <a href={linkToEtherScan(scheme.address)} target="_blank" rel="noopener noreferrer">{splitByCamelCase(scheme.name)}</a> :
                      <a className={css.address} target="_blank" rel="noopener noreferrer" href={linkToEtherScan(scheme.address)}>{scheme.address}</a>
                    }
                  </td>
                </tr>);
            })
          }
        </tbody></table>
      </div>
    );
};

export default (props: IExternalProps) => {
  return <UnknownSchemeCard {...props} />;
};
