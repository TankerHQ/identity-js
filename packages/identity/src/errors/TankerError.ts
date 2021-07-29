import { BaseError } from 'make-error';

export class TankerError extends BaseError {
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
