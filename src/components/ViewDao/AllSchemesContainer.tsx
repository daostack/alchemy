import { IDAOState, Queue } from "@daostack/client";
import { getArc } from "arc";
import Subscribe, { IObservableState } from "components/Shared/Subscribe";
import * as React from "react";
import { BreadcrumbsItem } from "react-breadcrumbs-dynamic";
import { RouteComponentProps } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { combineLatest } from "rxjs";
import SchemeCardContainer from "./SchemeCardContainer";
import * as css from "./AllSchemes.scss";

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
  queues: Queue[];
}

const AllSchemesContainer = (props: IProps) => {
  const { dao, queues } = props;

  const schemeCardsHTML = (
    <TransitionGroup>
      { queues.map((queue: Queue) => (
        <Fade key={"scheme " + queue.name}>
          <SchemeCardContainer dao={dao} scheme={queue} />
        </Fade>
      ))}
    </TransitionGroup>
  );

  return (
    <div className={css.wrapper}>
      <BreadcrumbsItem to={"/dao/" + dao.address}>{dao.name}</BreadcrumbsItem>

      <h1>All Schemes</h1>
      { queues.length === 0
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
    arc.dao(daoAvatarAddress).queues()
  );
  return <Subscribe observable={observable}>{
    (state: IObservableState<[IDAOState, Queue[]]>): any => {
      if (state.isLoading) {
        return  <div className={css.loading}><img src="/assets/images/Icon/Loading-black.svg"/></div>;
      } else if (state.error) {
        throw state.error;
      } else {
        return <AllSchemesContainer dao={state.data[0]} queues={state.data[1]} />;
      }
    }
  }</Subscribe>;
};
