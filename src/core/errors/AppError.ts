import { ErrorCode } from './ErrorCode.enum';

/**
 * Single error type that crosses layer boundaries. Anything thrown below the
 * presentation layer is normalized into an AppError via `toAppError`.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status?: number;
  readonly cause?: unknown;

  constructor(
    code: ErrorCode,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = options.status;
    this.cause = options.cause;
  }
}

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;

export const toAppError = (error: unknown): AppError => {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof SyntaxError) {
    return new AppError(ErrorCode.PARSE, error.message, { cause: error });
  }
  // fetch rejects with a TypeError when the device is offline or DNS fails.
  if (error instanceof TypeError) {
    return new AppError(ErrorCode.NETWORK, error.message, { cause: error });
  }
  const message = error instanceof Error ? error.message : String(error);
  return new AppError(ErrorCode.UNKNOWN, message, { cause: error });
};
