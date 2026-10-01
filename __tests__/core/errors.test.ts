import {
  AppError,
  ErrorCode,
  toAppError,
  toUserFacingError,
} from '../../src/core/errors';

describe('toAppError', () => {
  it('keeps AppError instances untouched', () => {
    const error = new AppError(ErrorCode.NOT_FOUND, 'nope');
    expect(toAppError(error)).toBe(error);
  });

  it.each([
    [new TypeError('Network request failed'), ErrorCode.NETWORK],
    [new SyntaxError('bad json'), ErrorCode.PARSE],
    [new Error('boom'), ErrorCode.UNKNOWN],
    ['a string', ErrorCode.UNKNOWN],
  ])('normalizes %p to %s', (input, code) => {
    expect(toAppError(input).code).toBe(code);
  });
});

describe('toUserFacingError', () => {
  it('provides Spanish copy for every error code', () => {
    Object.values(ErrorCode).forEach(code => {
      const message = toUserFacingError(new AppError(code, 'x'));
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.message.length).toBeGreaterThan(0);
    });
  });

  it('marks NOT_FOUND as non retryable and NETWORK as retryable', () => {
    expect(
      toUserFacingError(new AppError(ErrorCode.NOT_FOUND, 'x')).retryable,
    ).toBe(false);
    expect(
      toUserFacingError(new TypeError('Network request failed')).retryable,
    ).toBe(true);
  });
});
