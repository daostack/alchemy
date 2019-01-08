import * as blockies from "ethereum-blockies-png";
import * as React from "react";

interface IProps {
  accountAddress: string;
  className?: string;
}

export default class AccountImage extends React.Component<IProps, null> {

  public render() {
    const { accountAddress, className } = this.props;

    const dataURL = blockies.createDataURL({
      seed: accountAddress,
    });

    return (<img src={dataURL} className={className} />);
  }
}
