# Virtual Module Core

## Overview

This library serves as the foundational shared kernel for the Virtual Module architecture. 

### The Dependency Injection Bridge

As defined in the [AppShell Architecture](https://github.com/reidlai/ta-workspace/blob/main/docs/APPSHELL-ARCHITECTURE.md) and [Virtual Module Architecture](https://github.com/reidlai/portfolio-virtmod/blob/main/docs/VIRTUAL-MODULE-ARCHITECTURE.md), this package plays the critical role of a **Dependency Injection (DI) Bridge**.

It exports the unified `DIContainer` and `Registry` types that facilitate a decoupled contract between the Host and Modules:

1.  **The Host (AppShell)** is responsible for instantiating the `DIContainer` and registering concrete implementations of core services (e.g., EventBus, Navigation, Auth).
2.  **Virtual Modules** (e.g., `portfolio-virtmod`) depend *only* on the interfaces exported by this core package. They inject services from the container at runtime.

This design ensures that Virtual Modules remain agnostic to the host implementation, enabling strict standard-based integration as long as the host fulfills the DI contract.

## Quick Start

Install the package directly from GitHub using `pnpm`:

```bash
pnpm add github:reidlai/virtual-module-core
```

## Usage

### 1. Implementing a Virtual Module

Modules implement the `ModuleInit` function to interact with the host's DI container.

```typescript
import type { ModuleInit, IContext, IModuleBundle } from 'virtual-module-core';

export const initialize: ModuleInit = async (ctx: IContext): Promise<IModuleBundle> => {
  // 1. Consume services provided by the AppShell
  const auth = ctx.getService<any>('auth');
  
  // 2. Register module-specific services
  ctx.register('my-service', { doSomething: () => {} });

  // 3. Return the module bundle definition
  return {
    id: 'my-feature-module',
    widgets: [
      {
        id: 'feature-widget',
        title: 'My Feature',
        component: MySvelteComponent, // Import your Svelte component
        location: 'dashboard',
        size: 'medium'
      }
    ],
    routes: [
      { path: '/feature', component: FeaturePageComponent }
    ]
  };
};
```

### 2. AppShell (Host) Integration

The AppShell initializes the core containers and loads modules.

```typescript
import { DIContainer, Registry, type IContext } from 'virtual-module-core';

// 1. Setup Core Systems
const container = DIContainer.getInstance();
const registry = Registry.getInstance();

// 2. Register Host Services
container.register('auth', new AuthService());
container.register('router', new RouterService());

// 3. Create Context for Modules
const moduleContext: IContext = {
  config: { /* app config */ },
  register: (key, service) => container.register(key, service),
  getService: (key) => container.resolve(key)
};

// 4. Load & Register a Module (Pseudo-code)
import { initialize as initMyModule } from 'my-feature-module';

const bundle = await initMyModule(moduleContext);
registry.register(bundle);
```

## Development

### Running Tests

Run the unit tests using:

```bash
npm test
```

```bash
npm test
```

### Quality Gates

This project uses [pre-commit](https://pre-commit.com/) to enforce code quality before every commit.

**Prerequisites:**
- Install pre-commit: `pip install pre-commit` (or `brew install pre-commit`)

**Setup:**
Initialize the hooks in your local repository:
```bash
pre-commit install
```

**What it checks:**
1.  **Standard Fixes**: Trailing whitespace, EOF newlines, YAML syntax.
2.  **Formatting**: Runs `prettier` to ensure consistent code style.
3.  **Linting**: Runs `eslint` to catch static code issues.
4.  **SCA**: Runs `npm audit` to check for vulnerable dependencies.
5.  **SAST / Secrets**: Runs `detect-secrets` to prevent committing secrets/credentials.
6.  **Unit Tests**: Runs `npm test` to ensure no regressions are committed.

To run checks manually without committing:
```bash
pre-commit run --all-files
```

> [!NOTE]
> If `detect-secrets` fails due to a false positive, you can update the baseline:
> `detect-secrets scan > .secrets.baseline`

## References

- [AppShell Architecture](https://github.com/reidlai/ta-workspace/blob/main/docs/APPSHELL-ARCHITECTURE.md)
- [Virtual Module Architecture](https://github.com/reidlai/portfolio-virtmod/blob/main/docs/VIRTUAL-MODULE-ARCHITECTURE.md)

## License

MIT
