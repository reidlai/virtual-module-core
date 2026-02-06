import type {
  IFrameworkAdapter,
  IModuleBundle,
  IRoute,
  RouteType,
  IWidget,
  IHandler,
} from "../types";

export class SvelteKitAdapter implements IFrameworkAdapter {
  /**
   * Detects if the module follows SvelteKit conventions.
   * Looks for 'sveltekit/' directory structure.
   */
  detect(module: any): boolean {
    if (module && typeof module === "object") {
      if (module.hasSvelteDir) {
        throw new Error(
          'Legacy "svelte/" directory detected. Please migrate to "sveltekit/".',
        );
      }
      return module.hasSvelteKitDir === true;
    }
    return false;
  }

  async parse(module: any): Promise<IModuleBundle> {
    const routes: IRoute[] = [];
    const widgets: IWidget[] = [];
    const handlers: IHandler[] = [];

    const files: string[] = module.files || [];

    for (const filePath of files) {
      // parsing logic
      if (filePath.startsWith("sveltekit/widgets/")) {
        const name = filePath.split("/").pop() || "unknown";
        widgets.push({
          id: name, // simplified id generation for now
          title: name,
          component: filePath, // Stores the path/reference
          location: "dashboard",
          size: "medium",
        });
        continue;
      }
      if (filePath.startsWith("sveltekit/handlers/")) {
        const name = filePath.split("/").pop() || "unknown";
        handlers.push({
          id: name,
          title: name,
          execute: async () => { }, // placeholder logic
        });
        continue;
      }

      if (
        !filePath.startsWith("sveltekit/routes/") &&
        !filePath.startsWith("src/routes/")
      ) {
        if (!filePath.startsWith("sveltekit/")) continue;
      }

      const relativePath = filePath.replace(/^sveltekit\//, "");
      const parsed = this.parseSvelteKitPath(relativePath);
      if (parsed) {
        routes.push(parsed);
      }
    }

    return {
      id: module.id || "unknown",
      routes,
      widgets,
      handlers,
      metadata: {
        framework: "sveltekit",
      },
    };
  }

  private parseSvelteKitPath(filePath: string): IRoute | null {
    // 1. Identify type
    let type: RouteType = "other";
    if (filePath.endsWith("+page.svelte")) type = "page";
    else if (filePath.endsWith("+layout.svelte")) type = "layout";
    else if (filePath.endsWith("+error.svelte")) type = "error";
    else if (filePath.endsWith("+server.ts")) type = "api";
    else return null; // Ignore other files

    // 2. Normalize Path
    // Remove filename
    let dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
    // Remove 'routes/' prefix
    if (dirPath.startsWith("routes")) {
      dirPath = dirPath.replace(/^routes\/?/, "");
    }

    if (dirPath === "") dirPath = "/";
    else if (!dirPath.startsWith("/")) dirPath = "/" + dirPath;

    const segments = dirPath.split("/").filter(Boolean);
    const normalizedSegments: string[] = [];

    for (const segment of segments) {
      if (segment.startsWith("(") && segment.endsWith(")")) continue;
      if (segment.startsWith("[[") && segment.endsWith("]]")) {
        const paramName = segment.slice(2, -2);
        normalizedSegments.push(`:${paramName}?`);
        continue;
      }
      if (segment.startsWith("[...") && segment.endsWith("]")) {
        normalizedSegments.push("*");
        continue;
      }
      if (segment.startsWith("[") && segment.endsWith("]")) {
        const paramName = segment.slice(1, -1);
        normalizedSegments.push(`:${paramName}`);
        continue;
      }
      normalizedSegments.push(segment);
    }

    let normalizedPath = "/" + normalizedSegments.join("/");
    if (normalizedPath === "//") normalizedPath = "/";

    return {
      path: normalizedPath,
      type,
      component: filePath,
      metadata: {
        framework: "sveltekit",
        originalPath: filePath,
      },
    };
  }
}
