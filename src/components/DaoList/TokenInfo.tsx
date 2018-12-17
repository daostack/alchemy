// import { denormalize } from "normalizr";
// import * as React from "react";
// import { connect, Dispatch } from "react-redux";
// import { Link } from "react-router-dom";
//
// import * as arcActions from "actions/arcActions";
// import { IRootState } from "reducers";
// import { IDaoState } from "reducers/arcReducer";
//
// import * as schemas from "schemas";
//
// import * as css from "./DaoList.scss";
//
// interface IStateProps {
//   token: ITokenState,
//   address: string
// }
//
// const mapStateToProps = (state: IRootState, ownProps: any) => ({
//   token: state.arc.tokens[ownProps.address]
// });
//
// interface IDispatchProps {
//   getToken: typeof arcActions.getToken
// }
//
// const mapDispatchToProps = {
//   getToken: arcActions.getToken
// };
//
// type IProps = IStateProps & IDispatchProps;
//
// class DaoContainer extends React.Component<IProps, null> {
//
//   public subscription: any;
//
//   public async componentWillMount() {
//     this.subscription = this.props.getToken(this.props.address);
//   }
//
//   public componentWillUnmount() {
//     this.subscription.unsubscribe();
//   }
//
//   public render() {
//     const { address, token } = this.props
//
//     return  (
//           <div className={css.daoInfo}>Token: {token.name} ({token.symbol})</div>
//           <div className={css.daoInfo}>Num tokens: {Math.round(token.totalSupply).toLocaleString()}</div>
//     )
//   }
// }
//
// export default connect(mapStateToProps, mapDispatchToProps)(DaoContainer);
