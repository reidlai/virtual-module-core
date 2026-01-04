export interface IAppConfig {
  [key: string]: any;
}

export interface IContext {
  config: IAppConfig;
  register(key: string, service: any): void;
  getService<T>(key: string): T;
}

export interface IParamsRoute {
  path: string;
  component: any;
}

export interface IWidget {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  /** The actual Svelte component constructor/class */
  component: any;
  /** Suggested location: 'dashboard', 'sidebar', 'header' */
  location?: string;
  /** Size hint: 'small', 'medium', 'large' */
  size?: "small" | "medium" | "large";
  props?: Record<string, any>;
}

export interface IHandler {
  id: string;
  title: string;
  icon?: string;
  execute: (context: IContext) => void | Promise<void>;
}

export interface IModuleBundle {
  id: string;
  /** Defines usage of dynamic widgets (Dashboard tiles, etc.) */
  widgets?: IWidget[];
  /** Optional imperative handlers (e.g. for menu actions) */
  handlers?: IHandler[];
  services?: Record<string, any>;
  routes?: IParamsRoute[];
}

export type ModuleInit = (context: IContext) => Promise<IModuleBundle>;

export interface IThemeConfig {
  mode: "light" | "dark" | "system";
  primary?: string;
  primaryColor?: string;
  radius?: number;
  style?: string;
}

export interface IModuleState {
  [key: string]: any;
}

