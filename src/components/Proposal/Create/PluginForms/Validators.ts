import { isAddress } from '../../../../lib/util';

const constants = {
    REQUIRED: 'Required',
    VALID_NUM: 'Must be a valid number',
    MIN_PERCENTAGE: 50,
    MAX_PERCENTAGE: 100,
    MIN_THRESHOLD: 1000,
    MAX_THRESHOLD: 16000,
    VALID_PERCENTAGE: 'Percentage must be a number between',
    VALID_THRESHOLD: 'Threshold must be a number between',
    GREAT_OR_EQUAL: 'Must be a number greater than or equal to',
    VALID_DATE: 'Must be a future date',
    VALID_ADDRESS: 'Must be a valid address'
}

export const validNumber = (value: any) => {
    let error;
    if(!value){
        error = constants.REQUIRED;
    }
    else if (!positiveNumber(value))
        error = constants.VALID_NUM;
    return error;
}

export const validPercentage = (value: any) => {
    let error;
    if (!value) {
        error = constants.REQUIRED;
    } else if (!positiveNumber(value) || value < constants.MIN_PERCENTAGE || value > constants.MAX_PERCENTAGE) {
        error = `${constants.VALID_PERCENTAGE} ${constants.MIN_PERCENTAGE} and ${constants.MAX_PERCENTAGE}`;
    }
    return error;
}

export const thresholdConst = (value: any) => {
    let error;
    if (!value) {
        error = constants.REQUIRED;
    } else if (!positiveNumber(value) || (value < constants.MIN_THRESHOLD || value > constants.MAX_THRESHOLD)) {
        error = `${constants.VALID_THRESHOLD} ${constants.MIN_THRESHOLD} and ${constants.MAX_THRESHOLD}`;
    }
    return error;
}

export const greaterThanOrEqualTo = (value: any, limit: number) => {
    let error;
    if (!value) {
        error = constants.REQUIRED;
    } else if (!positiveNumber(value) || value < limit) {
        error = `${constants.GREAT_OR_EQUAL} ${limit}`;
    }
    return error;
}

export const futureTime = (value: any) => {
    let error;
    if (!value) {
        error = constants.REQUIRED;
    } else if (new Date(value) < new Date()) {
        error = constants.VALID_DATE;
    }
    return error;
}

export const address = (value: any) => {
    let error;
    if(!value){
        error = constants.REQUIRED;
    } else if(!isAddress(value)){
        error = constants.VALID_ADDRESS;
    }
    return error;
}


const positiveNumber = (value: any) => {
    const reg = new RegExp(/^\d+$/); // including zero
    return reg.test(value);
}
