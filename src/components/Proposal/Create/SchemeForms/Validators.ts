import { isHexStrict } from "web3-utils";
import { isAddress } from "lib/util";

/**
 * Given a value returns error message in case value is less than 0 or no value provided
 * @param {any} value
 * @returns {undefined | string} undefined if there is no error, otherwise a "Required" string.
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const requireValue = (value: any): string => {
  let error;
  if (value === "") {
    error = "Required";
  } else if (value < 0) {
    error = "Please enter a non-negative value";
  }
  return error;
};

/**
 * Given ABI method param type (address, byets32, unit256, ...) and it's value, returns error message in case validation fails or no value provided.
 * This function is suitable to work with Formik validations.
 * @param {string} type
 * @param {string} value
 * @returns {undefined | string} undefined if there is no error, otherwise a string representing the error message.
 */
export const validateParam = (type: string, value: string): string => {
  let error;
  if (!value && type !== "bool") {
    error = "Required";
  }
  else {
    switch (true) {
      case type.includes("address"):
        if (!isAddress(value)) {
          error = "Please enter a valid address";
        }
        break;
      case type.includes("byte"):
        if (!isHexStrict(value)) {
          error = "Must be an hex value";
        }
        break;
      case type.includes("uint"):
        if (/^\d+$/.test(value) === false) {
          error = "Must contain only digits";
        }
        break;
    }
  }
  return error;
};
