import * as React from "react";
import { Link } from "react-router-dom";
import { IDAOState, Scheme, Token } from "@daostack/arc.js";
import { getArc } from "arc";
import { first } from "rxjs/operators";

import { formatTokens, supportedTokens, fromWei, baseTokenName, ethErrorHandler, genName } from "lib/util";
import withSubscription, { ISubscriptionProps } from "components/Shared/withSubscription";
import AccountImage from "components/Account/AccountImage";
import ModalPopup from "components/Shared/ModalPopup";

import BN = require("bn.js");
import * as css from "./DaoHeader.scss";

const styles = {
  circularSquare: {
    borderRadius: "50%",
    borderColor: "white",
    borderStyle: "solid",
  },
};

interface IStateProps {
  showingEditPagePopup: boolean;
}

interface ISignal {
  id: string;
  data: any | string;
}

interface IExternalProps {
  daoState: IDAOState | any;
  signal?: ISignal | any;
}

interface ITokenProps extends ISubscriptionProps<any> {
  dao: IDAOState;
  tokenAddress: string;
}

interface IEthProps extends ISubscriptionProps<BN|null> {
  dao: IDAOState;
}

type IProps = IExternalProps & ISubscriptionProps<[Scheme[], ISignal, IDAOState | any]>;

const DAOHeaderBackground = (props: { backgroundImage: string }) => (
  <img
    className={css.daoHeaderBackground}
    src={props.backgroundImage}
    alt="daoHeaderBackground"
  />
);

class DaoHeaderComponent extends React.Component<IProps, IStateProps> {

  constructor(props: IProps){
    super(props);
    this.state = {
      showingEditPagePopup: false,
    };
  }

  private showLandingPageContent = () => {
    this.setState({ showingEditPagePopup: true });
  }

  private hideLandingPageContent = () => {
    this.setState({ showingEditPagePopup: false });
  }

  render() {
    const { daoState } = this.props;
    // const { daoState, signal } = this.props;
    const { name, memberCount, address, reputationTotalSupply } = daoState;
    const data = {
      daoImg: "/assets/images/generic-user-avatar.png",
      reputationHolders: memberCount,
      description: `
      ${name} is an independent, global community of people working together to build and promote Decentralized Autonomous Organizations (DAOs). 
      It’s the perfect place to get involved with DAOstack.
      `,
    };
    // const { signals } = signalsData.data;
    // const signal = signals.length > 0 ? signals[0] : null;
    const signal = {
      name,
    };
    // const daoHeaderBackground = signal ? JSON.parse(signal.data).Header : null;
    // TODO:
    // Once backend issues are fix we will remove hardcoded background
    // const backgroundImage = daoHeaderBackground ? daoHeaderBackground : "https://i.picsum.photos/id/1006/1081/350.jpg";
    const backgroundImage = "https://i.picsum.photos/id/1006/1081/350.jpg";
    const SupportedTokens = (): any => {
      const tokensSupported = (tokenAddress: any) => {
        return <SubscribedTokenBalance tokenAddress={tokenAddress} dao={daoState} key={"token_" + tokenAddress} />;
      };
      return Object.keys(supportedTokens()).map(tokensSupported);
    };

    const REP = fromWei(reputationTotalSupply).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    return (
      <>
        { signal && backgroundImage && <DAOHeaderBackground backgroundImage={backgroundImage} /> }
        <div className={css.headerWrap}>
          <div className={css.daoImg}>
            {/* Logo will go here instead of AccountImage this is just a placeholder */}
            <AccountImage
              accountAddress={address}
              width={106}
              style={styles.circularSquare}
            />
          </div>
          <div className={css.daoInfo}>
            <b className={css.daoName}>
              { signal.name ? signal.name : name }
            </b>
            <b className={css.reputationHolders}>
              { data.reputationHolders } Reputation Holders
            </b>
          </div>

          <div className={css.holdings}>
            <span>Holdings</span>
            <ul className={css.holdingsList}>
              <li className={css.holdingsAmount}>
                <span>{ REP } REP</span>
              </li>
              <SubscribedEthBalance dao={daoState} />
              <SupportedTokens />
            </ul>
          </div>

          <div className={css.daoHeadingGroup}>
            <div className="header">
              This is the { name } Header
            </div>
            <p className={css.daoDescription}>
              { data.description }
            </p>
            <p className={css.daoDescription}>
              Visit the <Link to={`/dao/${daoState.id}/schemes/`}>Proposals page</Link> to make a proposal to the DAO or vote on existing proposals.
            </p>
            <div className={css.editButton}>
              <button onClick={this.showLandingPageContent}>Edit Home Page</button>
            </div>
          </div>
        </div>
        { this.state.showingEditPagePopup ?
          <ModalPopup
            closeHandler={this.hideLandingPageContent}
            width="60%"
            header={
              <div className={css.modalHeader}>
                <div className={css.title}>Edit Home Page</div>
                <div className={css.closeButton} onClick={this.hideLandingPageContent}><img src={" /assets/images/Icon/close-grey.svg"} />
                </div>
              </div>
            }
            body={
              <div className={css.modalBody}>
                <div>Editing the content on this DAO’s home page will soon be possible via proposal. Stay tuned!</div>
                <div>For now, if you need a change made to a DAO’s home page content, please contact us at <a href="https://support@daostack.zendesk.com" target="_blank" rel="noopener noreferrer">support@daostack.zendesk.com</a></div>
              </div>
            }
          />
          : ""
        }
      </>
    );
  }
}

/***** DAO ETH Balance *****/
interface IEthProps extends ISubscriptionProps<BN|null> {
  dao: IDAOState;
}

const ETHBalance = (props: IEthProps) => {
  const { data } = props;
  return <li key="ETH" className={css.holdingsAmount}><span>{formatTokens(data)} {baseTokenName()}</span></li>;
};

const SubscribedEthBalance = withSubscription({
  wrappedComponent: ETHBalance,
  loadingComponent: <li key="ETH">... {baseTokenName()}</li>,
  errorComponent: null,
  checkForUpdate: (oldProps: IEthProps, newProps: IEthProps) => {
    return oldProps.dao.address !== newProps.dao.address;
  },
  createObservable: (props: IEthProps) => {
    const arc = getArc();
    return arc.dao(props.dao.address).ethBalance().pipe(ethErrorHandler());
  },
});

/***** Token Balance *****/
const TokenBalance = (props: ITokenProps) => {
  const { data, error, isLoading, tokenAddress } = props;

  const tokenData = supportedTokens()[tokenAddress];
  if (isLoading || error || ((data === null || isNaN(data) || data.isZero()) && tokenData.symbol !== genName())) {
    return null;
  }

  return (
    <li key={tokenAddress} className={css.holdingsAmount}>
      <span>{formatTokens(data, tokenData["symbol"], tokenData["decimals"])}</span>
    </li>
  );
};

const SubscribedTokenBalance = withSubscription({
  wrappedComponent: TokenBalance,
  checkForUpdate: (oldProps: ITokenProps, newProps: ITokenProps) => {
    return oldProps.dao.address !== newProps.dao.address || oldProps.tokenAddress !== newProps.tokenAddress;
  },
  createObservable: async (props: ITokenProps) => {
    // General cache priming for the DAO we do here
    // prime the cache: get all members fo this DAO -
    const daoState = props.dao;

    await daoState.dao.members({ first: 1000, skip: 0 }).pipe(first()).toPromise();

    const arc = getArc();
    const token = new Token(props.tokenAddress, arc);
    return token.balanceOf(daoState.address).pipe(ethErrorHandler());
  },
});

const DaoHeader = withSubscription({
  wrappedComponent: DaoHeaderComponent,
  checkForUpdate: [],
  createObservable: (props: IExternalProps) => {
    const dao = props.daoState.dao;
    return dao.schemes({}, { fetchAllData: true, subscribe: true });
  },
});

export default DaoHeader;
