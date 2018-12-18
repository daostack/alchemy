import * as React from "react";
import { Component, Children, isValidElement } from 'react';
import { Subscription, Observable } from 'rxjs'

interface IProps {
  observable: Observable<any>
  children: any
  // render: any | undefined
}

interface IInputProps {
  state: any
}
interface IState {
  isLoading: boolean
  data: object
  error: Error
  complete: boolean
}

export const withSubscription = <P extends IInputProps>(WrappedComponent: React.ComponentType<P>, observable: Observable<any>) =>
  class extends React.Component<P & IProps> {
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

      // ... and renders the wrapped component with the fresh data!
      // Notice that we pass through any additional props
      return <WrappedComponent state={this.state} {...this.props as IInputProps} />;
    }
}
