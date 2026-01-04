export class Registry {
    static instance;
    modules = new Map();
    // Flattened registries for easy access
    widgetMap = new Map();
    handlers = [];
    servicesMap = new Map();
    stateStores = new Map();
    constructor() { }
    static getInstance() {
        if (!Registry.instance) {
            Registry.instance = new Registry();
        }
        return Registry.instance;
    }
    register(bundle) {
        if (this.modules.has(bundle.id)) {
            console.warn(`[Registry] Module '${bundle.id}' is already registered. Skipping.`);
            return;
        }
        console.log(`[Registry] Registered module: ${bundle.id}`);
        this.modules.set(bundle.id, bundle);
        // Auto-register widgets
        if (bundle.widgets) {
            for (const widget of bundle.widgets) {
                if (this.widgetMap.has(widget.id)) {
                    console.warn(`[Registry] Duplicate widget ID found: ${widget.id}. Skipping registration.`);
                    continue;
                }
                this.widgetMap.set(widget.id, widget);
            }
        }
        // Auto-register handlers
        if (bundle.handlers) {
            this.handlers.push(...bundle.handlers);
        }
        // Auto-register services
        if (bundle.services) {
            for (const [key, service] of Object.entries(bundle.services)) {
                this.servicesMap.set(key, service);
            }
        }
    }
    getModules() {
        return Array.from(this.modules.values());
    }
    getModule(id) {
        return this.modules.get(id);
    }
    getWidget(id) {
        return this.widgetMap.get(id);
    }
    getWidgets() {
        return Array.from(this.widgetMap.values());
    }
    getHandlers() {
        return this.handlers;
    }
    getService(id) {
        return this.servicesMap.get(id);
    }
    clear() {
        this.modules.clear();
        this.servicesMap.clear();
        this.widgetMap.clear();
        this.handlers = [];
        this.stateStores.clear();
    }
    // Routing Support
    getRoute(path) {
        for (const bundle of this.modules.values()) {
            if (bundle.routes) {
                for (const route of bundle.routes) {
                    // Simple exact match or startsWith for sub-routes
                    if (route.path === path || path.startsWith(route.path + "/")) {
                        return route.component;
                    }
                }
            }
        }
        return undefined;
    }
    // State Store Support (Mock/Simple implementation)
    getStateStore(id) {
        if (!this.stateStores.has(id)) {
            // Best effort: Return a mock ModuleStateStore object
            this.stateStores.set(id, {
                subscribe: () => { },
                set: () => { },
                update: () => { },
                getChannel: (_key, initial) => {
                    return {
                        subscribe: (run) => {
                            run(initial);
                            return () => { };
                        },
                    };
                },
                updateState: (key, val, src) => {
                    console.log(`[MockStore] Update ${key}:`, val, src);
                },
            });
        }
        return this.stateStores.get(id);
    }
}
