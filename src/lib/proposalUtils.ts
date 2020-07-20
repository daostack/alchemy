import { copyToClipboard } from "./util";
import moment = require("moment-timezone");

const cloneDeep = require("clone-deep");

export function importUrlValues<TValues>(defaultValues: TValues): TValues {
  const { search } = window.location;
  const params = new URLSearchParams(search);
  const initialFormValues: any = cloneDeep([defaultValues])[0];
  for (const prop in defaultValues) {
    const paramValue = params.get(prop);
    if (paramValue) {
      switch (typeof defaultValues[prop]) {
        case "string":
          initialFormValues[prop] = String(paramValue);
          break;
        case "number":
          initialFormValues[prop] = Number(paramValue);
          break;
        case "boolean":
          initialFormValues[prop] = Boolean(paramValue);
          break;
        case "bigint":
          initialFormValues[prop] = BigInt(paramValue);
          break;
        case "object":
          if (moment.isMoment(defaultValues[prop])) {
            initialFormValues[prop] = moment(paramValue);
          } else {
            initialFormValues[prop] = JSON.parse(paramValue);
          }
          break;
        case "undefined":
        case "function":
        case "symbol":
          throw Error(`Unsupported default value ${defaultValues[prop]}`);
      }
    }
  }

  return initialFormValues;
}

export const exportUrl = (values: unknown): void => {
  const setQueryString = (key: keyof typeof values): string => {
    if (values[key] === undefined) {
      return "";
    }
    if (typeof values[key] === "object") {
      if (moment.isMoment(values[key])) {
        return `${key}=${(values[key] as moment.Moment).toString()}`;
      } else {
        return `${key}=${JSON.stringify(values[key])}`;
      }
    }
    return `${key}=${values[key]}`;
  };

  const queryString = Object.keys(values)
    .map(setQueryString)
    .join("&");
  const { origin, pathname } = window.location;
  const url = `${origin}${pathname}?${queryString}`;
  copyToClipboard(url);
};

function formValuesKey(name: string): string { return `formValues_${name}`; }

export function saveModalFormEntries(name: string, values: object): void {
  try {
    const json = JSON.stringify(values);
    sessionStorage.setItem(formValuesKey(name), json);
  }
  // eslint-disable-next-line no-empty
  catch {}
}

export function restoreModalFormEntries(name: string): object {
  const valuesString = sessionStorage.getItem(formValuesKey(name));
  if (valuesString) {
    sessionStorage.removeItem(formValuesKey(name));
    try {
      const values = JSON.parse(valuesString);

      const processValue = (key: string): void => {
        const value = values[key];
        // Moment interprets something like "100" as a date
        if (typeof value === "string" && isNaN(value as any)) {
          const date = moment(value);
          if (date?.isValid()) {
            values[key] = date;
          }
        }
      };
      /**
       * convert ISO date/time strings to Moment object
       */
      Object.keys(values).map(processValue);
      return values;
    }
    // eslint-disable-next-line no-empty
    catch { }
  }

  return {};
}
