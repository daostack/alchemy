import * as React from 'react';
import { Link } from 'react-router-dom'

import { IWeb3State } from 'reducers/web3Reducer'

import EthBalance from 'components/EthBalance/EthBalance'

import * as css from "./Header.scss"

interface IProps {
  web3: IWeb3State
}

export default class Header extends React.Component<IProps, null> {

  render() {
    const { web3 } = this.props;

    return(
      <nav className={css.header}>
        <Link to='/'><img src='/assets/images/Emergent+-+White@2x.png' height='100' /></Link>
        <h1>Welcome to the Emergent ecosystem</h1>
        {web3 ? <span className={css.etherBalance} >Ether Balance <EthBalance ethAccountBalance={web3.ethAccountBalance} ethAccountAddress={web3.ethAccountAddress} /> </span> : ""}
      </nav>
    )
  }
}