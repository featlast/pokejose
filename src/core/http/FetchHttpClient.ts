import { AppError, ErrorCode, toAppError } from '../errors';
import type { HttpClient } from './HttpClient.interface';

type FetchFn = typeof fetch;

type FetchHttpClientOptions = {
  baseUrl: string;
  timeoutMs: number;
  fetchFn?: FetchFn;
};

const statusToErrorCode = (status: number): ErrorCode => {
  if (status === 404) {
    return ErrorCode.NOT_FOUND;
  }
  if (status >= 500) {
    return ErrorCode.SERVER;
  }
  return ErrorCode.UNKNOWN;
};

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: FetchFn;

  constructor({ baseUrl, timeoutMs, fetchFn }: FetchHttpClientOptions) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
    this.fetchFn = fetchFn ?? fetch;
  }

  async get<TResponse>(path: string): Promise<TResponse> {
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await this.fetchFn(this.buildUrl(path), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new AppError(
          statusToErrorCode(response.status),
          `GET ${path} failed with status ${response.status}`,
          { status: response.status },
        );
      }

      return (await response.json()) as TResponse;
    } catch (error) {
      if (timedOut) {
        throw new AppError(
          ErrorCode.TIMEOUT,
          `GET ${path} timed out after ${this.timeoutMs}ms`,
          { cause: error },
        );
      }
      throw toAppError(error);
    } finally {
      clearTimeout(timer);
    }
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//.test(path)) {
      return path;
    }
    return `${this.baseUrl}/${path.replace(/^\/+/, '')}`;
  }
}
