import { AbstractRequestClient } from '../abstract-request-client';
import { resolver } from '../resolvers/host-port-resolver';

/**
 *
 */
export class HostPortRequestClient extends AbstractRequestClient {
  readonly host: string;
  readonly port: number;
  readonly servicePath: string;

  /**
   *
   * @param host
   * @param port
   * @param servicePath
   * @param options
   */
  constructor(host, port, servicePath, options = {}) {
    super(options);

    this.host = host;
    this.port = port;
    this.servicePath = servicePath;
  }

  /**
   * @returns {Promise<string>}
   */
  async resolveServiceBaseURL(): Promise<string> {
    const hostPort = await resolver.resolve(this.host, this.port);
    const serviceUrl = `${this.request.protocol}://${hostPort}/${this.servicePath}`;

    this.logger.info(`Resolving Service Base URL for container => ${serviceUrl}`);
    return serviceUrl;
  }
}
