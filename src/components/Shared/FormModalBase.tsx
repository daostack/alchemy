import * as React from "react";
import { saveModalFormEntries, importUrlValues, restoreModalFormEntries, exportUrl } from "lib/proposalUtils";
import { showNotification as ShowNotification, NotificationStatus } from "reducers/notifications";
/**
 * base class for modals that have a single form and they want to persist the form's values to sessionStorage,
 * hydrate the form from url querystring params, and copy form values to the clipboadrd.
 */
export abstract class FormModalBase<TProps,
  TState extends { [key: string]: any, tags?: Array<string> },
  TValues extends { [key: string]: any, tags?: Array<string> }> extends React.Component<TProps, TState> {

  /**
   * subclass must implement this and keep it up-to-date with the form values
   */
  protected abstract valuesToPersist: TValues;
  protected currentFormValues: TValues;

  /**
   * hydrates currentFormValues
   * @param props The subclass's props
   * @param formName The unique name of the form to be persisted
   * @param showNotification For notifying when the form values are copied to the clipbaord
   */
  constructor(
    props: TProps,
    private formName: string,
    private defaultValues: TValues,
    private showNotification: typeof ShowNotification) {

    super(props);

    this.currentFormValues = this.hydrateInitialFormValues();

    /**
     * a little sugar for tags that are at this writing in all of the forms using this base class
     * (though it they are not required for using this base class)
     */
    if (this.currentFormValues.tags) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      this.state = { tags: this.currentFormValues.tags } as TState;
    }
  }

  /**
   * pull form values from the url, if present, and sessionStorage, if present
   * @param defaults Input field names and their default values and types
   */
  private hydrateInitialFormValues = (): TValues => {
    /**
     * subclass must have used sendFormValuesToClipboard (or exportUrl) to make importUrlValues find anything
     */
    const values = importUrlValues<TValues>(this.defaultValues);
    return Object.assign(values, restoreModalFormEntries(this.formName));
  }

  protected sendFormValuesToClipboard = (): void => {
    exportUrl(this.valuesToPersist);
    this.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
  }

  protected resetToDefaults = (): void => {
    this.currentFormValues = Object.assign({}, this.defaultValues);
    if (this.defaultValues.tags) {
      this.setState({ tags: this.defaultValues.tags });
    }
  }

  public componentWillUnmount(): void {
    /**
     * save values to the clipboard.  Note this happens after Submit too.
     */
    saveModalFormEntries(this.formName, this.valuesToPersist);
  }
}
