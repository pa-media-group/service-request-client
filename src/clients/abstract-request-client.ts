import axios from 'axios';
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
   * @param options
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
   * @param uri
   * @param options
   * @returns {Promise}
   */
  async get(uri: string, options: RequestOptions): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('GET', uri, options, null);
  }

  /**
   * Perform an OPTIONS request.
   *
   * @param uri
   * @param options
   * @returns {Promise}
   */
  async options(uri: string, options = {} as RequestOptions): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('OPTIONS', uri, options, null);
  }

  /**
   * Perform a POST request.
   *
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async post(uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('POST', uri, options, body);
  }

  /**
   * Perform a PUT request.
   *
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async put(uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('PUT', uri, options, body);
  }

  /**
   * Perform a DELETE request.
   *
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async delete(uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('DELETE', uri, options, body);
  }

  /**
   * Perform a HEAD request.
   *
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async head(uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('HEAD', uri, options, body);
  }

  /**
   * Perform a PATCH request.
   *
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async patch(uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
    check.assert.string(uri, 'uri [string] must be provided');
    check.assert.maybe.object(options, 'options [object] must be provided');

    return this.method('PATCH', uri, options, body);
  }

  /**
   *
   * @param method
   * @param uri
   * @param options
   * @param body
   * @returns {Promise}
   */
  async method(method: string, uri: string, options = {} as RequestOptions, body: unknown): Promise<unknown> {
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
   *
   * @returns {string}
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async resolveServiceBaseURL(): Promise<string> {
    throw new Error('Should be overridden by subclass');
  }

  /**
   * @param method
   * @param uri
   * @param options
   * @param body
   * @private
   */
  async _executeRequest(method: string, uri: string, options = {} as RequestOptions, body?: unknown): Promise<unknown> {
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

    const instance = axios.create();
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

    return instance
      .request({
        method,
        url,
        headers,
        data: body ?? {},
        params: query ?? {},
        timeout: timeoutMs ?? this.request.timeoutMs,
      })
      .then((res) => {
        if (this.verbose) {
          this.logger.info(
            { method: method, url: url, headers: headers, query: query },
            'request completed successfully',
          );
        }
        return res.data;
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
