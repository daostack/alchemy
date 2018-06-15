import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as arcActions from "actions/arcActions";
import * as schemas from "../../schemas";

import * as css from "./Home.scss";

interface IStateProps {
  daos: { [key: string]: IDaoState };
  daosLoaded: boolean;
}

const mapStateToProps = (state: IRootState, ownProps: any) => ({
  daos: denormalize(state.arc.daos, schemas.daoList, state.arc),
  daosLoaded: state.arc.daosLoaded,
});

interface IDispatchProps {
  getDAOs: typeof arcActions.getDAOs;
}

const mapDispatchToProps = {
  getDAOs: arcActions.getDAOs,
};

type IProps = IStateProps & IDispatchProps;

class HomeContainer extends React.Component<IProps, null> {

  public render() {
    const { daos, daosLoaded, getDAOs } = this.props;

    return (
      <div className={css.homeWrapper}>
        <div className={css.leftTriangle}></div>
        <div className={css.topTriangle}><img src="/assets/Images/Home/TopTriangle.png"/></div>
        <div className={css.hero}>
          <img src="/assets/Images/Home/Alchemy-logo-home.svg"/>
          <h1>Alchemy</h1>
          <h2>Budgeting and resource allocation for decentralized organizations</h2>
          <div className={css.topCta}>
            <a href="">Join our pilot</a>
            <Link to='/daos'>View Alchemy</Link>
          </div>
        </div>
        <div className={css.aboutAlchemy + " " + css.clearfix}>
          <div className={css.column}>
            <img src="/assets/Images/Home/AlphaGenesisDao.png"/>
          </div>
          <div className={css.column}>
            <h2>Distributed Governance At Scale</h2>
            <p>Alchemy enables organizations with dozens, hundreds and thousands of members to make collaborative decisions on how to spend funds in alignment with the organization's goals and values.</p>
            <p>Alchemy is a Dapp built on DAOstack, a platform for blockchain governance of DAOs (Decentralized Autonomous organizations)</p>
          </div>
        </div>
        <div className={css.joinAlchemy}>
          <div>
            <h2>Join Alchemy Alpha</h2>
            <p>Alchemy is currently in its Alpha version. To join our first experiment and be part of Genesis DAO, sign up here:</p>
            <div className={css.bottomCta}>
              <a href="#">Join our pilot</a>
              <a href="#">About the Genesis DAO</a>
            </div>
          </div>
        </div>
        <div className={css.footer}>
          <Link to='/'>View Alchemy</Link>
          <Link to='/daos'>View Alchemy</Link>
          <a href="https://docs.google.com/document/d/1M1erC1TVPPul3V_RmhKbyuFrpFikyOX0LnDfWOqO20Q/" target='_blank'>FAQ</a>
          <a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target='_blank'>Alchemy 101</a>
          <a href="https://www.daostack.io/" target='_blank'>About DAOstack</a>
          <a href="https://t.me/joinchat/BMgbsAxOJrZhu79TKB7Y8g" target='_blank'>Get involved</a>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(HomeContainer);
