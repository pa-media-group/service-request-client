/**
 * ZooKeeper Resolver. TODO: Implement Zookeeper resolver.
 */
class ZookeeperResolver {
  /**
   * Resolve service location using ZooKeeper.
   *
   * @param serviceName
   * @returns {Promise.<*>}
   */
  // eslint-disable-next-line @typescript-eslint/require-await,@typescript-eslint/no-unused-vars
  async resolve(serviceName: string): Promise<string> {
    throw new Error('ZooKeeper resolver not implemented');
  }
}

export const resolver = new ZookeeperResolver();
