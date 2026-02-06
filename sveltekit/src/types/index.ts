export type RouteType = "page" | "layout" | "error" | "api" | "other";

/**
 * The canonical representation of a route in the Core system.
 * Framework-specific routes are normalized to this schema.
 */
export interface IParamsRoute {
  path: string;
  type?: RouteType;
  component: any;
  metadata?: Record<string, any>;
}

export interface RouteMatch {
  route: IParamsRoute;
  params: Record<string, string>;
  layouts: IParamsRoute[];
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
 * Basic Route Definition
 */
export interface IRoute {
  path: string;
  type: "page" | "modal";
  component: any;
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
}

export type ModuleInit = (context: IContext) => Promise<IModuleBundle>;

/**
 * Contract for transforming module code into Standard Schema.
 */
export interface IFrameworkAdapter {
  detect(module: any): boolean;
  parse(module: any): Promise<IModuleBundle>;
}
