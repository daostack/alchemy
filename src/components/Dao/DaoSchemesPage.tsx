import { IDAOState, Scheme } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/Shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import UnknownSchemeCard from "components/Dao/UnknownSchemeCard";
import { KNOWN_SCHEME_NAMES, PROPOSAL_SCHEME_NAMES } from "lib/util";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import * as Sticky from "react-stickynode";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import * as css from "./DaoSchemesPage.scss";
import ProposalSchemeCard from "./ProposalSchemeCard";
import SimpleSchemeCard from "./SimpleSchemeCard";

const Fade = ({ children, ...props }: any) => (
  <CSSTransition
    {...props}
    timeout={1000}
    classNames={{
      enter: css.fadeEnter,
      enterActive: css.fadeEnterActive,
      exit: css.fadeExit,
      exitActive: css.fadeExitActive,
    }}
  >
    {children}
  </CSSTransition>
);

interface IProps {
  dao: IDAOState;
  contributionRewardScheme: Scheme[];
  otherKnownSchemes: Scheme[];
  unknownSchemes: Scheme[];
}

const DaoSchemesPage = (props: IProps) => {
  const { dao, contributionRewardScheme, otherKnownSchemes, unknownSchemes } = props;
  const schemeCardsHTML = (
    <TransitionGroup>
      {[...contributionRewardScheme, ...otherKnownSchemes].map((scheme: Scheme) => (
        <Fade key={"scheme " + scheme.id}>
          {PROPOSAL_SCHEME_NAMES.includes(scheme.staticState.name)
            ? <ProposalSchemeCard dao={dao} scheme={scheme} />
            : <SimpleSchemeCard dao={dao} scheme={scheme} />
          }
        </Fade>
      ))
      }

      {!unknownSchemes ? "" :
        <Fade key={"schemes unknown"}>
          <UnknownSchemeCard schemes={unknownSchemes} />
        </Fade>
      }
    </TransitionGroup>
  );

  return (
    <div className={css.wrapper}>
      <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

      <Sticky enabled top={50} innerZ={10000}>
        <h1>All Schemes</h1>
      </Sticky>
      {(otherKnownSchemes.length + unknownSchemes.length) === 0
        ? <div>
          <img src="/assets/images/meditate.svg" />
          <div>
            No schemes registered
          </div>
        </div>
        :
        <div className={css.allSchemes}>{schemeCardsHTML}</div>
      }
    </div>
  );
};

export default (props: {} & RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress;
  const arc = getArc();

  const observable = combineLatest(
    arc.dao(daoAvatarAddress).state(), // DAO state
    arc.dao(daoAvatarAddress).schemes({where: { name: "ContributionReward"}}),
    // eslint-disable-next-line @typescript-eslint/camelcase
    arc.dao(daoAvatarAddress).schemes({where: { name_not: "ContributionReward", name_in: KNOWN_SCHEME_NAMES}, orderBy: "name", orderDirection: "asc"}),
    // eslint-disable-next-line @typescript-eslint/camelcase
    arc.dao(daoAvatarAddress).schemes({where: { name_not_in: KNOWN_SCHEME_NAMES}, orderBy: "name", orderDirection: "asc"})
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IDAOState, Scheme[], Scheme[], Scheme[]]>): any => {
      if (state.isLoading) {
        return <div className={css.loading}><Loading/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <DaoSchemesPage dao={state.data[0]}
          contributionRewardScheme={state.data[1]}
          otherKnownSchemes={state.data[2]}
          unknownSchemes={state.data[3]}
        />;
      }
    }
  }</Subscribe>;
};
