/**
 * Base error class for trade validation errors.
 * Includes a path property to identify where the validation failed.
 */
export class TradeValidationError extends Error {
  constructor(
    public path: string,
    message: string,
  ) {
    // eslint-disable-line no-unused-vars
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
    public override cause?: Error,
  ) {
    // eslint-disable-line no-unused-vars
    super(message);
    this.name = 'TradeExecutionError';
  }
}
