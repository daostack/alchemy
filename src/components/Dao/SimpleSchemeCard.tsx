import { IDAOState, ISchemeState, Scheme } from "@daostack/client-experimental";
import { schemeName } from "lib/schemeUtils";
import * as React from "react";
import { Link } from "react-router-dom";
import * as css from "./SchemeCard.scss";

interface IProps {
  dao: IDAOState;
  scheme: Scheme;
}

const SimpleSchemeCard = (props: IProps) => {
  const { dao, scheme } = props;

  return (
    <div className={css.wrapper} data-test-id={`schemeCard-${scheme.coreState.name}`}>
      <Link className={css.headerLink} to={`/dao/${dao.address}/scheme/${scheme.id}`}>
        {/* TODO: schemeName should be able to accept an ISchemecoreState once the client exports that */}
        <h2>{schemeName(scheme.coreState as ISchemeState, "[Unknown]")}</h2>
      </Link>
    </div>
  );
};

export default SimpleSchemeCard;
