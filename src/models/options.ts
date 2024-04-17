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
  timeoutMs?: number;
}

export interface RequestOptions extends BasicRequestOptions {
  correlationId?: string;
  headers?: Headers;
  query?: Parameters;
}

export interface RetryOptions {
  retries: number;
  minTimeoutMs: number;
  maxTimeoutMs: number;
}

export const defaultClientOptions: ClientOptions = {
  correlationHeaderName: 'X-CorrelationID',
  minTimeoutMs: 75,
  maxTimeoutMs: 750,
  protocol: 'http',
  retries: 2,
  timeoutMs: 5000,
  verbose: false,
};

export const removeNullOptions = (options: ClientOptions): ClientOptions => {
  if (options == undefined) {
    return undefined;
  }

  Object.keys(options).forEach((key) => {
    const value = options[key];

    if (value === null || value === undefined) {
      delete options[key];
    }
  });
  return options;
};
