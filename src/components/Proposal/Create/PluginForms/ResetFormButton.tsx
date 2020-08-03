import * as React from "react";
import * as css from "./ResetFormButton.scss";

export default (props: {
  resetToDefaults: () => void,
  isSubmitting: boolean,
}): JSX.Element => {
  return (
    <button className={css.resetFormButton} type="button" disabled={props.isSubmitting}
    // eslint-disable-next-line react/jsx-no-bind
      onClick={(): void => {
      /**
       * timeout for the case where clicking the button causes a focus change
       * that triggers validation, which causes this operation not to work
       */
        setTimeout(() => {
          props.resetToDefaults();
        }, 0);
      }}>
    Clear entries
    </button>
  );
};
