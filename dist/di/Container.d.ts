import type { IAppConfig, IContext } from "../types/index.js";
export declare class DIContainer implements IContext {
    private services;
    config: IAppConfig;
    constructor(config: IAppConfig);
    /**
     * Register a service instance or factory.
     * Currently supports singleton instances.
     */
    register(key: string, service: any): void;
    getService<T>(key: string): T;
}
//# sourceMappingURL=Container.d.ts.map