import type { IModuleBundle, IWidget, IHandler } from "../types/index.js";

export class Registry {
  private static instance: Registry;
  private modules = new Map<string, IModuleBundle>();
  // Flattened registries for easy access
  private widgetMap = new Map<string, IWidget>();
  private handlers: IHandler[] = [];
  private servicesMap = new Map<string, any>();
  private stateStores = new Map<string, any>();

  private constructor() { }

  static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  register(bundle: IModuleBundle): void {
    if (this.modules.has(bundle.id)) {
      console.warn(
        `[Registry] Module '${bundle.id}' is already registered. Skipping.`,
      );
      return;
    }
    console.log(`[Registry] Registered module: ${bundle.id}`);
    this.modules.set(bundle.id, bundle);

    // Auto-register widgets
    if (bundle.widgets) {
      for (const widget of bundle.widgets) {
        if (this.widgetMap.has(widget.id)) {
          console.warn(
            `[Registry] Duplicate widget ID found: ${widget.id}. Skipping registration.`,
          );
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

  getModules(): IModuleBundle[] {
    return Array.from(this.modules.values());
  }

  getModule(id: string): IModuleBundle | undefined {
    return this.modules.get(id);
  }

  getWidget(id: string): IWidget | undefined {
    return this.widgetMap.get(id);
  }

  getWidgets(): IWidget[] {
    return Array.from(this.widgetMap.values());
  }

  getHandlers(): IHandler[] {
    return this.handlers;
  }

  getService<T = any>(id: string): T {
    return this.servicesMap.get(id);
  }

  clear(): void {
    this.modules.clear();
    this.servicesMap.clear();
    this.widgetMap.clear();
    this.handlers = [];
    this.stateStores.clear();
  }

  // Routing Support
  getRoute(path: string): any | undefined {
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
  getStateStore(id: string): any {
    if (!this.stateStores.has(id)) {
      // Best effort: Return a mock ModuleStateStore object
      this.stateStores.set(id, {
        subscribe: () => { },
        set: () => { },
        update: () => { },
        getChannel: (_key: string, initial: any) => {
          return {
            subscribe: (run: (val: any) => void) => {
              run(initial);
              return () => { };
            },
          };
        },
        updateState: (key: string, val: any, src: string) => {
          console.log(`[MockStore] Update ${key}:`, val, src);
        },
      });
    }
    return this.stateStores.get(id);
  }
}
