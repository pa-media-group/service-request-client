import { ClientOptions } from '../models/options';
import { resolver } from '../resolvers/zookeeper-resolver';

import { AbstractRequestClient } from './abstract-request-client';

export class ZookeeperRequestClient extends AbstractRequestClient {
  readonly serviceName: string;

  /**
   * @param serviceName
   * @param options
   */
  constructor(serviceName: string, options = {} as ClientOptions) {
    super(options);
    this.serviceName = serviceName;
  }

  /**
   * @returns {Promise<string>}
   */
  async resolveServiceBaseURL(): Promise<string> {
    const hostPort = await resolver.resolve(this.serviceName);
    const serviceUrl = `${this.request.protocol}://${hostPort}/${this.serviceName}`;

    this.logger.trace(`Resolving Service Base URL for container => ${serviceUrl}`);
    return serviceUrl;
  }
}
