import { Registry } from "./Registry.js";
import type { IParamsRoute } from "../types/index.js";
export interface RouteMatch {
    route: IParamsRoute;
    params: Record<string, string>;
}
export declare class Router {
    private registry;
    constructor(registry: Registry);
    /**
     * Matches a URL path against registered module routes.
     * Supports basic parameter segments (e.g., /users/:id).
     */
    match(path: string): RouteMatch | null;
    /**
     * Simple path matcher.
     * Returns params object on match, null on no match.
     */
    private matchPath;
}
//# sourceMappingURL=Router.d.ts.map