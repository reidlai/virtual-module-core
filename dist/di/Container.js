export class DIContainer {
    services = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Register a service instance or factory.
     * Currently supports singleton instances.
     */
    register(key, service) {
        this.services.set(key, service);
    }
    getService(key) {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service '${key}' not found in DI Container.`);
        }
        return service;
    }
}
