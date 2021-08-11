export class TankerError extends Error {
  constructor(name: string = 'TankerError', message?: string) {
    super();

    // Set the prototype explicitly.
    // See https://github.com/Microsoft/TypeScript-wiki/blob/main/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, TankerError.prototype);

    this.name = name;

    if (typeof message === 'string') {
      this.message = message;
    }
  }

  override toString() {
    return `[Tanker] ${super.toString()}`;
  }
}
