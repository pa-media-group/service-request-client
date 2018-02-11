'use strict';

require('../helper');

const resolver = require('../../lib/resolvers/container-dns-resolver');

describe('container-dns-resolver', () => {
  describe('#resolve()', () => {
    it('should return an expected response when provided with a name and port', async () => {
      const host = await resolver.resolve('service-name-v1', 8001);
      host.should.equal('service-name-v1:8001');
    });

    it('should return an expected response when provided with a name and default the port to 80', async () => {
      const host = await resolver.resolve('service-name-v1');
      host.should.equal('service-name-v1:80');
    });

    it('should throw an error when no service name is provided', async () => {
      try {
        await resolver.resolve(null, 8001);
      } catch (err) {
        err.message.should.equal('service name must be provided');
      }
    });
  });
});