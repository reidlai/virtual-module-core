# Virtual Module Architecture

**Primary Reference**: [APPSHELL-ARCHITECTURE.md](docs/APPSHELL-ARCHITECTURE.md) (Core System Design)

| Component            | Source Repository                                                         |
| :------------------- | :------------------------------------------------------------------------ |
| **Host Workspace**   | [reidlai/ta-workspace](https://github.com/reidlai/ta-workspace)           |
| **Portfolio Module** | [reidlai/portfolio-virtmod](https://github.com/reidlai/portfolio-virtmod) |
| **Watchlist Module** | [reidlai/watchlist-virtmod](https://github.com/reidlai/watchlist-virtmod) |

## Overview

This document describes the **polyglot Virtual Module** pattern used to extend App Shell architecture. Based on the foundational principles defined in [APPSHELL-ARCHITECTURE.md](docs/APPSHELL-ARCHITECTURE.md), virtual modules (such as [Portfolio](https://github.com/reidlai/portfolio-virtmod) and [Watchlist](https://github.com/reidlai/watchlist-virtmod)) are developed as independent repositories and integrated as Git submodules. This architecture enables feature teams to build, test, and version modules independently while the host AppShell orchestrates them into a unified experience at runtime.

### Module Structure

Following the workspace standard defined in [`DEVELOPER-GUIDE.md`](https://github.com/reidlai/ta-workspace/blob/main/docs/DEVELOPER-GUIDE.md#architecture-summary):

```mermaid
flowchart TD
    %% Subgraph for Host Application
    subgraph HostApp ["Host Application (sveltekit-appshell)"]
        direction TB
        Loader["ModuleLoader<br/>(Discovery)"]
        Registry[["Registry / DI Container<br/>(Orchestration)"]]
        AppRouter["App Router"]
    end

    %% Subgraph for Virtual Module
    subgraph VirtualModule ["Virtual Module (e.g. Portfolio)"]
        direction TB
        Init["init(context)<br/>(Initialization)"]

        %% Frontend Layer
        subgraph Frontend ["Frontend Layer (SvelteKit)"]
            Widgets["Widgets<br/>(UI Components)"]
            Pages["Pages<br/>(Routes)"]
            Runes["Svelte Runes<br/>(.svelte.ts)"]
        end

        %% Shared Logic
        subgraph Shared ["Shared Logic (TypeScript)"]
            Services["RxJS Services<br/>(Business Logic)"]
            Schemas["Zod Schemas<br/>(SSOT / Data Contract)"]
        end

        %% Backend Layer
        subgraph Backend ["Backend Layer (Go)"]
            GoService["Go Service<br/>(Implementation)"]
            GoaDSL["Goa DSL<br/>(API Definition)"]
            OpenAPI["OpenAPI Spec<br/>(Generated)"]
        end
    end

    %% Lifecycle & Wiring
    Loader -- "Discovers & Loads" --> Init
    Init -- "Returns Bundle" --> Registry
    Registry -- "Mounts" --> Widgets
    Registry -- "Registers" --> Pages
    AppRouter -- "Routes To" --> Pages
    Registry -- "Provides Deps" --> Services

    %% Internal Module Flow
    Services -- "Validates vs" --> Schemas
    Services -- "Streams Data" --> Runes
    Runes -- "Reactive Updates" --> Widgets
    Schemas -- "Mapped to" --> GoaDSL
    GoaDSL -- "Generates" --> GoService
    GoaDSL -- "Generates" --> OpenAPI

    %% Contract Verification Loop
    OpenAPI -. "Verified against" .-> Schemas

    %% Styling
    style HostApp fill:#f0f4f8,stroke:#334155,stroke-width:2px,color:#1e293b
    style VirtualModule fill:#f0fdf4,stroke:#166534,stroke-width:2px,color:#14532d
    style Frontend fill:#dbeafe,stroke:#1e40af,stroke-dasharray: 5 5
    style Shared fill:#ffedd5,stroke:#c2410c,stroke-dasharray: 5 5
    style Backend fill:#e0e7ff,stroke:#4338ca,stroke-dasharray: 5 5
```

```
[module_name]/
├── go/                              # Backend Layer (Goa)
│   ├── design/                      # Goa DSL (defines API contract)
│   ├── goa_gen/                     # Generated Goa code
│   ├── pkg/                         # Service implementations (Business Logic)
│   └── moon.yml                     # Go project tasks
├── ts/                              # Shared Logic Layer (Transport & State)
│   ├── src/
│   │   ├── lib/                     # Core libraries (e.g. api-client.ts, schemas.ts)
│   │   ├── services/                # ✅ RxJS services (Transport decoupling)
│   │   ├── utils/                   # Shared utilities (e.g. logger)
│   │   └── index.ts                 # ✅ SSOT: Exports all schemas + services
│   ├── package.json
│   └── moon.yml                     # TypeScript project tasks
├── sveltekit/                       # UI Layer (SvelteKit)
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/ui/       # ShadCN Svelte components
│   │   │   ├── widgets/             # Reusable UI widgets (Registry-bound)
│   │   │   └── runes/               # Svelte 5 runes (Adapter pattern for RxJS)
│   │   └── routes/                  # SvelteKit routes (Module-specific pages)
│   ├── package.json                 # Depends on: "@modules/[module_name]-ts": "workspace:*"
│   └── moon.yml                     # Svelte project tasks
└── moon.yml                         # Module root aggregated tasks

Dependency Flow: sveltekit → ts ← go (one-way, no circular dependencies)
```

**Key Principles**:

- **Schemas and API client in `ts/src/lib/`**: Avoids circular dependencies (see [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md#data-contract-zod-schemas))
- **RxJS Services in `ts/src/services/`**: Expose reactive Observables bridged to **Svelte Runes** via the State Adapter Pattern (see [APPSHELL-ARCHITECTURE.md](APPSHELL-ARCHITECTURE.md#rxjs--svelte-rune-integration))

## Integration Model

### Git Submodule Integration

Virtual Modules are developed as **independent Git repositories** and integrated into the host platform ([reidlai/ta-workspace](https://github.com/reidlai/ta-workspace)) as Git submodules.

**Integration Steps**:

1. **Add as Submodule** (from workspace root):
   ```bash
   git submodule add git@github.com:reidlai/[module_name]-virtmod.git modules/[module_name]
   git submodule update --init --recursive
   ```

2. **Configure Workspace**:
   To ensure the host AppShell and build system can see the new module, updates are required in three key configuration files:
   - **`.moon/workspace.yml`**: Add the module's sub-projects to the `projects` map (e.g., `modules/[module_name]/go`, `modules/[module_name]/ts`, `modules/[module_name]/sveltekit`).
   - **`pnpm-workspace.yaml`**: Add the module's root path (e.g., `modules/[module_name]/**`) to include its packages in the pnpm workspace.
   - **`go.work`**: Add the backend path (e.g., `./modules/[module_name]/go`) to the Go workspace for cross-module development.

3. **Install & Sync**:
   ```bash
   pnpm install
   moon sync
   ```

### Runtime Integration (Module Registry)

Modules are **NOT** standalone services. They provide artifacts that are statically or dynamically integrated:
- **Backend**: Go services are instantiated and passed into the host server via Dependency Injection.
- **Frontend**: The `ModuleLoader` discovers the module entry point (`index.ts`), and the module's `init()` function registers its widgets, handlers, and routes with the **`Registry`**.

---

## Component Boundaries

The architecture follows a strict **UI-First** design flow: `UI (Svelte)` → `API Contract (Schema)` → `Reactive State (RxJS)` → `Implementation (Go)`.

### 1. Frontend Layer (SvelteKit)

**Role**: Presentation and User Interaction.
**Reactivity**: Uses **Svelte 5 Runes** for predictable, high-performance UI state.

#### State Adapter Pattern
Since business logic lives in the Shared Logic layer (RxJS), Svelte modules implement a **State Rune Class** to bridge backend streams into the UI.

```typescript
// modules/[module_name]/sveltekit/src/lib/runes/[Module]State.svelte.ts
import { [module]RxService } from "@modules/[module]-ts";

export class [Module]State {
  // Svelte 5 Reactive State
  data = $state<any>(null);
  loading = $state(false);

  constructor() {
    // Bridge RxJS Observable -> Svelte Rune
    [module]RxService.data$.subscribe((val) => {
      this.data = val;
      this.loading = false;
    });
  }
}
export const [module]State = new [Module]State();
```

**Boundaries**:
- No direct dependency on API clients; consumes data only through RxJS services.
- UI components use `$props()` to support Dependency Injection and testability.

### 2. Shared Logic Layer (TypeScript)

**Role**: Single Source of Truth (SSOT), Data Validation, and State Management.
**Tooling**: Zod + RxJS.

This layer acts as a buffer between the raw backend API and the frontend UI, ensuring **Transport Independence**.

**Pattern**: SSOT + RxJS Service
- **`ts/src/lib/`**: Contains the Zod schemas and the generated API client.
- **`ts/src/services/`**: Contains the RxJS services that encapsulate API calls and manage reactive state.
- **`ts/src/index.ts`**: The SSOT entry point that exports all public interfaces and handles for the module.

**Boundaries**:
- Strictly decoupled from Svelte; can be used by any TypeScript-based shell (e.g., NextJS).
- Validates all incoming data via Zod before emitting it to observers.

### 3. Backend Layer (Go)

**Role**: Persistence, Business Logic, and Contract Fulfillment.
**Tooling**: Goa.

The backend satisfies the API contract derived from the Shared Logic layer.

**Pattern**: Design-First with OpenAPI Verification
- **`go/design/`**: Defines the API and data types using Goa DSL (mapped from Zod schemas).
- **`go/pkg/`**: Implements the service interface generated by Goa.
- **OpenAPI Loop**: The generated `openapi3.json` is verified against the Zod schemas in the Shared Logic layer to ensure full contract alignment (Loop Closure).

**Boundaries**:
- No knowledge of the frontend; purely implements the transport-agnostic interface defined in the design.
- Persistence and infrastructure (logging, DB) are provided via Dependency Injection from the host AppShell.

## Dependency Management

### Go Dependencies

```go
// go.mod
module github.com/reidlai/ta-workspace/modules/portfolio/go

require (
    goa.design/goa/v3 v3.23.4
    // Host app provides: logger, DB, config
)
```

**Pattern**: Dependency Injection

- Module declares interfaces
- Host app provides implementations

### Node Dependencies

```json
// sveltekit/package.json
{
  "dependencies": {
    "@core/types": "workspace:*" // From host
  }
}
```

**Pattern**: Workspace Protocol

- Shared types via monorepo workspace
- No version conflicts

## Security Model

### Threat Surface

The module inherits the host app's security posture:

- **Authentication**: Host's session middleware
- **Authorization**: Host's RBAC policies
- **Data Access**: Host's DB connection pool
- **Network**: Host's TLS termination

### Threat Modeling

See `threat_modelling/tm.py` for PyTM model:

- Assumes trusted host environment
- No direct external exposure
- Data flows through host's API gateway

---

## UI-First Development Workflow

**Primary Reference**: [DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)

This module follows a strictly phased **UI-First** design philosophy. Backend implementation only begins after UI behaviors and data contracts are validated in isolation.

### The 9-Step Sequence

#### Step 1: Create UI Components
- **Path**: `sveltekit/src/lib/widgets/[WidgetName].svelte`
- **Goal**: Build the UI using **ShadCN Svelte** and Svelte 5 `$state`. Use hardcoded local variables initially to focus on layout and UX.

#### Step 2: Create Local Types for Storybook
- **Path**: `sveltekit/src/lib/widgets/[WidgetName].types.ts`
- **Goal**: Define the interfaces required to drive the UI. This acts as the initial "Design Contract".

#### Step 3: Create Storybook Scenarios
- **Path**: `sveltekit/src/lib/widgets/[WidgetName].stories.ts`
- **Goal**: Create various scenarios (Loading, Empty, Data, Error) with sample data. Validate the component's look and feel with stakeholders.

#### Step 4: Define State Types (Runes & Stores)
- **Path**: `sveltekit/src/lib/runes/[Module]State.svelte.ts`
- **Goal**: Define the state classes that will eventually hold the data. Use `$state`, `$derived`, and `$props` (runes) to support SvelteKit's reactivity model.

#### Step 5: Create Goa Design DSL
- **Path**: `go/design/design.go`
- **Goal**: Formalize the design contract in Go. Define services, methods, and types using Goa DSL, ensuring they align with the requirements identified in Step 2.

#### Step 6: Generate API Server Interface
- **Command**: `moon run [module_name]-go:goa-gen`
- **Goal**: Use Goa to generate the transport layer and the service interface in Golang.

#### Step 7: Implement API Server
- **Path**: `go/pkg/service.go`
- **Goal**: Implement the business logic and persistence layer that satisfies the generated interface.

#### Step 8: Generate TypeScript API Client
- **Tooling**: Goa + Zodios
- **Path**: `ts/lib/api-client.ts`
- **Goal**: Use the Goa-generated OpenAPI spec to generate a TypeScript client that supports **Zod schemas** and the **Zodios** API client. This ensures the frontend uses the exact same data contract as the backend.

#### Step 9: Integrate RxJS, Runes, and Client
- **Path**: `ts/src/services/[Module]RxService.ts`
- **Goal**: Bridge the three layers. The RxJS service calls the API client, validates the results via Zod, and performs any necessary **payload transformations** before the data is consumed by the **Svelte Runes** in the UI.

---

## App Architecture Constraints

### 1. Mockability

**Rule**: All external dependencies (Host APIs, DBs, Auth) MUST be mockable to support isolated development and testing.

- **Go**: Services must depend on **Interfaces**, not concrete structs. Use the Goa-generated interfaces to ensure transport independence.
- **RxJS**: Services must provide a `usingMockData` mode to emit simulated payloads without a live backend.
- **Svelte**: Components must receive data through `$props()` or context-injected Runes to facilitate Storybook testing.

### 2. Dependency Injection

**Rule**: No hardcoded instantiations of infrastructure clients within the core logic.

- **Pattern**: Use Service Factories (e.g., `New[Module]Service(logger, db, deps...)`) to inject dependencies at the AppShell entry point.
- **Frontend**: Register service instances with the **`Registry`** during the `init()` phase.

---

## Testing Strategy

### Unit Tests
Test each layer in isolation within the module directory.

```bash
# Test Go logic
moon run [module_name]-go:test

# Test Shared Logic (RxJS/Zod)
moon run [module_name]-ts:test

# Test UI Components
moon run [module_name]-sveltekit:test
```

### Integration Tests
Test the module within the host AppShell context.

```bash
# Test backend integration in the shell
moon run go-server:test

# Test frontend integration in the shell
moon run sveltekit-appshell:test
```

**Boundaries**:
- **Unit Tests**: Mock all host dependencies (DB, logger, shell context).
- **Integration Tests**: Use host's test fixtures and real internal registry routing.

---

## Deployment

### Build Artifacts
Virtual Modules produce **no independent artifacts**. They are compiled/bundled into the host:

- **`go-server`**: The module's Go implementation is imported and compiled into the main server binary.
- **`sveltekit-appshell`**: The module's Svelte widgets and TypeScript logic are bundled into the shell's frontend build.

### Release Process
1. Module changes are committed to the independent `[module_name]-virtmod` repository.
2. The host workspace (`ta-workspace`) updates the Git submodule reference.
3. Host CI rebuilds the shell binaries/bundles with the new module code.
4. A single deployment of the host app includes all module updates.

---

## Migration Considerations

### From Standalone to Virtual Module
If migrating an existing service:
1. **Remove Main Entry**: Delete the `main.go`.
2. **Implement Factory**: Convert logic to the service factory pattern with interface-based DI.
3. **Externalize Infrastructure**: Remove DB schema ownership and auth middleware (rely on host injections).
4. **Register with Shell**: Implement the `init()` entry point to register widgets and routes.

### Future Standalone Extraction
If a module needs to become standalone:
1. **Add Main Entry**: Create a new `main.go` and HTTP server setup.
2. **Restore Infrastructure**: Re-add database migrations and auth middleware.
3. **Expose Directly**: Convert internal Registry-bound widgets/routes into standard standalone pages.
