import { IPluginState, IDAOState } from "@daostack/arc.js";
import { pluginName } from "lib/pluginUtils";
import * as React from "react";
import { Link } from "react-router-dom";
import * as css from "./PluginCard.scss";

export interface IProps {
  daoState: IDAOState;
  pluginState: IPluginState;
}

const SimplePluginCard = (props: IProps) => {
  const { daoState, pluginState } = props;

  return (
    <div className={css.wrapper} data-test-id={`pluginCard-${pluginState.name}`}>
      <Link className={css.headerLink} to={`/dao/${daoState.address}/plugin/${pluginState.id}`}>
        <h2>{pluginName(pluginState, "[Unknown]")}</h2>
      </Link>
    </div>
  );
};

export default SimplePluginCard;
