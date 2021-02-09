import * as React from "react";
import { Link } from "react-router-dom";
import * as appCss from "../../layouts/App.scss";
import * as css from "./Errors.scss";

const Error404 = () => {
  return (
    <div className={css.errorContainer}>
      <nav className={appCss.header}>
        <div>
          <div className={appCss.menu}>
            <Link to="/"><img src="/assets/images/alchemy-logo-white.svg" /></Link>
          </div>
          <div className={appCss.topInfo}>Alchemy</div>
        </div>
      </nav>
      <div className={css.content}>
        <div className={css.banner}>
          <img className={css.stars} src="/assets/images/Errors/stars-404.svg" />
        </div>
        <div className={css.title}>Are you lost?</div>
        <div className={css.description}>This URL seems wrong (probably a copy-paste error 😉)… Please check the url or contact support.</div>
        <div>
          <Link to="/"><button className={css.home}>Home</button></Link>
        </div>
      </div>
    </div>
  );
};

export default Error404;
