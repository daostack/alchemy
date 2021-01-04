import * as React from "react";
import * as css from "./LockRow.scss";
import { ICL4RLock } from "./Staking";

interface IProps {
  data: ICL4RLock;
}


const LockRow = (props: IProps) => {
  const { data } = props;

  return (
    <tr className={css.row}>
      <td>{data.period}</td>
      <td>{data.amount}</td>
      <td>{data.lockingTime}</td>
      <td>{data.redeemed}</td>
      <td>{data.released}</td>
    </tr>
  );
};

export default LockRow;
