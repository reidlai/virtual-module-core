# Virtual Module Core

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A **framework-agnostic** core library for the Virtual Module Architecture. It provides a dependency injection container and a generic routing engine that powers modular applications.

## Overview

> **Note**: This is a polyglot repository. TypeScript/SvelteKit code is in [`sveltekit/`](sveltekit/), and Go code will be in `go/`. Import paths remain unchanged for npm consumers.

Modern web apps often need to share features across different frameworks (SvelteKit, Next.js, etc.). `virtual-module-core` solves this by introducing an **Adapter Pattern**:

1.  **Core Library**: Handles generic route matching, sorting, and conflict detection. It manages complete **Module Bundles** containing routes, widgets, and handlers.
2.  **Adapters**: Pluggable translations that convert framework-specific conventions (like SvelteKit's `+page.svelte` or `widgets/`) into the Core's generic schema.

## Features

- **Dependency Injection**: Lightweight container for service management.
- **Generic Routing**: Support for dynamic params (`:id`), wildcards (`*`), and optional params.
- **Full Module Bundles**: First-class support for widgets and background handlers.
- **Conflict Detection**: Prevents multiple modules from reclaiming the same route path.
- **SvelteKit Adapter**: Native support for SvelteKit file-based routing and structure.

## Quick Start

### 1. Installation

```bash
pnpm add github:reidlai/virtual-module-core
```

### 2. Registering Modules (in App Shell)

```typescript
import { Registry, SvelteKitAdapter } from "virtual-module-core";
import * as myModule from "@modules/my-auth-module"; // See docs/VIRTUAL-MODULE-ARCHITECTURE.md for standards

const registry = new Registry();
const adapter = new SvelteKitAdapter();

// Register the module - Adapter automatically detects and parses routes, widgets, and handlers
await registry.registerModule(myModule, adapter);

// Usage: Match a path
const match = registry.getRouter().match("/login");
if (match) {
  console.log("Matched route:", match.route.path);
}
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- [**App Shell Architecture**](docs/APPSHELL-ARCHITECTURE.md): Guidelines for host applications.
- [**Virtual Module Architecture**](docs/VIRTUAL-MODULE-ARCHITECTURE.md): Architecture of virtual modules.
- [**Monorepo Architecture**](docs/MONOREPO-ARCHITECTURE.md): Guidelines for monorepo structure.
- [**Developer Guide**](docs/DEVELOPER-GUIDE.md): Tutorial for using the library and building modules.
- [**SDK Reference**](docs/SDK-REFERENCE.md): API documentation for `IModuleBundle`, `IFrameworkAdapter`, etc.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
