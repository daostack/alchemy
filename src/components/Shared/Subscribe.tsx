import * as React from "react";
import { Component, Children, isValidElement } from 'react';
import { Subscription, Observable } from 'rxjs'

interface IProps {
  observable: Observable<any>
  children: any
  // render: any | undefined
}

interface IState {
  isLoading: boolean
  data: object
  error: Error
  complete: boolean
}

export default class Subscribe extends React.Component<IProps, IState> {
  public subscription: Subscription;

  public state: IState = {
    isLoading: true,
    data: null,
    error: null,
    complete: null,
  };

  public setupSubscription() {
    this.subscription = this.props.observable.subscribe(
      (next: object) => {
        // if (Array.isArray(next)) {
        //   throw new TypeError('<Subscribe> streams cannot return arrays because of React limitations');
        // }
        this.setState({
          data: next,
          isLoading: false,
      })
      },
      (error: Error) => { throw error },
      () => { this.setState({complete: true})}
    )
  }

  public teardownSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public componentWillMount() {
    this.setupSubscription();
  }

  public componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.children !== this.props.children) {
      this.teardownSubscription();
      this.setupSubscription();
    }
  }

  public componentWillUnmount() {
    this.teardownSubscription();
  }

  public render() {
    const { children } = this.props;

    // if (render) { return render(this.state); }

    if (typeof children === 'function') {
      return children(this.state)
    }

    const childrenWithProps = React.Children.map(children, (child) =>
      React.cloneElement(child, this.state)
    )

    return <div>{childrenWithProps}</div>
  }
}
