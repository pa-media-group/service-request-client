import { AbstractRequestClient } from '../abstract-request-client';
import { resolver } from '../resolvers/container-dns-resolver';

/**
 *
 */
export class ContainerDNSRequestClient extends AbstractRequestClient {
  readonly containerName: string;
  readonly containerPort: number;
  readonly servicePath: string;

  /**
   *
   * @param containerName
   * @param containerPort
   * @param servicePath
   * @param options
   */
  constructor(containerName, containerPort, servicePath, options = {}) {
    super(options);

    this.containerName = containerName;
    this.containerPort = containerPort;
    this.servicePath = servicePath;
  }

  /**
   * @returns {Promise<string>}
   */
  async resolveServiceBaseURL(): Promise<string> {
    const hostPort = await resolver.resolve(this.containerName, this.containerPort);
    const serviceUrl = `${this.request.protocol}://${hostPort}/${this.servicePath}`;

    this.logger.info(`Resolving Service Base URL for container => ${serviceUrl}`);
    return serviceUrl;
  }
}
