import { copyToClipboard } from "./util";

// TODO Need to use something like lodash for deep cloning.
export function getInitialFormValues<Values>(defaultValues: Values) {
  const { search } = window.location;
  const params = new URLSearchParams(search);

  // Warning, seem comment 1. below
  const initialFormValues: any = { ...defaultValues };
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
          initialFormValues[prop] = JSON.parse(paramValue);
          break;
        case "undefined":
        case "function":
        case "symbol":
          throw Error(`Unsupported default value ${defaultValues[prop]}`);
      }
    }
  }
  return initialFormValues;

  // 1. Warning, this is not a deep clone, only shallow.
  // Will be problematic if Values has a nested object,
  // as it will get overwritten. Use something like lodash
  // to do a deep clone here.
}

export const exportFormValues = (values: any, tags: string[]) => {
  const queryString = Object.keys(values).map(key => key + "=" + values[key]).join("&");
  const { origin, pathname } = window.location;
  const url = origin + pathname + "?" + queryString + "&tags=" + JSON.stringify(tags);
  copyToClipboard(url);
};
