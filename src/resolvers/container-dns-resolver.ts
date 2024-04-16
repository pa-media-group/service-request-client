/**
 * Docker Container DNS Resolver.
 */
class ContainerDNSResolver {
  /**
   * Container DNS (e.g. Docker Service Name) resolver.
   *
   * @param serviceName
   * @param port
   * @returns {Promise.<*>}
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async resolve(serviceName: string, port = 80): Promise<string> {
    if (!serviceName || serviceName.length === 0) {
      throw new Error('service name must be provided');
    }
    return `${serviceName}:${port}`;
  }
}

export const resolver = new ContainerDNSResolver();
