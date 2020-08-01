import * as React from "react";
import * as css from "./ResetFormButton.scss";

export default (props: {
  defaultValues: any,
  /**
   * this should restore default values
   */
  handleReset: () => void,
  isSubmitting: boolean,
  /**
   * this should reset the form to the default values
   */
  resetForm: (newProps?: any) => void,
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
          props.resetForm(props.defaultValues);
          props.handleReset();
        }, 0);
      }}>
    Clear entries
    </button>
  );
};
