import { ClientOptions } from '../models/options';
import { resolver } from '../resolvers/host-port-resolver';

import { AbstractRequestClient } from './abstract-request-client';

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
  constructor(host: string, port: number, servicePath: string, options = {} as ClientOptions) {
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

    this.logger.trace(`Resolving Service Base URL for container => ${serviceUrl}`);
    return serviceUrl;
  }
}
