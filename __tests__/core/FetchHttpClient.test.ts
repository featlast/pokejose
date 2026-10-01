import { AppError, ErrorCode } from '../../src/core/errors';
import { FetchHttpClient } from '../../src/core/http/FetchHttpClient';

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);

const createClient = (fetchFn: jest.Mock, timeoutMs = 1000) =>
  new FetchHttpClient({
    baseUrl: 'https://api.test/v2/',
    timeoutMs,
    fetchFn: fetchFn as unknown as typeof fetch,
  });

describe('FetchHttpClient', () => {
  it('joins base url and path and returns parsed JSON', async () => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse({ ok: 1 }));

    await expect(createClient(fetchFn).get('/pokemon/1')).resolves.toEqual({
      ok: 1,
    });
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.test/v2/pokemon/1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it.each([
    [404, ErrorCode.NOT_FOUND],
    [500, ErrorCode.SERVER],
    [503, ErrorCode.SERVER],
    [429, ErrorCode.UNKNOWN],
  ])('maps HTTP %i to %s', async (status, code) => {
    const fetchFn = jest.fn().mockResolvedValue(jsonResponse({}, status));

    await expect(createClient(fetchFn).get('x')).rejects.toMatchObject({
      code,
      status,
    });
  });

  it('maps a fetch TypeError (offline) to NETWORK', async () => {
    const fetchFn = jest
      .fn()
      .mockRejectedValue(new TypeError('Network request failed'));

    await expect(createClient(fetchFn).get('x')).rejects.toMatchObject({
      code: ErrorCode.NETWORK,
    });
  });

  it('maps invalid JSON to PARSE', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(createClient(fetchFn).get('x')).rejects.toMatchObject({
      code: ErrorCode.PARSE,
    });
  });

  it('aborts and maps to TIMEOUT when the server does not answer in time', async () => {
    jest.useFakeTimers();
    const fetchFn = jest.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new Error('Aborted')),
          );
        }),
    );

    const request = createClient(fetchFn, 50).get('slow');
    jest.advanceTimersByTime(51);

    const error = await request.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect((error as AppError).code).toBe(ErrorCode.TIMEOUT);
    jest.useRealTimers();
  });
});
