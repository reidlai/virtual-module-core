import type { IAppConfig, IContext } from "../types/index.js";

export class DIContainer implements IContext {
  private services = new Map<string, any>();
  public config: IAppConfig;

  constructor(config: IAppConfig) {
    this.config = config;
  }

  /**
   * Register a service instance or factory.
   * Currently supports singleton instances.
   */
  register(key: string, service: any): void {
    this.services.set(key, service);
  }

  getService<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not found in DI Container.`);
    }
    return service as T;
  }
}
