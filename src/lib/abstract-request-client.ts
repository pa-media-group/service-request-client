import axios from 'axios';
import axiosRetry from 'axios-retry';
import check = require('check-types');
import { v4 as uuidv4 } from 'uuid';

import { LoggerFactory } from './utils/logger.factory';

const REQUEST_PROTOCOL = 'http';
const REQUEST_TIMEOUT_MS = 5000;
const RETRY_DEFAULTS = { retries: 2, minTimeout: 75, maxTimeout: 750 };
const METHODS_ALLOWED = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'];
const DEFAULT_CORRELATION_HEADER_NAME = 'X-CorrelationID';

/**
 *
 */
export class AbstractRequestClient {
  readonly verbose: boolean;
  readonly correlationHeaderName: string;

  readonly request; // TODO typing
  readonly retry; // TODO typing

  readonly logger;

  /**
   * @param options
   */
  constructor(options: any = {}) {
    if (new.target === AbstractRequestClient) {
      throw new TypeError('Cannot construct AbstractRequestClient instances directly, please extend');
    }
    this.logger = LoggerFactory.create(this.constructor.name);

    this.verbose = options.verbose || false;

    // Correlation
    this.correlationHeaderName = options.correlationHeaderName || DEFAULT_CORRELATION_HEADER_NAME;

    // HTTP request
    this.request = {};
    this.request.protocol = options.protocol || REQUEST_PROTOCOL;
    this.request.timeout = options.timeoutMs || REQUEST_TIMEOUT_MS;

    // Retry
    this.retry = {};
    this.retry.retries = options.retries || options.retries >= 0 ? options.retries : RETRY_DEFAULTS.retries;
    this.retry.minTimeout = options.minTimeoutMs || RETRY_DEFAULTS.minTimeout;
    this.retry.maxTimeout = options.maxTimeoutMs || RETRY_DEFAULTS.maxTimeout;
  }

  /**
   * Perform a GET request.
   *
   * @param uri
   * @param options
   * @returns {Promise}
   */
  async get(uri: string, options: any = {}): Promise<unknown> {
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
  async options(uri: string, options: any = {}): Promise<unknown> {
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
  async post(uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
  async put(uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
  async delete(uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
  async head(uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
  async patch(uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
  async method(method: string, uri: string, options: any = {}, body: unknown): Promise<unknown> {
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
    return `${this.request.protocol}://localhost`;
  }

  /**
   * @param method
   * @param uri
   * @param options
   * @param body
   * @private
   */
  async _executeRequest(method, uri, options: any = {}, body): Promise<unknown> {
    // Create clone of options, so we do not change its state.
    options = Object.assign({}, options);

    const { query, headers = {} } = options;

    if (!options.correlationId) {
      options.correlationId = uuidv4();
    }
    headers[this.correlationHeaderName] = options.correlationId;

    if (!uri || uri.length === 0) {
      uri = '';
    }

    // Inherit
    let baseUrl;

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

    axiosRetry(instance, {
      retries: options.retries || RETRY_DEFAULTS.retries, // number of retries
      retryDelay: (retryCount) => {
        this.logger.warn(
          { method: method, url: url, headers: headers, query: query, attempt: retryCount },
          'retry request',
        );

        const delay = Math.max(this.retry.minTimeout, retryCount * 200);
        return Math.min(this.retry.minTimeout, delay); // time interval between retries
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
        data: body || {},
        params: query || {},
        timeout: this.request.timeout,
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
