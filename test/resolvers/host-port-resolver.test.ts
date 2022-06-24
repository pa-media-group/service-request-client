import { resolver } from '../../src/lib/resolvers/container-dns-resolver';

describe('container-dns-resolver', () => {
  describe('#resolve()', () => {
    it('should return an expected response when provided with a name and port', async () => {
      const host = await resolver.resolve('www.google.com', 8001);
      expect(host).toEqual('www.google.com:8001');
    });

    it('should return an expected response when provided with a name and default the port to 80', async () => {
      const host = await resolver.resolve('www.google.com');
      expect(host).toEqual('www.google.com:80');
    });

    it('should throw an error when no hostname is provided', async () => {
      try {
        await resolver.resolve(null, 8001);
      } catch (err) {
        expect(err.message).toEqual('service name must be provided');
      }
    });
  });
});
