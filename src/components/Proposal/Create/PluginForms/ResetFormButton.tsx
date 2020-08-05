import * as React from "react";
import * as css from "./ResetFormButton.scss";
import i18next from "i18next";

export default class ResetFormButton extends React.Component<{
  resetToDefaults: () => void,
  isSubmitting: boolean,
}, null> {

  private handleClick = (): void => {
    /**
     * timeout for the case where clicking the button causes a focus change
     * that triggers validation, which causes this operation not to work
     */
    setTimeout(() => {
      this.props.resetToDefaults();
    }, 0);
  };

  public render(): RenderOutput {
    return (
      <button
        className={css.resetFormButton}
        type="button"
        disabled={this.props.isSubmitting}
        onClick={this.handleClick}>
        <img src="/assets/images/Icon/eraser.svg"/>{i18next.t("Clear entries")}
      </button>
    );
  }
}
