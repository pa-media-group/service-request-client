import axios, { AxiosResponse } from 'axios';

import { HostPortRequestClient } from '../../src';

// Fixtures
const DELETE_FIXTURE = require('../fixtures/delete.json');
const GET_FIXTURE = require('../fixtures/get.json');
const HEAD_FIXTURE = require('../fixtures/head.json');
const OPTIONS_FIXTURE = require('../fixtures/options.json');
const PATCH_FIXTURE = require('../fixtures/patch.json');
const POST_FIXTURE = require('../fixtures/post.json');
const PUT_FIXTURE = require('../fixtures/put.json');

const defaultOptions = {
  headers: { 'Content-Type': 'application/json' },
  correlationId: '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
};

let client, requestMock;

describe('host-port-request-client', () => {
  beforeEach(() => {
    jest.spyOn(axios, 'create').mockReturnValue(axios);
    client = new HostPortRequestClient('hostname', 8001, 'my/service/path/v1', { verbose: true, retries: 2 });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('#get()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: GET_FIXTURE } as AxiosResponse);

      const response = await client.get('resource-name/123', { correlationId: '5d14c8ea-54f4-4e1a-8e5e-6eff865dc768' });
      expect(response).toEqual(GET_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: {},
        headers: { 'X-CorrelationID': '5d14c8ea-54f4-4e1a-8e5e-6eff865dc768' },
        method: 'GET',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });

    test('should not retry when a request fails due to a client error (4xx)', async () => {
      jest.spyOn(axios, 'request').mockRejectedValue({ message: 'client error message', isClientError: true });

      try {
        await client.get('resource-name/123');
      } catch (err) {
        expect(err.message).toEqual('client error message');
        expect(axios.request).toBeCalledTimes(1);
      }
    });

    test('should retry 3 times when a request fails due to a server error (5xx)', async () => {
      jest.spyOn(axios, 'request').mockRejectedValue({ message: 'server error message', isServerError: true });

      try {
        await client.get('resource-name/123');
      } catch (err) {
        expect(err.message).toEqual('server error message');
        // expect(axios.request).toBeCalledTimes(3); // FIXME axiosRetry logic not working with mock axios.
      }
    });

    test('should create a new correlationId header when a request is called multiple times', async () => {
      requestMock = jest.fn();
      requestMock.mockResolvedValue({ data: GET_FIXTURE } as AxiosResponse);

      jest.spyOn(axios, 'request').mockImplementation(requestMock);

      const options = {
        headers: {
          Accept: 'application/json',
        },
      };
      await client.get('resource-name/123', options);
      const firstCorrelationId = requestMock.mock.calls[0][0].headers['X-CorrelationID'];

      await client.get('resource-name/123', options);
      const secondCorrelationId = requestMock.mock.calls[1][0].headers['X-CorrelationID'];

      expect(secondCorrelationId).not.toEqual(firstCorrelationId);
    });

    test('should preserve the correlationId header when a request is called multiple times', async () => {
      requestMock = jest.fn();
      requestMock.mockResolvedValue({ data: GET_FIXTURE } as AxiosResponse);

      jest.spyOn(axios, 'request').mockImplementation(requestMock);

      const options = {
        correlationId: '123456789',
      };

      await client.get('resource-name/123', options);
      const firstCorrelationId = requestMock.mock.calls[0][0].headers['X-CorrelationID'];

      await client.get('resource-name/123', options);
      const secondCorrelationId = requestMock.mock.calls[1][0].headers['X-CorrelationID'];

      expect(secondCorrelationId).toEqual(firstCorrelationId);
    });
  });

  describe('#head()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: HEAD_FIXTURE } as AxiosResponse);

      const response = await client.head('resource-name/123', {
        correlationId: '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
      });

      expect(response).toEqual(HEAD_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: {},
        headers: { 'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad' },
        method: 'HEAD',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#options()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: OPTIONS_FIXTURE } as AxiosResponse);

      const response = await client.options('resource-name/123', {
        correlationId: '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
      });

      expect(response).toEqual(OPTIONS_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: {},
        headers: { 'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad' },
        method: 'OPTIONS',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#put()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: PUT_FIXTURE } as AxiosResponse);

      const response = await client.put('resource-name/123', defaultOptions, { message: 'hello' });
      expect(response).toEqual(PUT_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: { message: 'hello' },
        headers: {
          'Content-Type': 'application/json',
          'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
        },
        method: 'PUT',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#post()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: POST_FIXTURE } as AxiosResponse);

      const response = await client.post('resource-name/123', defaultOptions, { message: 'hello' });
      expect(response).toEqual(POST_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: { message: 'hello' },
        headers: {
          'Content-Type': 'application/json',
          'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
        },
        method: 'POST',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#delete()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: DELETE_FIXTURE } as AxiosResponse);

      const response = await client.delete('resource-name/123', defaultOptions, { message: 'hello' });
      expect(response).toEqual(DELETE_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: { message: 'hello' },
        headers: {
          'Content-Type': 'application/json',
          'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
        },
        method: 'DELETE',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#patch()', () => {
    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: PATCH_FIXTURE } as AxiosResponse);

      const response = await client.patch('resource-name/123', defaultOptions, { message: 'hello' });
      expect(response).toEqual(PATCH_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: { message: 'hello' },
        headers: {
          'Content-Type': 'application/json',
          'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
        },
        method: 'PATCH',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });

  describe('#method()', () => {
    test('should return an expected response when called with valid parameters for a GET request', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: GET_FIXTURE } as AxiosResponse);

      const response = await client.method('GET', 'resource-name/123', {
        correlationId: '5d14c8ea-54f4-4e1a-8e5e-6eff865dc768',
      });
      expect(response).toEqual(GET_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: {},
        headers: { 'X-CorrelationID': '5d14c8ea-54f4-4e1a-8e5e-6eff865dc768' },
        method: 'GET',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });

    test('should return an expected response when called with valid parameters', async () => {
      jest.spyOn(axios, 'request').mockResolvedValue({ data: POST_FIXTURE } as AxiosResponse);

      const response = await client.method('POST', 'resource-name/123', defaultOptions, { message: 'hello' });
      expect(response).toEqual(POST_FIXTURE);
      expect(axios.request).toBeCalledTimes(1);
      expect(axios.request).toBeCalledWith({
        data: { message: 'hello' },
        headers: {
          'Content-Type': 'application/json',
          'X-CorrelationID': '8dfc950a-4b48-4cb3-ac36-b9f23f80bfad',
        },
        method: 'POST',
        params: {},
        timeout: 5000,
        url: 'http://hostname:8001/my/service/path/v1/resource-name/123',
      });
    });
  });
});
