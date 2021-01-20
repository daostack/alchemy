import { isHexStrict } from "web3-utils";
import { isAddress } from "lib/util";

/**
 * Functions to check an input core type
 */
export const isAddressType = (type: string): boolean => type.indexOf("address") === 0;
export const isBooleanType = (type: string): boolean => type.indexOf("bool") === 0;
export const isStringType = (type: string): boolean => type.indexOf("string") === 0;
export const isUintType = (type: string): boolean => type.indexOf("uint") === 0;
export const isIntType = (type: string): boolean => type.indexOf("int") === 0;
export const isByteType = (type: string): boolean => type.indexOf("byte") === 0;

/**
 * RegEx to check if a string ends with or surrounded by []
 * @param {string} parameter
 * @returns {boolean} true if a string ends with [] or surround by [], otherwise returns false.
 */
export const isArrayParameter = (parameter: string): boolean => /(\[\d*])+$/.test(parameter) || /^\[.*\]$/.test(parameter);

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
    error = "Must be a non-negative value";
  }
  return error;
};

/**
 * Given an ABI method param type (address, byets32, unit256, bool, ...) and it's value, returns error message in case validation fails or no value provided.
 * @param {string} type
 * @param {string} value
 * @returns {undefined | string} undefined if there is no error, otherwise a string representing the error message.
 */
export const validateParamValue = (type: string, value: string): undefined | string => {
  if (isAddressType(type)) {
    if (!isAddress(value, true)) {
      return "Must be a valid address";
    }
  }

  if (isBooleanType(type)) {
    if (value !== "true" && value !== "false") {
      return "Must be 'true' or 'false'";
    }
  }

  if (isUintType(type)) {
    if (/^\d+$/.test(value) === false) {
      return "Must contain only positive digits";
    }
  }

  if (isIntType(type)) {
    if (!Number.isInteger(Number(value)) || value.includes(".")) {
      return "Must be an integer";
    }
  }

  if (isByteType(type)) {
    if (!isHexStrict(value)) {
      return "Must be an hex value";
    }
  }

  return undefined;
};

/**
 * Given an ABI method param type including array type (address, byets32, unit256, bool, bool[], ...) and it's value, returns error message in case validation fails or no value provided.
 * This function is suitable to work with Formik validations.
 * @param {string} type
 * @param {string} value
 * @returns {undefined | string} undefined if there is no error, otherwise a string representing the error message.
 */
export const validateParam = (type: string, value: string): undefined | string => {
  let error;
  if (!value) {
    return "Required";
  }

  if (isArrayParameter(type)) {
    try {
      const values = JSON.parse(value);
      if (!Array.isArray(values)) {
        return "Make sure to surround the value with []";
      } else {
        for (const value of values) {
          if (validateParamValue(type, value) !== undefined) {
            throw error;
          }
        }
      }
    } catch (e) {
      return "Invalid format";
    }
  }

  else return validateParamValue(type, value);
};
