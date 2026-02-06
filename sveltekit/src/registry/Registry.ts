import type {
  IFrameworkAdapter,
  IModuleBundle,
  IWidget,
  IHandler,
} from "../types";
import { Router } from "./Router";

export class Registry {
  private static instance: Registry;

  // Core Storage
  private modules = new Map<string, IModuleBundle>();
  private widgetMap = new Map<string, IWidget>();
  private handlers: IHandler[] = [];

  // Routing
  private router: Router;
  private registeredPaths: Set<string>;

  constructor() {
    this.router = new Router();
    this.registeredPaths = new Set();
  }

  public static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  /**
   * Registers a pre-parsed module bundle directly.
   * Aligns with APPSHELL-ARCHITECTURE.md
   */
  register(bundle: IModuleBundle): void {
    this.modules.set(bundle.id, bundle);

    // Conflict Detection & Route Registration
    if (bundle.routes) {
      for (const route of bundle.routes) {
        if (this.registeredPaths.has(route.path)) {
          throw new Error(
            `Duplicate route detected: ${route.path}. Routes must be unique across all modules.`,
          );
        }
      }
      for (const route of bundle.routes) {
        this.registeredPaths.add(route.path);
      }
      this.router.register(bundle.routes);
    }

    // Auto-register widgets
    if (bundle.widgets) {
      for (const widget of bundle.widgets) {
        this.widgetMap.set(widget.id, widget);
      }
    }

    // Auto-register handlers
    if (bundle.handlers) {
      this.handlers.push(...bundle.handlers);
    }
  }

  /**
   * Convenience wrapper to parse and register a raw module using an adapter.
   */
  async registerModule(module: any, adapter: IFrameworkAdapter): Promise<void> {
    if (!adapter.detect(module)) {
      throw new Error("Adapter failed to detect compatible module");
    }

    const bundle = await adapter.parse(module);
    this.register(bundle);
  }

  getRouter(): Router {
    return this.router;
  }

  getWidgets(): Map<string, IWidget> {
    return this.widgetMap;
  }

  getHandlers(): IHandler[] {
    return this.handlers;
  }
}
