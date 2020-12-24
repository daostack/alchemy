import { createDataURL } from "ethereum-blockies-png";
import * as React from "react";
import { IProfileState } from "@store/profiles/profilesReducer";

import * as css from "./Account.scss";

interface IProps {
  accountAddress: string;
  profile?: IProfileState;
  width: number;
}

export default class AccountImage extends React.Component<IProps, null> {

  public render(): RenderOutput {
    const { accountAddress, profile, width } = this.props;

    let url;
    if (profile && profile.image && profile.image[0] && profile.image[0].contentUrl) {
      url = "https://ipfs.infura.io/ipfs/" + profile.image[0].contentUrl["/"];
    }
    if (!url) {
      url = createDataURL({
        seed: accountAddress,
      });
    }

    return (<img src={url} className={css.accountImage} width={width} />);
  }
}
