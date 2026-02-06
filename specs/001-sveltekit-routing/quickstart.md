# Quickstart: Building Framework Adapters

**For**: Adapter Authors & Module Developers
**Updated**: 2026-01-10

## Overview

`virtual-module-core` uses an **Adapter Pattern**. As a user, you don't worry about this often—the App Shell likely provides the adapter you need. As a contributor, you can write adapters for new frameworks.

---

## Using the SvelteKit Adapter (Reference)

If your environment uses the `SvelteKitAdapter`, just structure your module normally:

```
my-module/
└── sveltekit/
    └── routes/
        ├── +page.svelte        # Maps to /
        └── [id]/
            └── +page.svelte    # Maps to /:id
```

The adapter automatically normalizes `[id]` to `:id` and registers the routes for you.

---

## Writing a Custom Adapter

Implement `IFrameworkAdapter`:

```typescript
import type { IFrameworkAdapter, IRoute } from "virtual-module-core";

export class NextJsAdapter implements IFrameworkAdapter {
  detect(module: any): boolean {
    // Check for 'nextjs/' directory or similar
    return !!module.nextjs_routes;
  }

  async parse(module: any): Promise<IRoute[]> {
    const routes: IRoute[] = [];

    // 1. Scan module files
    // 2. Convert conventions
    //    e.g. page.tsx -> type: 'page'
    //    e.g. route.ts -> type: 'api'
    //    e.g. [slug] -> :slug

    routes.push({
      path: "/blog/:slug", // Normalized
      component: module.BlogPostComponent,
      type: "page",
      metadata: { framework: "nextjs" },
    });

    return routes;
  }
}
```

## Core Routing Rules (For Adapter Authors)

When producing `IRoute` objects, ensure:

1. **Paths are Normalized**:
   - Use `:param` for dynamic segments.
   - Use `*` for catch-all.
   - No `(...)` groups in the final path (strip them).

2. **Types are Standardized**:
   - Map your framework's "Page" to `'page'`.
   - Map "Layout" to `'layout'`.
   - Map "API/Server" to `'api'`.

3. **Metadata is used for extras**:
   - Don't overload the core fields. Put framework specific flags in `metadata`.
