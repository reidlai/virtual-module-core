var SegmentType;
(function (SegmentType) {
    SegmentType[SegmentType["Static"] = 0] = "Static";
    SegmentType[SegmentType["Dynamic"] = 1] = "Dynamic";
    SegmentType[SegmentType["Optional"] = 2] = "Optional";
    SegmentType[SegmentType["Wildcard"] = 3] = "Wildcard"; // *
})(SegmentType || (SegmentType = {}));
export class Router {
    routes = [];
    register(routes) {
        for (const route of routes) {
            this.routes.push(this.parseRoute(route));
        }
        this.sortRoutes();
    }
    match(path) {
        // Remove trailing slash for consistency (unless root)
        const normalizedPath = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
        const pathSegments = normalizedPath.split('/').filter(Boolean);
        for (const parsed of this.routes) {
            const match = this.matchSegments(parsed, pathSegments);
            if (match) {
                return {
                    route: parsed.original,
                    params: match,
                    layouts: this.resolveLayouts(normalizedPath)
                };
            }
        }
        return null;
    }
    parseRoute(route) {
        const segments = route.path.split('/').filter(Boolean);
        const types = [];
        let score = 0;
        for (const segment of segments) {
            if (segment === '*') {
                types.push(SegmentType.Wildcard);
                score += SegmentType.Wildcard; // Lower specificity
            }
            else if (segment.startsWith(':')) {
                if (segment.endsWith('?')) {
                    types.push(SegmentType.Optional);
                    score += SegmentType.Optional;
                }
                else {
                    types.push(SegmentType.Dynamic);
                    score += SegmentType.Dynamic;
                }
            }
            else {
                types.push(SegmentType.Static);
                // Static segments add high value to specificity sort order
                // We'll prioritize implementation of compare function independently
            }
        }
        return { original: route, segments, types, score };
    }
    /**
     * Sorts routes by specificity:
     * Static > Dynamic > Optional > Wildcard
     */
    sortRoutes() {
        this.routes.sort((a, b) => {
            const len = Math.min(a.types.length, b.types.length);
            for (let i = 0; i < len; i++) {
                if (a.types[i] !== b.types[i]) {
                    return a.types[i] - b.types[i];
                }
            }
            // Longer specific paths win (if prefixes match)
            // e.g. /a/b vs /a
            return b.types.length - a.types.length;
        });
    }
    matchSegments(parsed, pathSegments) {
        const params = {};
        let pathIdx = 0;
        let routeIdx = 0;
        while (routeIdx < parsed.segments.length) {
            const routeSegment = parsed.segments[routeIdx];
            const type = parsed.types[routeIdx];
            const pathSegment = pathSegments[pathIdx];
            if (type === SegmentType.Static) {
                if (pathSegment !== routeSegment)
                    return null;
                pathIdx++;
            }
            else if (type === SegmentType.Dynamic) {
                if (!pathSegment)
                    return null;
                const paramName = routeSegment.slice(1); // remove :
                params[paramName] = pathSegment;
                pathIdx++;
            }
            else if (type === SegmentType.Optional) {
                const paramName = routeSegment.slice(1, -1); // remove : and ?
                // Optional consumes a segment if present, or skips
                // Note: Generic Router usually treats optional as "consume if available"
                // But simplified: optional MUST come at end or handle backtracking.
                // For this implementation, we assume basic matching:
                if (pathSegment) {
                    params[paramName] = pathSegment;
                    pathIdx++;
                }
            }
            else if (type === SegmentType.Wildcard) {
                // Wildcard matches rest
                // Assuming * is only allowed at end for now simple impl
                return params; // todo: capture rest value if needed? Usually normalized to *
            }
            routeIdx++;
        }
        // Ensure we consumed all path segments (unless wildcard matched already)
        if (pathIdx < pathSegments.length && parsed.types[parsed.types.length - 1] !== SegmentType.Wildcard) {
            return null;
        }
        return params;
    }
    resolveLayouts(path) {
        // Find all Registered Layouts that match a prefix of the path
        // e.g. path /blog/post/1 -> matches layouts at /, /blog, /blog/post
        const layouts = [];
        // This requires 'this.routes' to contain layouts.
        // But matching usually filters for pages.
        // We might need separate storage for layouts or filter 'this.routes'
        // Simple implementation: scan all routes for type='layout' and check prefix
        // Optimization: Registry should split these or index them.
        // For MVP:
        for (const parsed of this.routes) {
            if (parsed.original.type === 'layout') {
                // Check if parsed.original.path is a prefix of path
                // e.g. layout: /blog, path: /blog/123 -> Yes
                // layout: /, path: /anything -> Yes
                if (path.startsWith(parsed.original.path) || parsed.original.path === '/') {
                    // Ensure implementation details correct (boundary check)
                    const isRoot = parsed.original.path === '/';
                    const isBoundary = path[parsed.original.path.length] === '/' || path.length === parsed.original.path.length;
                    if (isRoot || isBoundary) {
                        layouts.push(parsed.original);
                    }
                }
            }
        }
        // Sort by path length (root first -> leaf last ? or specific order?)
        // Spec says: "Ordered list of parent layout routes derived from path hierarchy. Root -> Leaf"
        return layouts.sort((a, b) => a.path.length - b.path.length);
    }
}
