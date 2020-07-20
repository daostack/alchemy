import * as React from "react";
import { saveModalFormEntries, importUrlValues, restoreModalFormEntries, exportUrl } from "lib/proposalUtils";
/**
 * base class for modals that want to persist their values to localStorage and support loading from
 * querystring params in a url.
 */
export abstract class FormModalBase<TProps, TState> extends React.Component<TProps, TState> {
  /**
   * subclass must implement this and keep it up-to-date with the values that it wants to be persisted
   */
  protected abstract valuesToPersist: object;
  /**
   *
   * @param props The subclass's props
   * @param formName The unique name of the form to be persisted
   */
  constructor(props: TProps, private formName: string) {
    super(props);
  }

  protected hydrateInitialFormValues = <TDefaults, >(defaults: TDefaults): TDefaults => {
    /**
     * subclass must have used exportUrl to make importUrlValues work
     */
    const values = importUrlValues<TDefaults>(defaults);
    return Object.assign(values, restoreModalFormEntries(this.formName));
  }

  protected sendFormValuesToClipboard = (): void => {
    exportUrl(this.valuesToPersist);
  }

  public componentWillUnmount(): void {
    saveModalFormEntries(this.formName, this.valuesToPersist);
  }
}
