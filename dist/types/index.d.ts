export type RouteType = 'page' | 'layout' | 'error' | 'api' | 'other';
/**
 * The canonical representation of a route in the Core system.
 * Framework-specific routes are normalized to this schema.
 */
export interface IParamsRoute {
    /**
     * The normalized URL pattern.
     * - Must start with `/`
     * - Uses `:param` for dynamic segments (e.g., `/users/:id`)
     * - Uses `*` for wildcards (e.g., `/docs/*`)
     * - Uses `:param?` for optional parameters (e.g., `/lang/:code?`)
     */
    path: string;
    /**
     * The generic route type.
     * Framework-specific types should map to these or use 'other'.
     */
    type?: RouteType;
    /**
     * The component or handler function.
     * Opaque to the router (passed through to renderer).
     */
    component: any;
    /**
     * Extensible metadata for framework-specific logic.
     * e.g., { methods: ['GET', 'POST'], svelteKit: { file: '+page.svelte' } }
     */
    metadata?: Record<string, any>;
}
/**
 * Result object returned by Router.match()
 */
export interface RouteMatch {
    route: IParamsRoute;
    params: Record<string, string>;
    /**
     * Ordered list of parent layout routes derived from path hierarchy.
     * Root -> Leaf
     */
    layouts: IParamsRoute[];
}
/**
 * Contract for transforming module code into Standard Schema.
 */
export interface IFrameworkAdapter {
    /**
     * Identifies if this adapter can handle the given module.
     * e.g., checks for `sveltekit/` directory
     */
    detect(module: any): boolean;
    /**
     * Parses the module resources and returns standard routes.
     * Performs normalization (e.g., [id] -> :id).
     */
    parse(module: any): Promise<IParamsRoute[]>;
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
//# sourceMappingURL=index.d.ts.map