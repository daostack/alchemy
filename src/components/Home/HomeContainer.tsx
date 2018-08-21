import { denormalize } from "normalizr";
import * as React from "react";
import { connect, Dispatch } from "react-redux";
import { Link } from "react-router-dom";

import { IRootState } from "reducers";
import { IDaoState } from "reducers/arcReducer";

import * as arcActions from "actions/arcActions";
import * as schemas from "schemas";

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
        <div className={css.topTriangle}><img src="/assets/images/Home/TopTriangle.png"/></div>
        <div className={css.hero}>
          <img src="/assets/images/Home/AlchemyLogoHome.svg"/>
          <h1>Alchemy</h1>
          <h2>Budgeting and resource allocation for decentralized organizations</h2>
          <div className={css.topCta}>
            { process.env.NODE_ENV == 'production'
                ? <a href='https://alchemy.daostack.io/#/dao/0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1'>View Alchemy</a>
                : <Link to='/daos'>View Alchemy</Link>
            }
          </div>
        </div>
        <div className={css.aboutAlchemy + " " + css.clearfix}>
          <div className={css.column}>
            <img src="/assets/images/Home/AlphaGenesisDao.png"/>
          </div>
          <div className={css.column}>
            <h2>Distributed Governance At Scale</h2>
            <p>Alchemy enables organizations with dozens, hundreds and thousands of members to make collaborative decisions on how to spend funds in alignment with the organization's goals and values.</p>
            <p>Alchemy is a Dapp built on DAOstack, a platform for blockchain governance of DAOs (Decentralized Autonomous organizations)</p>
          </div>
        </div>
        <div className={css.joinAlchemy}>
          <div>
            <h2>Alchemy 101</h2>
            <p>Alchemy is an app for budgeting and resource allocation, designed for Decentralized Autonomous Organizations (DAOs). Alchemy is currently in its Alpha version.</p>
            <div className={css.bottomCta}>
              <a href="https://medium.com/daostack/new-introducing-alchemy-budgeting-for-decentralized-organizations-b81ba8501b23" target='_blank'>Learn more</a>
            </div>
          </div>
        </div>
        <div className={css.footer}>
          <a href='https://alchemy.daostack.io/#/dao/0xa3f5411cfc9eee0dd108bf0d07433b6dd99037f1'>Genesis Alpha</a>
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
