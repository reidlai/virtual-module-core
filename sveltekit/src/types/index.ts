export type RouteType = "page" | "layout" | "error" | "api" | "modal" | "other";

/**
 * The canonical representation of a route in the Core system.
 * Framework-specific routes are normalized to this schema.
 */
export interface IRoute {
  path: string;
  type?: RouteType;
  component: any;
  metadata?: Record<string, any>;
}

export interface RouteMatch {
  route: IRoute;
  params: Record<string, string>;
  layouts: IRoute[];
}

/**
 * Application Configuration (Generic)
 */
export interface IAppConfig {
  [key: string]: any;
}

/**
 * Dependency Injection Context
 */
export interface IContext {
  config: IAppConfig;
  register(key: string, service: any): void;
  getService<T>(key: string): T;
}

/**
 * UI Widget Definition
 */
export interface IWidget {
  id: string;
  title: string;
  component: any;
  location: "dashboard" | "sidebar" | "main" | "header";
  size: "small" | "medium" | "large";
}

/**
 * Background/Command Handler Definition
 */
export interface IHandler {
  id: string;
  title: string;
  execute: (context: IContext) => void | Promise<void>;
}

/**
 * Represents a complete Virtual Module Bundle.
 */
export interface IModuleBundle {
  id: string;
  widgets?: IWidget[];
  handlers?: IHandler[];
  services?: Record<string, any>;
  routes?: IRoute[];
  metadata?: Record<string, any>;
  /**
   * Optional RES client connection provided by the AppShell.
   */
  resClient?: any;
}

export type ModuleInit = (context: IContext) => Promise<IModuleBundle>;

/**
 * Contract for transforming module code into Standard Schema.
 */
export interface IFrameworkAdapter {
  detect(module: any): boolean;
  parse(module: any): Promise<IModuleBundle>;
}
