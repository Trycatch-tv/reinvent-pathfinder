export class AwsEventsError extends Error {
  public readonly statusCode?: number;
  public readonly isRetryable: boolean;

  constructor(message: string, statusCode?: number, isRetryable = false) {
    super(message);
    this.name = 'AwsEventsError';
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}

export class AwsEventsThrottlingError extends AwsEventsError {
  public readonly retryAfterSeconds?: number;

  constructor(message = 'Rate limit exceeded (429 Throttling)', retryAfterSeconds?: number) {
    super(message, 429, true);
    this.name = 'AwsEventsThrottlingError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AwsEventsNotFoundError extends AwsEventsError {
  constructor(message = 'Resource not found (404)') {
    super(message, 404, false);
    this.name = 'AwsEventsNotFoundError';
  }
}
