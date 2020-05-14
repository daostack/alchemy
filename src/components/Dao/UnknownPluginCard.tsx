import { AnyPlugin, IPluginState } from "@dorgtech/arc.js";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import { splitByCamelCase } from "lib/util";
import * as React from "react";
import { Link } from "react-router-dom";

import * as css from "./UnknownPluginCard.scss";

interface IExternalProps {
  plugins: AnyPlugin[];
}

export default (props: IExternalProps) => {
  const { plugins } = props;

  return !plugins.length ? <span></span> :
    (
      <div className={css.wrapper} data-test-id={"pluginCard-unknown"}>
        <div className={css.body}>
          <h2>{plugins.length} Unsupported Plugins</h2>
        </div>
        <table><tbody>
          { plugins.map((plugin: AnyPlugin) => <SubscribedUnknownPluginRow key={plugin.id} plugin={plugin} />) }
        </tbody></table>
      </div>
    );
};

interface IRowProps extends ISubscriptionProps<IPluginState> {
  plugin: AnyPlugin;
}

const UnknownPluginRow = (props: IRowProps) => {
  const pluginState = props.data;
  return <tr key={pluginState.address}>
    <td className={css.left}>&nbsp;</td>
    <td>
      <img className={css.attention} src="/assets/images/Icon/Alert-red.svg" />
      <Link className={css.pluginLink} to={`/dao/${pluginState.dao.id}/plugin/${pluginState.id}`}>
        {pluginState.name ?
          splitByCamelCase(pluginState.name) :
          pluginState.address
        }
      </Link>
    </td>
  </tr>;
};

const SubscribedUnknownPluginRow = withSubscription({
  wrappedComponent: UnknownPluginRow,
  loadingComponent: <tr><td>Loading...</td></tr>,
  errorComponent: null,

  checkForUpdate: (oldProps, newProps) => {
    return oldProps.plugin.id !== newProps.plugin.id;
  },

  createObservable: (props: IRowProps) => {
    return props.plugin.state({});
  },
});
