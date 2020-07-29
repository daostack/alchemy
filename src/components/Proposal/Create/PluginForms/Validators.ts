import { isAddress } from "../../../../lib/util";

const constants = {
  REQUIRED: "Required",
  VALID_NUM: "Must be a valid number",
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  MIN_THRESHOLD: 1000,
  MAX_THRESHOLD: 16000,
  VAILD_RANGE: "Must be a number between",
  VALID_PERCENTAGE: "Percentage must be a number between",
  VALID_THRESHOLD: "Threshold must be a number between",
  GREATER_THAN: "Must be a number greater than",
  GREATER_OR_EQUAL: "Must be a number greater than or equal to",
  SMALLER_OR_EQUAL: "Must be a number smaller than or equal to",
  VALID_DATE: "Must be a future date",
  VALID_ADDRESS: "Must be a valid address",
};

const positiveNumber = (value: number): boolean => {
  const reg = new RegExp(/^\d+$/); // including zero
  return reg.test(value.toString());
};

export const validRange = (value: number, min: number, max: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value) || value < min || value > max) {
    error = `${constants.VAILD_RANGE} ${min} and ${max}`;
  }
  return error;
};

export const validNumber = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  }
  else if (!positiveNumber(value)){
    error = constants.VALID_NUM;
  }
  return error;
};

export const validPercentage = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value) || value < constants.MIN_PERCENTAGE || value > constants.MAX_PERCENTAGE) {
    error = `${constants.VALID_PERCENTAGE} ${constants.MIN_PERCENTAGE} and ${constants.MAX_PERCENTAGE}`;
  }
  return error;
};

export const thresholdConst = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value) || (value < constants.MIN_THRESHOLD || value > constants.MAX_THRESHOLD)) {
    error = `${constants.VALID_THRESHOLD} ${constants.MIN_THRESHOLD} and ${constants.MAX_THRESHOLD}`;
  }
  return error;
};

export const greaterThan = (value: number, limit: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value) || value < limit || Number(value) === 0) {
    error = `${constants.GREATER_THAN} ${limit}`;
  }
  return error;
};

export const boostedVotePeriodLimit = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value)) {
    error = `${constants.VALID_NUM}`;
  } else if (Number(value) < Number((document.getElementById("quietEndingPeriod") as HTMLInputElement).value)) {
    error = `${constants.GREATER_OR_EQUAL} Quiet Ending Period value`;
  }
  return error;
};

export const validQuietEndingPeriod = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!positiveNumber(value)) {
    error = `${constants.VALID_NUM}`;
  } else if (Number(value) > Number((document.getElementById("boostedVotePeriodLimit") as HTMLInputElement).value)) {
    error = `${constants.SMALLER_OR_EQUAL} Boosted Vote Period Limit value`;
  }
  return error;
};

export const futureTime = (value: number): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (new Date(value) < new Date()) {
    error = constants.VALID_DATE;
  }
  return error;
};

export const address = (value: number, allowNulls = false): string => {
  let error;
  if (!value) {
    error = constants.REQUIRED;
  } else if (!isAddress(value.toString(), allowNulls)) {
    error = constants.VALID_ADDRESS;
  }
  return error;
};
