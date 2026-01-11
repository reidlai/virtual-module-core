# SDK Reference: Virtual Module Core

**Version**: 0.1.0
**Module**: `virtual-module-core`

This SDK reference is generated from the source code in `src/`.

## Interfaces

### `IModuleBundle`

The complete package of resources provided by a virtual module.

```typescript
export interface IModuleBundle {
  /** Unique identifier for the module */
  id: string;

  /** Normalized routes provided by the module */
  routes?: IParamsRoute[];

  /** UI Widgets (e.g., dashboard tiles) */
  widgets?: IWidget[];

  /** Background handlers or services */
  handlers?: IHandler[];

  /** Service implementations or factories */
  services?: Record<string, any>;

  /** Module metadata */
  metadata?: Record<string, any>;
}
```

### `IParamsRoute`

The canonical route schema used by the Core Registry.

```typescript
export interface IParamsRoute {
  /**
   * The normalized URL pattern.
   * - Must start with `/`
   * - Uses `:param` for dynamic segments
   * - Uses `*` for wildcards
   * - Uses `:param?` for optional parameters
   */
  path: string;

  /**
   * Generic route type.
   * Values: 'page' | 'layout' | 'error' | 'api' | 'other'
   */
  type?: RouteType;

  /**
   * Opaque component or handler reference.
   * Passed through to the renderer unchanged.
   */
  component: any;

  /**
   * Extensible metadata bag.
   * Store framework-specific flags here.
   */
  metadata?: Record<string, any>;
}
```

### `IWidget`

Definition for a UI Widget that can be embedded in the host application.

```typescript
export interface IWidget {
  id: string;
  title: string;
  component: any; // Svelte component reference
  location?: string; // e.g. 'dashboard', 'sidebar', 'header'
  size?: "small" | "medium" | "large";
}
```

### `IHandler`

Definition for a background command or event handler.

```typescript
export interface IHandler {
  id: string;
  title: string;
  execute: (context: IContext) => void | Promise<void>;
}
```

### `IContext`

The application context passed to module initialization and handlers.

```typescript
export interface IContext {
  /** Application Configuration */
  config: IAppConfig;

  /** Register a service instance */
  register(key: string, service: any): void;

  /** Retrieve a service instance */
  getService<T>(key: string): T;
}
```

### `IFrameworkAdapter`

Contract for building new framework adapters.

```typescript
export interface IFrameworkAdapter {
  /**
   * Returns true if the module follows this adapter's conventions.
   */
  detect(module: any): boolean;

  /**
   * Parses the module and returns a normalized IModuleBundle.
   */
  parse(module: any): Promise<IModuleBundle>;
}
```

## Types

### `RouteType`

```typescript
type RouteType = "page" | "layout" | "error" | "api" | "other";
```

### `RouteMatch`

Result of a router match operation.

```typescript
export interface RouteMatch {
  route: IParamsRoute;
  params: Record<string, string>;
  layouts: IParamsRoute[];
}
```

## Classes

### `Registry`

The central singleton entry point for module loading and access.

```typescript
export class Registry {
  /**
   * Get the singleton instance of the Registry.
   */
  public static getInstance(): Registry;

  /**
   * Registers a pre-parsed module bundle directly.
   * Throws if duplicate routes are detected.
   */
  register(bundle: IModuleBundle): void;

  /**
   * Convenience wrapper to parse and register a raw module using an adapter.
   * Throws if adapter fails to detect or parse the module.
   */
  async registerModule(module: any, adapter: IFrameworkAdapter): Promise<void>;

  /**
   * Returns the underlying Router instance.
   */
  getRouter(): Router;

  /**
   * Returns all registered widgets.
   */
  getWidgets(): Map<string, IWidget>;

  /**
   * Returns all registered handlers.
   */
  getHandlers(): IHandler[];
}
```

### `Router`

The generic route matching engine.

```typescript
export class Router {
  /**
   * Registers a list of routes.
   * Sorts them by specificity (static > dynamic > optional > wildcard).
   */
  register(routes: IParamsRoute[]): void;

  /**
   * Matches a path against registered routes.
   * Returns null if no match found.
   */
  match(path: string): RouteMatch | null;
}
```

### `SvelteKitAdapter`

Standard adapter for SvelteKit-based virtual modules.

```typescript
export class SvelteKitAdapter implements IFrameworkAdapter {
  /**
   * Detects if 'sveltekit/' directory exists in the module.
   * Throws error if legacy 'svelte/' directory is found.
   */
  detect(module: any): boolean;

  /**
   * Parses SvelteKit structure:
   * - `sveltekit/routes/` -> IParamsRoute[]
   * - `sveltekit/widgets/` -> IWidget[]
   * - `sveltekit/handlers/` -> IHandler[]
   */
  async parse(module: any): Promise<IModuleBundle>;
}
```
