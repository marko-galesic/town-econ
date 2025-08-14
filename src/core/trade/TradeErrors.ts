/**
 * Base error class for trade validation errors.
 * Includes a path property to identify where the validation failed.
 */
export class TradeValidationError extends Error {
  constructor(
    // eslint-disable-next-line no-unused-vars
    public path: string,
    message: string,
  ) {
    super(message);
    this.name = 'TradeValidationError';
  }
}

/**
 * Error class for trade execution failures.
 * Used when a trade cannot be completed due to runtime conditions.
 */
export class TradeExecutionError extends Error {
  constructor(
    message: string,
    // eslint-disable-next-line no-unused-vars
    public override cause?: Error,
  ) {
    super(message);
    this.name = 'TradeExecutionError';
  }
}
