export class LocalStorageService {

  /**
   * Returns the number of key/value pairs currently present in the list associated with the
   * scope.
   */
  public static count(session: boolean = true): number {
    this.ensure();
    return session ? sessionStorage.length : localStorage.length;
  }

  /**
   * Empties the list associated with the scope of all key/value pairs, if there are any.
   */
  public static clear(session: boolean = true): void {
    this.ensure();
    session ? sessionStorage.clear() : localStorage.clear();
  }
  /**
   * value = storage[key]
   */
  public static getItem(key: string, session: boolean = true): string | null {
    this.ensure();
    return session ? sessionStorage.getItem(key) : localStorage.getItem(key);
  }
  /**
   * Returns the name of the nth key in the list, or null if n is greater
   * than or equal to the number of key/value pairs in the scope.
   */
  public static key(index: number, session: boolean = true): string | null {
    this.ensure();
    return session ? sessionStorage.key(index) : localStorage.key(index);
  }
  /**
   * delete storage[key]
   */
  public static removeItem(key: string, session: boolean = true): void {
    this.ensure();
    session ? sessionStorage.removeItem(key) : localStorage.removeItem(key);
  }
  /**
   * storage[key] = value
   */
  public static setItem(key: string, value: string, session: boolean = true): void {
    this.ensure();
    session ? sessionStorage.setItem(key, value) : localStorage.setItem(key, value);
  }

  private static ensure(): void {
    if (typeof (Storage) === "undefined") {
      throw new Error("storage is not available");
    }
  }
}
