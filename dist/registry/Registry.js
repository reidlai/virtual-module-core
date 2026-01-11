import { Router } from './Router';
export class Registry {
    router;
    registeredPaths;
    constructor() {
        this.router = new Router();
        this.registeredPaths = new Set();
    }
    /**
     * Registers a module using the provided adapter.
     * @param module The module object/metadata to register
     * @param adapter The adapter specific to the module's framework
        * @throws Error if any route path is already registered (Conflict Detection)
     */
    async registerModule(module, adapter) {
        if (!adapter.detect(module)) {
            throw new Error('Adapter failed to detect compatible module');
        }
        const routes = await adapter.parse(module);
        // Conflict Detection Phase
        for (const route of routes) {
            if (this.registeredPaths.has(route.path)) {
                throw new Error(`Duplicate route detected: ${route.path}. Routes must be unique across all modules.`);
            }
        }
        // Registration Phase
        for (const route of routes) {
            this.registeredPaths.add(route.path);
        }
        this.router.register(routes);
    }
    /**
     * Expose router for matching
     */
    getRouter() {
        return this.router;
    }
}
