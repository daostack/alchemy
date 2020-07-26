import * as React from "react";
import { saveModalFormEntries, importUrlValues, restoreModalFormEntries, exportUrl } from "lib/proposalUtils";
import { showNotification as ShowNotification, NotificationStatus } from "reducers/notifications";
/**
 * base class for modals that have a single form and they want to persist the form's values to sessionStorage,
 * hydrate the form from url querystring params, and copy form values to the clipboadrd.
 */
export abstract class FormModalBase<TProps, TState> extends React.Component<TProps, TState> {

  /**
   * subclass must implement this and keep it up-to-date with the form values
   */
  protected abstract valuesToPersist: Record<string, unknown>;

  /**
   * @param props The subclass's props
   * @param formName The unique name of the form to be persisted
   * @param showNotification For notifying when the form values are copied to the clipbaord
   */
  constructor(props: TProps, private formName: string, private showNotification: typeof ShowNotification) {
    super(props);
  }

  /**
   * pull form values from the url, if present, and sessionStorage, if present
   * @param defaults Input field names and their default values and types
   */
  protected hydrateInitialFormValues = <TDefaults, >(defaults: TDefaults): TDefaults => {
    /**
     * subclass must have used sendFormValuesToClipboard (or exportUrl) to make importUrlValues work
     */
    const values = importUrlValues<TDefaults>(defaults);
    return Object.assign(values, restoreModalFormEntries(this.formName));
  }

  protected sendFormValuesToClipboard = (): void => {
    exportUrl(this.valuesToPersist);
    this.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  public componentWillUnmount(): void {
    /**
     * save values to the clipboard.  Note this happens after Submit too.
     */
    saveModalFormEntries(this.formName, this.valuesToPersist);
  }
}
