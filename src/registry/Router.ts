import { Registry } from "./Registry.js";
import type { IParamsRoute } from "../types/index.js";

export interface RouteMatch {
  route: IParamsRoute;
  params: Record<string, string>;
}

export class Router {
  constructor(private registry: Registry) { }

  /**
   * Matches a URL path against registered module routes.
   * Supports basic parameter segments (e.g., /users/:id).
   */
  match(path: string): RouteMatch | null {
    const modules = this.registry.getModules();

    for (const module of modules) {
      if (!module.routes) continue;
      for (const route of module.routes) {
        const params = this.matchPath(route.path, path);
        if (params) {
          return { route, params };
        }
      }
    }
    return null;
  }

  /**
   * Simple path matcher.
   * Returns params object on match, null on no match.
   */
  private matchPath(
    definition: string,
    path: string,
  ): Record<string, string> | null {
    const defParts = definition.split("/").filter((p) => p !== "");
    const pathParts = path.split("/").filter((p) => p !== "");

    if (defParts.length !== pathParts.length) return null;

    const params: Record<string, string> = {};

    for (let i = 0; i < defParts.length; i++) {
      const defPart = defParts[i];
      const pathPart = pathParts[i];

      if (defPart.startsWith(":")) {
        const paramName = defPart.slice(1);
        params[paramName] = pathPart;
      } else if (defPart !== pathPart) {
        return null; // Mismatch
      }
    }

    return params;
  }
}
