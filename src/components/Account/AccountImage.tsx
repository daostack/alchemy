import * as blockies from "ethereum-blockies-png";
import * as React from "react";
import { IProfileState } from "reducers/profilesReducer";

interface IProps {
  accountAddress: string;
  className?: string;
  profile?: IProfileState;
}

export default class AccountImage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { accountAddress, className, profile } = this.props;

    let url;
    if (profile && profile.image && profile.image[0] && profile.image[0].contentUrl) {
      url = "https://ipfs.infura.io/ipfs/" + profile.image[0].contentUrl["/"];
    }
    if (!url) {
      url = blockies.createDataURL({
        seed: accountAddress,
      });
    }

    return (<img src={url} className={className} />);
  }
}
