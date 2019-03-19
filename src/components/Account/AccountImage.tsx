import * as blockies from "ethereum-blockies-png";
import * as React from "react";

interface IProps {
  accountAddress: string;
  avatarSize?: number;
  className?: string;
}

export default class AccountImage extends React.Component<IProps, null> {

  public render() {
    const { accountAddress, avatarSize, className } = this.props;

    const dataURL = blockies.createDataURL({
      seed: accountAddress,
    });
    
    return (<img src={dataURL} className={className} width={avatarSize} height={avatarSize}/>);
  }
}
