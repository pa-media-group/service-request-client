/**
 * Simple Host Port Resolver.
 */
class HostPortResolver {
  /**
   * Basic host and port resolver.
   *
   * @param hostName
   * @param port
   * @returns {Promise.<*>}
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async resolve(hostName: string, port = 80): Promise<string> {
    if (!hostName || hostName.length === 0) {
      throw new Error('hostname must be provided');
    }
    return `${hostName}:${port}`;
  }
}

export const resolver = new HostPortResolver();
