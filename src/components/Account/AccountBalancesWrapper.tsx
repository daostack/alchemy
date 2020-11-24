import * as React from "react";
import AccountBalances from "./AccountBalances";
import { getArcByDAOAddress, getNetworkByDAOAddress, Networks } from "lib/util";
import { getArcs } from "arc";
import { IDAOState } from "@daostack/arc.js";

interface IProps {
  dao: IDAOState;
  currentAccountAddress: string;
}

const AccountBalancesWrapper = (props: IProps) => {
  const { dao, currentAccountAddress } = props;
  let network: Networks;
  const accountBalances = [] as any;
  if (!dao){
    const arcs = getArcs();
    for (const net in arcs) {
      accountBalances.push(<AccountBalances key={net} dao={null} arc={arcs[net]} network={net as Networks} address={currentAccountAddress} />);
    }
  } else {
    network = getNetworkByDAOAddress(dao.address);
    accountBalances.push(<AccountBalances dao={dao} arc={getArcByDAOAddress(dao.address)} network={network} address={currentAccountAddress} />);
  }
  return accountBalances;
};

export default AccountBalancesWrapper;
