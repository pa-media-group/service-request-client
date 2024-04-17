import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';
import check from 'check-types';
import { v4 as uuidV4 } from 'uuid';

import {
  BasicRequestOptions,
  ClientOptions,
  RequestOptions,
  RetryOptions,
  defaultClientOptions,
  removeNullOptions,
} from '../models/options';
import { Logger, LoggerFactory } from '../utils/logger.factory';

const METHODS_ALLOWED = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'];

export abstract class AbstractRequestClient {
  readonly verbose: boolean;
  readonly correlationHeaderName: string;

  readonly request: BasicRequestOptions;
  readonly retry: RetryOptions;

  readonly logger: Logger;

  /**
   * Constructor.
   *
   * @param options client options that define the request client behaviour
   */
  protected constructor(options = {} as ClientOptions) {
    if (new.target === AbstractRequestClient) {
      throw new TypeError('Cannot construct AbstractRequestClient instances directly, please extend');
    }
    this.logger = LoggerFactory.create(this.constructor.name);

    const mergedOptions = { ...defaultClientOptions, ...removeNullOptions(options) };

    // Correlation and verbosity
    this.correlationHeaderName = mergedOptions.correlationHeaderName;
    this.verbose = mergedOptions.verbose;

    // HTTP request option defaults. Timeout can be  overridden by individual requests.
    this.request = {
      protocol: mergedOptions.protocol,
      timeoutMs: mergedOptions.timeoutMs,
    };

    // Retry
    this.retry = {
      retries: mergedOptions.retries,
      minTimeoutMs: mergedOptions.minTimeoutMs,
      maxTimeoutMs: mergedOptions.maxTimeoutMs,
    };
  }

  /**
   * Perform a GET request.
   *
   * @param uri the request URI
   * @param options request options
   *
   * @returns {Promise}
   */
  async get(uri: string, options: RequestOptions): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('GET', uri, options, null);
  }

  /**
   * Perform an OPTIONS request.
   *
   * @param uri the request URI
   * @param options request options
   *
   * @returns {Promise}
   */
  async options(uri: string, options = {} as RequestOptions): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('OPTIONS', uri, options, null);
  }

  /**
   * Perform a POST request.
   *
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   * @returns {Promise}
   */
  async post(uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('POST', uri, options, body);
  }

  /**
   * Perform a PUT request.
   *
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   *
   * @returns {Promise}
   */
  async put(uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('PUT', uri, options, body);
  }

  /**
   * Perform a DELETE request.
   *
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   *
   * @returns {Promise}
   */
  async delete(uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('DELETE', uri, options, body);
  }

  /**
   * Perform a HEAD request.
   *
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   *
   * @returns {Promise}
   */
  async head(uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('HEAD', uri, options, body);
  }

  /**
   * Perform a PATCH request.
   *
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   *
   * @returns {Promise}
   */
  async patch(uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('PATCH', uri, options, body);
  }

  /**
   *
   * @param method the request method, e.g. GET, POST, PUT, DELETE
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   *
   * @returns {Promise}
   */
  async method(method: string, uri: string, options = {} as RequestOptions, body: unknown): Promise<AxiosResponse> {
    check.assert.string(method, 'method [string] must be provided');
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    if (!method) {
      throw new Error('HTTP method must be defined');
    }

    if (METHODS_ALLOWED.indexOf(method.toUpperCase()) == -1) {
      throw new Error('Unrecognised method:' + method);
    }
    return this._executeRequest(method, uri, options, body);
  }

  /**
   * Implementations must provide a way to resolve the service base URL.
   *
   * @returns {string} the base URL
   * @private
   */
  abstract resolveServiceBaseURL(): Promise<string>;

  /**
   * @param method the request method, e.g. GET, POST, PUT, DELETE
   * @param uri the request URI
   * @param options request options
   * @param body the request body
   * @private
   */
  async _executeRequest(
    method: string,
    uri: string,
    options = {} as RequestOptions,
    body?: unknown,
  ): Promise<AxiosResponse> {
    // Extract options...
    const { correlationId, query, headers = {}, timeoutMs } = options;

    headers[this.correlationHeaderName] = correlationId ?? uuidV4();

    if (!uri) {
      uri = '';
    }

    // Inherit
    let baseUrl: string;

    try {
      baseUrl = await this.resolveServiceBaseURL();
    } catch (err) {
      throw new Error('unable to resolve service location');
    }
    const url = [baseUrl, uri].join('/');

    if (this.verbose) {
      this.logger.info({ method, url, headers, query }, 'performing request');
    }

    const instance: AxiosInstance = axios.create();
    const { retries, minTimeoutMs, maxTimeoutMs } = this.retry;

    axiosRetry(instance, {
      retries, // number of retries
      retryDelay: (retryCount) => {
        this.logger.warn(
          { method: method, url: url, headers: headers, query: query, attempt: retryCount },
          'retry request',
        );

        const delay = Math.max(minTimeoutMs, retryCount * 200);
        return Math.min(maxTimeoutMs, delay); // time interval between retries
      },
      retryCondition: (error) => {
        this.logger.error(error, 'error request');
        return error.response.status === 429 || error.response.status > 499;
      },
    });

    const axiosRequestConfig: AxiosRequestConfig<unknown> = {
      method,
      url,
      headers,
      data: body ?? {},
      params: query ?? {},
      timeout: timeoutMs ?? this.request.timeoutMs,
    };

    return instance
      .request(axiosRequestConfig)
      .then((res) => {
        if (this.verbose) {
          this.logger.info(
            { method: method, url: url, headers: headers, query: query },
            'request completed successfully',
          );
        }
        return res;
      })
      .catch((err) => {
        this.logger.error(
          { error: err, method: method, url: url, headers: headers, query: query },
          'request failed with an error',
        );
        throw err;
      });
  }
}
