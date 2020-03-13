import * as React from "react";
import classNames from "classnames";
import * as css from "./Loading.scss";

interface IExternalProps {
  inline?: boolean; // default is false
}

export default (props: IExternalProps) => {
  /**
   * when !local then we display centered above the entire page,
   * else we display inline.
   */
  return <img
    className={classNames({ [css.loading]: true, [css.global]: !props.inline })}
    src="/assets/images/spinnyBusyIcon.gif"></img>;
};
