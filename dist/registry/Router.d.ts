import type { IParamsRoute, RouteMatch } from '../types';
export declare class Router {
    private routes;
    register(routes: IParamsRoute[]): void;
    match(path: string): RouteMatch | null;
    private parseRoute;
    /**
     * Sorts routes by specificity:
     * Static > Dynamic > Optional > Wildcard
     */
    private sortRoutes;
    private matchSegments;
    private resolveLayouts;
}
//# sourceMappingURL=Router.d.ts.map