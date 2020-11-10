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
 * RegEx to check if a string ends with []
 * @param {string} parameter
 * @returns {boolean} true if a string ends with [], otherwise returns false.
 */
export const isArrayParameter = (parameter: string): boolean => /(\[\d*])+$/.test(parameter);

/**
 * Given an array input type returns an input example string.
 * @param {string} type The input type (e.g. unit256[], bool[], address[], ...)
 * @returns {string} Input example string
 */
export const typeArrayPlaceholder = (type: string): string => {
  if (isAddressType(type)) {
    return "e.g.: ['0xACa94ef8bD5ffEE41947b4585a84BdA5a3d3DA6E','0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e']";
  }

  if (isBooleanType(type)) {
    return "e.g.: [true, false, false, true]";
  }

  if (isUintType(type)) {
    return "e.g.: [1000, 212, 320000022, 23]";
  }

  if (isIntType(type)) {
    return "e.g.: [1000, -212, 1232, -1]";
  }

  if (isByteType(type)) {
    return "e.g.: ['0xc00000000000000000000000000000000000', '0xc00000000000000000000000000000000001']";
  }

  return "e.g.: ['first value', 'second value', 'third value']";
};

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
 * Given an ABI method param type (address, byets32, unit256, bool, ...) and it's value, returns error message in case validation fails or no value provided.
 * @param {string} type
 * @param {string} value
 * @returns {undefined | string} undefined if there is no error, otherwise a string representing the error message.
 */
export const validateParamValue = (type: string, value: string): undefined | string => {
  if (isAddressType(type)) {
    if (!isAddress(value)) {
      return "Please enter a valid address";
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
