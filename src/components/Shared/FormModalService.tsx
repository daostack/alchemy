import { saveModalFormEntries, importUrlValues, restoreModalFormEntries, exportUrl } from "lib/proposalUtils";
import { showNotification as ShowNotification, NotificationStatus } from "reducers/notifications";

export interface IFormModalService<TValues extends { [key: string]: any, tags?: Array<string> }> {
  sendFormValuesToClipboard: () => void,
  resetFormToDefaults: (resetForm: (newProps?: any) => void) => () => void,
  saveCurrentValues: () => void,
}

/**
 * service for modals that have a single form and they want to persist and hydrate the form's values in sessionStorage,
 * hydrate the form from url querystring params, or copy to the clipboard the form values as a url.
 */
class FormModalService<TValues> implements IFormModalService<TValues> {
  /**
   * hydrates currentFormValues
   * @param formName The unique name of the form to be persisted
   * @param defaultValues default form values to use initially and when resetting
   * @param valuesToPersist Provides values that should be sent to the url in the clipboard and to sessionStorage
   * @param updateCurrentValues The form should be updated with these values
   * @param showNotification Optional, for notifying when the form values have been copied to the clipbaord
   */
  constructor(
    public formName: string,
    public defaultValues: TValues,
    public valuesToPersist: () => TValues,
    public updateCurrentValues: (formValues: TValues, firstTime: boolean) => void,
    public showNotification?: typeof ShowNotification) {

    this.updateCurrentValues(this.hydrateInitialFormValues(), true);
  }

  /**
   * pull form values from the url, if present, and sessionStorage, if present
   * @param defaults Input field names and their default values and types
   */
  private hydrateInitialFormValues = (): TValues => {
    /**
     * subclass must have used sendFormValuesToClipboard (or exportUrl) to make importUrlValues find anything
     */
    const values = importUrlValues(this.defaultValues);
    return Object.assign(values, restoreModalFormEntries(this.formName));
  }

  public sendFormValuesToClipboard = (): void => {
    exportUrl(this.valuesToPersist());
    if (this.showNotification) {
      this.showNotification(NotificationStatus.Success, "Exportable url is now in clipboard :)");
    }
  }

  /**
   * this should be passed to ResetFormButton
   * @param resetForm the function given by Formik
   */
  public resetFormToDefaults = (resetForm: (newProps?: any) => void) => (): void => {
    resetForm(this.defaultValues);
    this.updateCurrentValues(Object.assign({}, this.defaultValues), false);
  }

  /**
   * save values to sessionStorage
   */
  public saveCurrentValues(): void {
    saveModalFormEntries(this.formName, this.valuesToPersist());
  }
}

/**
 * Returns object that implements IFormModalService<TValues>
 * @param formName
 * @param defaultValues
 * @param valuesToPersist
 * @param updateCurrentValues
 * @param showNotification
 */
export const CreateFormModalService = <TValues extends { [key: string]: any, tags?: Array<string> }>(
  formName: string,
  defaultValues: TValues,
  valuesToPersist: () => TValues,
  updateCurrentValues: (formValues: TValues, firstTime: boolean) => void,
  showNotification?: typeof ShowNotification
): IFormModalService<TValues> => {

  return new FormModalService(formName, defaultValues, valuesToPersist, updateCurrentValues, showNotification);
};
