import { IDAOState, Scheme } from "@daostack/client";
import { getArc } from "arc";
import Loading from "components/shared/Loading";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import * as css from "./AllSchemes.scss";
import SchemeCardContainer from "./SchemeCardContainer";

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
  schemes: Scheme[];
}

const AllSchemesContainer = (props: IProps) => {
  const { dao, schemes } = props;

  const schemeCardsHTML = (
    <TransitionGroup>
      { schemes.map((scheme: Scheme) => (
        <Fade key={"scheme " + scheme.id}>
          <SchemeCardContainer dao={dao} scheme={scheme} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  return (
    <div className={css.wrapper}>
      <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

      <h1>All Schemes</h1>
      { schemes.length === 0
        ? <div>
            <img src="/assets/images/meditate.svg"/>
            <div>
              No schemes registered
            </div>
          </div>
        :
        <div>
          {schemeCardsHTML}
        </div>
      }
    </div>
  );
};

export default(props: { } & RouteComponentProps<any>) => {
  const daoAvatarAddress = props.match.params.daoAvatarAddress;
  const arc = getArc();

  const observable = combineLatest(
    arc.dao(daoAvatarAddress).state(), // DAO state
    arc.dao(daoAvatarAddress).schemes()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IDAOState, Scheme[]]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><Loading/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <AllSchemesContainer dao={state.data[0]} schemes={state.data[1]} />;
      }
    }
  }</Subscribe>;
};
