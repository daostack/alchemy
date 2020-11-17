import * as BN from "bn.js";
import * as moment from "moment-timezone";

export enum SortOrder {
  ASC = 1,
  DESC = -1,
}

/**
 * callbacks for javascript array.sort()
 */
export class SortService {

  public static evaluateString(a: string, b: string, sortOrder: SortOrder = SortOrder.ASC) {
    if (!a && !b) { return 0; }

    if (!a) { return -sortOrder; }
    if (!b) { return sortOrder; }

    a = a.toLowerCase();
    b = b.toLowerCase();

    return a.localeCompare(b) * sortOrder;
  }

  public static evaluateBigNumber(a: BN, b: BN, sortOrder: SortOrder = SortOrder.ASC) {
    const isDefinedA = SortService.isDefined(a);
    const isDefinedB = SortService.isDefined(b);

    if (!isDefinedA && !isDefinedB) { return 0; }

    if (!isDefinedA) { return -sortOrder; }
    if (!isDefinedB) { return sortOrder; }

    const diff = a.sub(b);

    return ((diff.gtn(0) ? 1 : (diff.ltn(0) ? -1 : 0))) * sortOrder;
  }

  public static evaluateNumber(a: number, b: number, sortOrder: SortOrder = SortOrder.ASC) {
    const isDefinedA = SortService.isDefined(a);
    const isDefinedB = SortService.isDefined(b);

    if (!isDefinedA && !isDefinedB) { return 0; }

    if (!isDefinedA) { return -sortOrder; }
    if (!isDefinedB) { return sortOrder; }

    return (a - b) * sortOrder;
  }

  public static evaluateDateTime(valueA: Date|moment.Moment, valueB: Date|moment.Moment, sortOrder: SortOrder = SortOrder.ASC) {

    const isDefinedA = SortService.isDefined(valueA);
    const isDefinedB = SortService.isDefined(valueB);

    if (!isDefinedA && !isDefinedB) { return 0; }

    if (!isDefinedA) { return -sortOrder; }
    if (!isDefinedB) { return sortOrder; }

    const a = valueA.valueOf();
    const b = valueB.valueOf();

    if (!a && !b) { return 0; }

    if (!a) { return -sortOrder; }
    if (!b) { return sortOrder; }

    return (a - b) * sortOrder;
  }

  public static evaluateDateTimeString(a: string, b: string, sortOrder: SortOrder = SortOrder.ASC) {
    if (!a && !b) { return 0; }

    if (!a) { return -sortOrder; }
    if (!b) { return sortOrder; }

    SortService.evaluateDateTime(new Date(a), new Date(b), sortOrder);
  }

  private static isDefined(v: any): boolean {
    return typeof v !== "undefined";
  }
}
