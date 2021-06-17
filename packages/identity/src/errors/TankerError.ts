export class TankerError extends Error {
  constructor(name: string = 'TankerError', message?: string) {
    super();
    this.name = name;

    if (typeof message === 'string') {
      this.message = message;
    }
  }

  override toString() {
    return `[Tanker] ${super.toString()}`;
  }
}
