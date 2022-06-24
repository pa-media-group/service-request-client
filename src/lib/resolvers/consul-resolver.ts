/**
 * Consul Resolver. // TODO Implement ConsulResolver
 */
class ConsulResolver {
  /**
   * Resolve service location using Consul.
   *
   * @param serviceName
   * @returns {Promise.<*>}
   */
  // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-unused-vars
  async resolve(serviceName): Promise<string> {
    throw new Error('Consul resolver not implemented');
  }
}

export const resolver = new ConsulResolver();
