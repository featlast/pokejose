export interface HttpClient {
  /** Performs a GET request and resolves with the parsed JSON body. Rejects with AppError. */
  get<TResponse>(path: string): Promise<TResponse>;
}
