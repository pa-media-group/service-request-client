export interface ClientOptions {
  correlationHeaderName?: string;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
  protocol?: string;
  retries?: number;
  timeoutMs?: number;
  verbose?: boolean;
}

export interface Headers {
  [key: string]: string;
}

export interface Parameters {
  [key: string]: string;
}

export interface BasicRequestOptions {
  protocol?: string;
  timeout?: number;
}

export interface RequestOptions extends BasicRequestOptions {
  correlationId?: string;
  headers?: Headers;
  query?: Parameters;
}

export interface RetryOptions {
  retries: number;
  minTimeout: number;
  maxTimeout: number;
}
