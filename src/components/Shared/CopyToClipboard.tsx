import * as React from "react";
import { NotificationStatus, showNotification } from "@store/notifications/notifications.reducer";
import * as css from "./CopyToClipboard.scss";
import { connect } from "react-redux";
import { copyToClipboard } from "lib/util";
import Tooltip from "rc-tooltip";

interface IDispatchProps {
  showNotification: typeof showNotification;
}

const mapDispatchToProps = {
  showNotification,
};

export enum IconColor {
  Default="blue",
  Black="black",
  Blue = Default,
}

interface IExternalProps {
  value: string;
  color?: IconColor;
  tooltipPlacement?: string;
}

type IProps = IExternalProps & IDispatchProps;

class CopyToClipboard extends React.Component<IProps, null> {

  private iconPath: string;
  private tooltipPlacement: string;
  private color: IconColor;

  private handleCopy = (message: string) => (): void => {
    const { showNotification } = this.props;
    copyToClipboard(message);
    showNotification(NotificationStatus.Success, "Copied to clipboard!");
  }

  constructor(props: IProps) {
    super(props);

    // these are immutable until needed otherwise, to optimize rendering
    this.tooltipPlacement = this.props.tooltipPlacement ?? "top";
    this.color = this.props.color ?? IconColor.Default;

    let imageFileName: string;

    switch (this.color) {
      case IconColor.Blue:
        imageFileName = "Copy-blue.svg";
        break;
      case IconColor.Black:
      default:
        imageFileName = "Copy-black.svg";
        break;
    }

    this.iconPath = `/assets/images/Icon/${imageFileName}`;
  }

  public render(): RenderOutput {
    return this.props.value ?
      (
        <Tooltip
          placement={this.tooltipPlacement}
          trigger={["hover"]}
          overlay={"Copy to clipboard"}
        >
          <img
            className={`${css.copyToClipboard} ${css[this.color]}`}
            onClick={this.handleCopy(this.props.value)}
            src={this.iconPath} />
        </Tooltip>
      )
      : "";
  }
}

export default connect(null, mapDispatchToProps)(CopyToClipboard);
