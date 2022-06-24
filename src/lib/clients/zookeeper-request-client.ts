import { AbstractRequestClient } from '../abstract-request-client';
import { resolver } from '../resolvers/zookeeper-resolver';

/**
 *
 */
export class ZookeeperRequestClient extends AbstractRequestClient {
  readonly serviceName: string;

  /**
   * @param serviceName
   * @param options
   */
  constructor(serviceName, options = {}) {
    super(options);
    this.serviceName = serviceName;
  }

  /**
   * @returns {Promise<string>}
   */
  async resolveServiceBaseURL(): Promise<string> {
    const hostPort = await resolver.resolve(this.serviceName);
    const serviceUrl = `${this.request.protocol}://${hostPort}/${this.serviceName}`;

    this.logger.info(`Resolving Service Base URL for container => ${serviceUrl}`);
    return serviceUrl;
  }
}
