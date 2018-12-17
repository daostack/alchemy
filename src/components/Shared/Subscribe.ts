// import React, { Component, Children, isValidElement } from 'react';
// import $$observable from 'symbol-observable';
// import { canUseDOM, canUseWorkers } from 'exenv';
//
// const ERROR_NOT_AN_OBSERVABLE = '<Subscribe> only accepts a single child, an Observable that conforms to observable[Symbol.observable]()';
//
// export default class Subscribe extends Component {
//   public subscription = null;
//
//   public state = {
//     isLoading: true,
//     data: null,
//     error: null,
//     complete: null,
//   };
//
//   public setupSubscription() {
//     this.subscription = this.props.observable.subscribe(
//       (next) => {
//         if (Array.isArray(next)) {
//           throw new TypeError('<Subscribe> streams cannot return arrays because of React limitations');
//         }
//         this.setState({
//           data: next,
//           isLoading: false,
//       })
//       },
//       (error) => { throw error },
//       () => { this.setState({complete: true})}
//     )
//   }
//
//   public teardownSubscription() {
//     if (this.subscription) {
//       this.subscription.unsubscribe();
//     }
//   }
//
//   public componentWillMount() {
//     this.setupSubscription();
//
//     // When server-side rendering only this lifecycle hook is used so
//     // componentWillUnmount() is NEVER run to dispose of subscription. It's also
//     // pointless to wait for any async values since they won't be rendered.
//     if (!canUseDOM && !canUseWorkers) {
//       this.teardownSubscription();
//     }
//   }
//
//   public componentWillReceiveProps(nextProps) {
//     if (nextProps.children !== this.props.children) {
//       this.teardownSubscription();
//       this.setupSubscription();
//     }
//   }
//
//   public componentWillUnmount() {
//     this.teardownSubscription();
//   }
//
//   public render() {
//     const { element } = this.state;
//     return (
//       isValidElement(element)
//         ? element
//         : {element} as span< / span >
//     );
//   }
// }
//
// // import { Component } from 'react';
// // import PropTypes from 'prop-types';
// //
// // class FirestoreDocument extends Component {
// //   public static propTypes = {
// //     path: PropTypes.string.isRequired,
// //     children: PropTypes.func,
// //     render: PropTypes.func,
// //   };
// //
// //   public static contextTypes = {
// //     firestoreDatabase: PropTypes.object.isRequired,
// //     firestoreCache: PropTypes.object.isRequired,
// //   };
// //
// //   public state = {
// //     isLoading: true,
// //     data: null,
// //     error: null,
// //     snapshot: null,
// //   };
// //
// //   public componentDidMount() {
// //     this.setupFirestoreListener(this.props);
// //   }
// //
// //   public componentWillUnmount() {
// //     this.handleUnsubscribe();
// //   }
// //
// //   public componentWillReceiveProps(nextProps) {
// //     if (nextProps.path !== this.props.path) {
// //       this.handleUnsubscribe();
// //
// //       this.setState({ isLoading: true }, () =>
// //         this.setupFirestoreListener(this.props),
// //       );
// //     }
// //   }
// //
// //   public handleUnsubscribe() {
// //     if (this.unsubscribe) {
// //       this.unsubscribe();
// //     }
// //   }
// //
// //   public setupFirestoreListener = (props) => {
// //     const { firestoreDatabase } = this.context;
// //     const { path } = props;
// //     const documentRef = firestoreDatabase.doc(path);
// //
// //     this.unsubscribe = documentRef.onSnapshot(
// //       this.handleOnSnapshotSuccess,
// //       this.handleOnSnapshotError,
// //     );
// //   };
// //
// //   public handleOnSnapshotError = (error) => {
// //     this.setState({
// //       isLoading: false,
// //       error,
// //       data: null,
// //       snapshot: null,
// //     });
// //   };
// //
// //   public handleOnSnapshotSuccess = (snapshot) => {
// //     if (snapshot) {
// //       const newState = {
// //         isLoading: false,
// //         error: null,
// //         snapshot,
// //       };
// //
// //       try {
// //         const documentData = snapshot.data();
// //
// //         newState.data = {
// //           id: snapshot.id,
// //           ...documentData,
// //         };
// //       } catch (error) {
// //         newState.error = error;
// //       }
// //
// //       this.setState(newState);
// //     }
// //   };
// //
// //   public render() {
// //     const { children, render } = this.props;
// //
// //     if (render) { return render(this.state); }
// //
// //     if (typeof children === 'function') { return children(this.state); }
// //
// //     return null;
// //   }
// // }
// //
// // export default FirestoreDocument;
