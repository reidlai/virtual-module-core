# AppShell Architecture

This document describes the **AppShell Architecture** which covers frontend (SvelteKit), state management (RxJS) and backend (Go/Goa) appshells, explaining how modules are dynamically injected at runtime.

## Overview

The AppShell pattern provides a **host application** that loads and orchestrates virtual (feature) modules at runtime. This enables:

- **Modularity**: Virtual modules are developed independently in `modules/` or as GitHub submodules
- **Composition**: Apps in `apps/` compose modules as needed
- **Shared Core**: Common types and utilities provided by `virtual-module-core` package

```mermaid
flowchart TD
    subgraph Apps["apps/"]
        SV[sveltekit-appshell<br/>SvelteKit Frontend]
        TA[go-server<br/>Go Backend]
    end

    subgraph Modules["modules/"]
        WL[watchlist<br/>go/, ts/, svelte/]
        PF[portfolio<br/>go/, ts/, svelte/]
    end

    subgraph External["External Packages"]
        Core[virtual-module-core<br/>Types, Registry, DI]
    end

    SV -->|imports| Core
    SV -->|loads| WL
    SV -->|loads| PF
    WL --> |imports| Core
    PF --> |imports| Core
    TA -->|imports| WL
    TA -->|imports| PF
```
---

## Core Architectural Principles

The AppShell Architecture is built upon **SOLID principles** and **Dependency Injection (DI)** to ensure a decoupled, maintainable, and extensible system.

### SOLID Principles

| Principle                 | Application in AppShell                                                                                                                                                             |
| :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S**ingle Responsibility | Each **Virtual Module** focuses on a specific business domain (e.g., Portfolio, Watchlist), while the **AppShell** focuses solely on orchestration and common infra.                |
| **O**pen/Closed           | The **AppShell** is **open for extension** (it can load any number of new modules at runtime) but **closed for modification** (the core shell code doesn't change to add features). |
| **L**iskov Substitution   | Every module must satisfy the `IModuleBundle` interface. The Shell handles any object that implements this interface without needing to know the concrete module type.              |
| **I**nterface Segregation | Consumers only depend on specific, small interfaces like `IWidget`, `IHandler`, or `IStore`, preventing modules from being forced to implement unnecessary logic.                   |
| **D**ependency Inversion  | High-level AppShell logic depends on **abstractions** (interfaces in `virtual-module-core`) rather than concrete implementations of feature modules.                                |

### Dependency Injection (DI)

Dependency Injection is the mechanism used to provide a module's dependencies at runtime, rather than hard-coding them.

#### Frontend DI (Registry)
In the SvelteKit frontend, the **`Registry`** acts as a lightweight DI container.
- **Provider**: Modules "provide" their services, widgets, and handlers by registering them with the Registry during the `init` phase.
- **Consumer**: Components or other services "inject" these dependencies by requesting them from the Registry (e.g., `registry.getService('PortfolioService')`).
- **Benefit**: This allows us to swap a "real" service with a "mock" service in testing or development without changing the consuming component.

#### Backend DI (Go/Goa)
In the Go backend, DI is handled during the server startup:
- **Service Wiring**: The `api-server.go` (or a dedicated DI package) instantiates the concrete service implementations and passes them into the Goa-generated endpoints.
- **Decoupling**: The transport layer (HTTP/gRPC) is decoupled from the business logic, making it easy to test services in isolation using mock database clients or secondary services.

---

## Frontend AppShell (sveltekit-appshell)

The SvelteKit frontend uses a **Registry** singleton and **ModuleLoader** to dynamically discover and load modules.

### Module Discovery

[ModuleLoader.ts](file:///c:/Users/reidl/GitLocal/ta-workspace/apps/sveltekit-appshell/src/lib/loader/ModuleLoader.ts) uses Vite's `import.meta.glob` to discover modules:

```typescript
// Glob pattern discovers all module entry points
private static moduleGlob = import.meta.glob('../../../../../modules/*/*/src/index.ts');

static async loadModules(context: IContext, config: IAppConfig[]): Promise<void> {
    for (const moduleConfig of config) {
        if (!moduleConfig.enabled) continue;
        const matchedKey = Object.keys(this.moduleGlob).find(key =>
            key.includes(`/${moduleConfig.src}/`) && key.includes('/src/index.ts')
        );
        if (matchedKey) {
            const module = await this.moduleGlob[matchedKey]();
            const initFn = module.init || (module.default && module.default.init);
            if (typeof initFn === 'function') {
                const bundle = await initFn(context);
                registry.register(bundle);
            }
        }
    }
}
```

### Registry Singleton

The `Registry` class from `virtual-module-core` stores all registered modules:

```typescript
import { IModuleBundle, IWidget, IHandler, IRoute } from "../types";

export class Registry {
  private static instance: Registry;
  private modules = new Map<string, IModuleBundle>();
  private widgetMap = new Map<string, IWidget>();
  private handlers: IHandler[] = [];
  private servicesMap = new Map<string, any>();

  register(bundle: IModuleBundle): void {
    this.modules.set(bundle.id, bundle);
    // Auto-register widgets, handlers, services
    if (bundle.widgets) {
      for (const widget of bundle.widgets) {
        this.widgetMap.set(widget.id, widget);
      }
    }
    if (bundle.handlers) {
      this.handlers.push(...bundle.handlers);
    }
  }
}
```

---

## Virtual Module Interfaces

All modules implement `IModuleBundle` from `virtual-module-core/types`:

```typescript
// virtual-module-core/src/types/index.ts

export interface IModuleBundle {
  id: string;
  widgets?: IWidget[]; // Dashboard tiles, UI components
  handlers?: IHandler[]; // Menu actions, commands
  services?: Record<string, any>;
  routes?: IRoute[]; // Internal navigation routes
}

export interface IWidget {
  id: string;
  title: string;
  component: any; // Svelte component
  location?: string; // 'dashboard', 'sidebar', 'header'
  size?: "small" | "medium" | "large";
}

export interface IHandler {
  id: string;
  title: string;
  execute: (context: IContext) => void | Promise<void>;
}

export type ModuleInit = (context: IContext) => Promise<IModuleBundle>;
```

---

## Module Injection Lifecycle

The AppShell orchestrates the lifecycle of a module from discovery to runtime integration.

### 1. Discovery Phase (Vite)
The `ModuleLoader` uses Vite's `import.meta.glob` to scan the `modules/` directory for entry points (`index.ts`). This is a static analysis phase where Vite creates a mapping of paths to dynamic import functions.

### 2. Initialization Phase
For each enabled module, the shell calls its `init(context)` function.
- **`IContext`**: The shell passes a context object containing shared resources (logger, global config, adapter).
- **Module Autonomy**: The module is responsible for its own internal discovery (e.g., using its own `import.meta.glob` to find its Svelte routes or widgets).

### 3. Registration Phase
The module returns an `IModuleBundle`, which the shell passes to the **`Registry`**.
- The `Registry` stores the bundle and maps its components (widgets by ID, routes by path).
- Services are added to the Registry's internal dependency container.

### 4. Runtime Integration
The Shell UI components (Sidebar, Dashboard, Router) are "registry-aware":
- **Sidebar**: Queries the Registry for all registered `IHandler` items to build the navigation menu.
- **Dashboard**: Iterates through `IWidget` items with `location: 'dashboard'` to render tiles.
- **Router**: The catch-all route `[...rest]/+page.svelte` matches the current URL against the Registry's route map to render the correct module page.

---
```

### Example: Registering a Widget

```typescript
// modules/[module_name]/sveltekit/src/index.ts
import WidgetComponent from "$lib/widgets/WidgetComponent.svelte";
import { <module_name>Service } from "@modules/<module_name>-ts";

// SvelteKit 2: Auto-discover routes (pages, layouts, errors)
// This glob pattern captures all nested routes within src/routes
const routeFiles = import.meta.glob("./routes/**/+{page,layout,error}.svelte", {
  eager: true,
});

export const init: ModuleInit = async (context) => {
  // Helper to convert file paths to route objects.
  // This preserves 100% compatibility with SvelteKit 2 routing:
  // - Layouts (+layout.svelte): Automatically wrap detailed child pages.
  // - Pages (+page.svelte): Render content for the specific route match.
  // - Errors (+error.svelte): Catch errors within their directory scope.
  //
  // Routing Patterns Supported (Nested & Dynamic):
  // - Basic: ./routes/about/+page.svelte -> /about
  // - Nested: ./routes/settings/profile/+page.svelte -> /settings/profile
  // - Dynamic: ./routes/blog/[slug]/+page.svelte -> /blog/[slug]
  // - Sub-path Dynamic: ./routes/shop/[category]/[item]/+page.svelte -> /shop/[category]/[item]
  // - Catch-all: ./routes/[...rest]/+page.svelte -> /[...rest]
  const routes = import.meta.glob('./routes/**/+*.{svelte,ts}', { eager: true });
  const bundle = await adapter.parse(routes);
  bundle.id = "[module_name]";
  bundle.services = {
    <module_name>Service: <module_name>Service,
  };
  bundle.widgets = [
    {
      id: "widget-id",
      title: "Widget Title",
      component: WidgetComponent,
      location: "dashboard",
      size: "small",
    },
  ];
  return bundle;
};

  
```

### Widget Navigation

Widgets can trigger navigation to module routes using SvelteKit's `goto`:

```svelte
<script>
import { goto } from '$app/navigation';
</script>

<button onclick={() => goto('/portfolio')}>
    View Portfolio
</button>
```

Routes defined in `IModuleBundle.routes` are matched by the Registry's `getRouter().match()` method and rendered via SvelteKit's catch-all route (`[...rest]/+page.svelte`).

---

## Backend AppShell (go-server)

The Go backend uses the **Goa framework** with service injection from virtual modules.

### Why Goa?

[Goa](https://goa.design) is a **design-first** API framework for Go that provides:

| Feature                | Benefit                                                   |
| ---------------------- | --------------------------------------------------------- |
| **DSL-based Design**   | API contracts defined in Go code, not YAML/JSON           |
| **Code Generation**    | Server stubs, clients, OpenAPI specs auto-generated       |
| **Type Safety**        | Compile-time validation of request/response types         |
| **Transport Agnostic** | Same design generates HTTP, gRPC, or WebSocket handlers   |
| **Middleware Support** | Integrates with Chi router for flexible middleware chains |

This aligns with the virtual module pattern—each module defines its API contract, and Goa generates the transport layer.

### Extending to MCP Servers (goa-ai)

[Goa-AI](https://goa.design/ai) extends Goa for building **Model Context Protocol (MCP)** servers, enabling AI agents to discover and invoke your services:

```go
// Future: apps/mcp-server/design/design.go
import (
    . "goa.design/goa/v3/dsl"
    "goa.design/ai/dsl"
)

var _ = ai.Agent("ta-assistant", func() {
    ai.Description("Technical Analysis Assistant Agent")

    // Expose existing services as AI tools
    ai.Tool("get-watchlist", func() {
        ai.Description("Retrieve user's stock watchlist")
        ai.ToolService(WatchlistService)  // Reference existing Goa service
    })

    ai.Tool("get-portfolio-insights", func() {
        ai.Description("Get AI-generated portfolio insights")
        ai.ToolService(PortfolioService)
    })
})
```

**MCP Server Benefits:**

- **Tool Discovery**: LLMs automatically discover available tools
- **Typed Contracts**: Same Goa type safety for AI interactions
- **Streaming**: Built-in support for streaming responses to agents
- **Temporal Durability**: Goa-AI integrates with Temporal for robust workflows

**Architecture with MCP:**

```mermaid
flowchart LR
    subgraph Apps["apps/"]
        API[go-server<br/>REST API]
        MCP[mcp-server<br/>AI Tools]
    end

    subgraph Modules["modules/"]
        WL[watchlist/go]
        PF[portfolio/go]
    end

    API -->|imports| WL
    API -->|imports| PF
    MCP -->|imports| WL
    MCP -->|imports| PF

    LLM[LLM Agent] -->|MCP Protocol| MCP
    Client[Frontend] -->|HTTP| API
```

### Goa Design Pattern

Each module defines its API in a `design/*.go` file:

```go
// modules/portfolio/go/design/portfolio.go
var _ = Service("portfolio", func() {
    Description("Provide AI insights")

    Method("list", func() {
        Payload(func() {
            Attribute("user_id", String, "User ID")
            Required("user_id")
        })
        Result(ArrayOf(Insight))
        HTTP(func() {
            GET("/portfolio")
            Header("user_id:X-User-ID")
        })
    })
})
```

### Service Injection

[api-server.go](file:///home/reidlai/GitLocal/ta-workspace/apps/go-server/cmd/api-server.go) wires module services:

```go
// Import module implementations
import (
    portfolio "github.com/reidlai/ta-workspace/modules/portfolio/go/pkg"
    watchlist "github.com/reidlai/ta-workspace/modules/watchlist/go/pkg"
)

// Initialize services via DI container
services := di.NewServices(logger)
watchlistEndpoints := services.WatchlistEndpoints
portfolioEndpoints := services.PortfolioEndpoints

// Mount on HTTP server
HandleHTTPServer(ctx, u, watchlistEndpoints, portfolioEndpoints, ...)
```

---

## RxJS as a Decoupling Layer

RxJS services (in `modules/*/ts`) act as the **source of truth** and a decoupling layer between the backend API and the SvelteKit frontend.

### Benefits of the RxJS Layer

1.  **Transport Independence**: UI components never interact with `fetch`, `axios`, or specific API clients. They only subscribe to Observables (`tickers$`, `error$`). This allows swapping HTTP for WebSockets or gRPC-web without changing a single Svelte component.
2.  **State Persistence**: Since the RxJS service is a singleton (often held in the Registry), state persists across navigation. Moving from `/dashboard` to `/watchlist` doesn't require a re-fetch if the data is already in the `BehaviorSubject`.
3.  **Data Normalization & Validation**:
    *   **Zod Integration**: Services use Zod schemas to validate backend responses. If the API changes or breaks its contract, the error is caught and handled at the service layer, preventing UI crashes.
    *   **Transformation**: The service can transform complex backend JSON into a "UI-ready" shape before emitting it to observers.
4.  **Decoupled Development (Mocking)**:
    *   Services implement a `usingMockData` toggle.
    *   Frontend developers can build and test entire features using mock data emitted by the RxJS subjects, completely independent of the backend's status.

---

## RxJS + Svelte Rune Integration

The architecture uses **RxJS** for cross-framework business logic and **Svelte 5 Runes** for high-performance UI reactivity.

### State Adapter Pattern
Business logic services (in `modules/*/ts`) expose RxJS Observables. Svelte modules (in `modules/*/svelte`) use a **State Rune Class** to bridge these observables into Svelte's reactive system.

```typescript
// modules/watchlist/svelte/src/lib/runes/WatchlistState.svelte.ts
import { watchlistRxService } from "@modules/watchlist-ts";

class WatchlistState {
  // $state: Deeply reactive source of truth
  tickers = $state<ITicker[]>([]);
  loading = $state(false);

  // $derived: Auto-updating computed value
  tickerCount = $derived(this.tickers.length);

  constructor() {
    // Bridge RxJS -> Svelte Rune
    watchlistRxService.watchlist$.subscribe((data) => {
      this.tickers = data.tickers;
      this.loading = false;
    });
  }

  public refresh() {
    this.loading = true;
    watchlistRxService.getWatchlist();
  }
}

export const watchlistState = new WatchlistState();
```

### Component Usage ($props)
Components receive data either from the global State Rune or via `$props()` for dependency injection.

```svelte
<!-- modules/watchlist/svelte/src/lib/widgets/WatchlistWidget.svelte -->
<script lang="ts">
  import { watchlistState } from "../runes/WatchlistState.svelte";
  
  // $props: Modern Svelte 5 component communication
  let { title = "My Watchlist" } = $props();

  // $derived: Reactive local view of the global state
  let tickers = $derived(watchlistState.tickers);
</script>

<div class="card">
  <h3>{title} ({watchlistState.tickerCount})</h3>
  {#each tickers as ticker}
    <p>{ticker.symbol}: {ticker.last}</p>
  {/each}
</div>
```

### ModuleStateStore

For cross-module state, [moduleState.ts](file:///home/reidlai/GitLocal/ta-workspace/apps/sveltekit-appshell/src/lib/stores/moduleState.ts) provides channel-based communication:

```typescript
class ModuleStateStore {
  private channels: Map<string, Writable<any>> = new Map();

  getChannel<T>(channelId: string, initialValue?: T): Writable<T> {
    if (!this.channels.has(channelId)) {
      this.channels.set(channelId, writable<T>(initialValue));
    }
    return this.channels.get(channelId);
  }

  updateState<T>(channelId: string, value: T, source: string) {
    // Last-writer-wins with requestAnimationFrame batching
  }
}
```

---

## Virtual Modules in Isolated Packages

When developing Svelte components in isolated packages (e.g., `modules/portfolio/svelte`), SvelteKit virtual modules like `$app/navigation` won't resolve. Create type stubs:

```typescript
// modules/portfolio/svelte/src/app.d.ts
declare module "$app/navigation" {
  export function goto(url: string | URL, opts?: any): Promise<void>;
}
```

This satisfies TypeScript at compile time; the consuming app provides the runtime implementation.

---

## Future Extensibility

The virtual module architecture extends to other frontend frameworks using the same ReactiveX patterns.

### NextJS Integration

NextJS can serve as an alternative frontend appshell, with or without Redux for state management.

#### Option 1: NextJS with Direct RxJS (No Redux)

**Module Structure:**

```
modules/watchlist/
├── go/          # Backend service
├── ts/          # Shared RxJS service
|    └──src/
|      └── services/
|          └── WatchlistService.ts
├── svelte/      # SvelteKit UI
└── nextjs/      # NextJS UI (future)
    └── src/
        ├── components/
        │   └── MyTickersWidget.tsx
        ├── hooks/
        │   └── useWatchlist.ts
        └── store/
            └── watchlistSlice.ts

```

**1. Shared RxJS Service** (already exists in `modules/watchlist/ts/`):

```typescript
import { BehaviorSubject } from "rxjs";

export interface TickerItem {
  symbol: string;
  on_hand: boolean;
  created_at?: string;
}

export class WatchlistService {
  private static instance: WatchlistService;
  private userId = "demo-user";

  // RxJS BehaviorSubject for state management
  private _tickers$ = new BehaviorSubject<TickerItem[]>([]);

  // Expose as observable for read-only access
  public readonly tickers$ = this._tickers$.asObservable();

  private constructor() {
    this.fetchTickers();
  }

  public static getInstance(): WatchlistService {
    if (!WatchlistService.instance) {
      WatchlistService.instance = new WatchlistService();
    }
    return WatchlistService.instance;
  }

  /**
   * Svelte-compatible subscribe method.
   * Svelte auto-subscribes to any object with this signature.
   */
  public subscribe(run: (value: TickerItem[]) => void): () => void {
    const subscription = this._tickers$.subscribe(run);
    return () => subscription.unsubscribe();
  }

  public async fetchTickers(): Promise<void> {
    try {
      const res = await fetch("/api/watchlist", {
        headers: { "X-User-ID": this.userId },
      });
      if (res.ok) {
        const data = await res.json();
        this._tickers$.next(data);
      }
    } catch (e) {
      console.error(e);
    }
  }

  public async addTicker(symbol: string, onHand: boolean): Promise<void> {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": this.userId,
        },
        body: JSON.stringify({ symbol, on_hand: onHand, user_id: this.userId }),
      });
      if (res.ok) {
        await this.fetchTickers();
      }
    } catch (e) {
      console.error(e);
    }
  }

  public async removeTicker(symbol: string): Promise<void> {
    try {
      const res = await fetch(`/api/watchlist/${symbol}`, {
        method: "DELETE",
        headers: { "X-User-ID": this.userId },
      });
      if (res.ok) {
        await this.fetchTickers();
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export const watchlistService = WatchlistService.getInstance();
```

**NextJS Component** (direct RxJS subscription):

NextJS (React) can directly consume RxJS Observables because:

1. **Shared Runtime**: Both run in JavaScript/TypeScript environments (browser or Node.js)
2. **Observable Pattern**: RxJS `Observable.subscribe()` returns an unsubscribe function, which fits perfectly with React's `useEffect` cleanup pattern
3. **No Framework Lock-in**: The `WatchlistService` from `modules/watchlist/ts/` is framework-agnostic—it's pure TypeScript with RxJS
4. **Type Safety**: TypeScript types (`TickerItem[]`) are shared across all frameworks

This means `modules/watchlist/nextjs/` can **import and use** the exact same service instance as `modules/watchlist/svelte/` without any adaptation layer.

```tsx
// modules/watchlist/nextjs/components/MyTickersWidget.tsx
import { useEffect, useState } from "react";
import { watchlistService } from "@watchlist/services";

export const MyTickersWidget = () => {
  const [tickers, setTickers] = useState<TickerItem[]>([]);

  useEffect(() => {
    const subscription = watchlistService.tickers$.subscribe(setTickers);
    watchlistService.fetchTickers();
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="card">
      <h2>My Tickers</h2>
      {tickers.map((t) => (
        <div key={t.symbol}>{t.symbol}</div>
      ))}
    </div>
  );
};
```

#### Option 2: NextJS with Redux (Optional)

For larger applications, Redux can centralize state management:

**2. Redux Slice** (bridges RxJS to Redux):

**Why Redux Integration Works:**

1. **Shared Runtime**: Both run in JavaScript/TypeScript environments (browser or Node.js)
2. **Observable Pattern**: RxJS `Observable.subscribe()` returns an unsubscribe function, which fits perfectly with React's `useEffect` cleanup pattern
3. **No Framework Lock-in**: The `WatchlistService` from `modules/watchlist/ts/` is framework-agnostic—it's pure TypeScript with RxJS
4. **Type Safety**: TypeScript types (`TickerItem[]`) are shared across all frameworks

This means `modules/watchlist/nextjs/` can **import and use** the exact same service instance as `modules/watchlist/svelte/` without any adaptation layer.

```typescript
// modules/watchlist/nextjs/store/watchlistSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { watchlistService } from "@watchlist/services";

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState: { tickers: [] as TickerItem[] },
  reducers: {
    setTickers: (state, action: PayloadAction<TickerItem[]>) => {
      state.tickers = action.payload;
    },
  },
});

export const { setTickers } = watchlistSlice.actions;
export default watchlistSlice.reducer;

// Bridge: Subscribe RxJS to Redux
export const initWatchlistSync = (store: any) => {
  watchlistService.tickers$.subscribe((tickers) => {
    store.dispatch(setTickers(tickers));
  });
};
```

**3. NextJS Hook** (consumes Redux state):

```typescript
// modules/watchlist/nextjs/hooks/useWatchlist.ts
import { useSelector } from "react-redux";
import { watchlistService } from "@watchlist/services";

export const useWatchlist = () => {
  const tickers = useSelector((state: RootState) => state.watchlist.tickers);

  return {
    tickers,
    fetchTickers: () => watchlistService.fetchTickers(),
    addTicker: (symbol: string) => watchlistService.addTicker(symbol, false),
  };
};
```

**4. NextJS Widget Component**:

```tsx
// modules/watchlist/nextjs/components/MyTickersWidget.tsx
import { useWatchlist } from "../hooks/useWatchlist";

export const MyTickersWidget = () => {
  const { tickers, fetchTickers } = useWatchlist();

  useEffect(() => {
    fetchTickers();
  }, []);

  return (
    <div className="card">
      <h2>My Tickers</h2>
      {tickers.map((t) => (
        <div key={t.symbol}>{t.symbol}</div>
      ))}
    </div>
  );
};
```

**5. NextJS AppShell** (`apps/nextjs-appshell`):

```typescript
// apps/nextjs-appshell/app/layout.tsx
import { Provider } from 'react-redux';
import { store } from './store';
import { initWatchlistSync } from '@watchlist/store';

// Initialize RxJS → Redux bridge
initWatchlistSync(store);

export default function RootLayout({ children }) {
    return (
        <Provider store={store}>
            {children}
        </Provider>
    );
}
```

---

### Flutter + RxDart Integration

**Module Structure:**

```
modules/watchlist/
├── go/          # Backend service
├── ts/          # Shared RxJS service (reference)
├── svelte/      # SvelteKit UI
└── dart/        # Flutter UI (future)
    ├── lib/
    │   ├── models/
    │   │   └── ticker_item.dart
    │   ├── services/
    │   │   └── watchlist_service.dart
    │   └── widgets/
    │       └── my_tickers_widget.dart
    └── pubspec.yaml
```

**1. Dart Service** (mirrors TypeScript RxJS pattern):

```dart
// modules/watchlist/dart/lib/services/watchlist_service.dart
import 'package:rxdart/rxdart.dart';
import 'package:http/http.dart' as http;
import '../models/ticker_item.dart';

class WatchlistService {
  static final WatchlistService _instance = WatchlistService._internal();
  factory WatchlistService() => _instance;
  WatchlistService._internal();

  final _tickers$ = BehaviorSubject<List<TickerItem>>.seeded([]);

  // Expose as stream (read-only)
  Stream<List<TickerItem>> get tickers$ => _tickers$.stream;

  // Current value accessor
  List<TickerItem> get currentTickers => _tickers$.value;

  Future<void> fetchTickers() async {
    final response = await http.get(Uri.parse('/api/watchlist'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as List;
      _tickers$.add(data.map((e) => TickerItem.fromJson(e)).toList());
    }
  }

  Future<void> addTicker(String symbol, bool onHand) async {
    await http.post(
      Uri.parse('/api/watchlist'),
      body: jsonEncode({'symbol': symbol, 'on_hand': onHand}),
    );
    await fetchTickers(); // Refresh
  }

  void dispose() => _tickers$.close();
}
```

**2. Flutter Widget** (uses StreamBuilder):

```dart
// modules/watchlist/dart/lib/widgets/my_tickers_widget.dart
import 'package:flutter/material.dart';
import '../services/watchlist_service.dart';

class MyTickersWidget extends StatelessWidget {
  final _service = WatchlistService();

  @override
  Widget build(BuildContext context) {
    return Card(
      child: StreamBuilder<List<TickerItem>>(
        stream: _service.tickers$,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return CircularProgressIndicator();
          }

          return ListView.builder(
            itemCount: snapshot.data!.length,
            itemBuilder: (context, index) {
              final ticker = snapshot.data![index];
              return ListTile(
                title: Text(ticker.symbol),
                trailing: Icon(
                  ticker.onHand ? Icons.check : Icons.remove,
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

**3. Flutter AppShell** (`apps/flutter-appshell`):

```dart
// apps/flutter-appshell/lib/main.dart
import 'package:flutter/material.dart';
import 'package:watchlist/widgets/my_tickers_widget.dart';
import 'package:portfolio/widgets/portfolio_summary_widget.dart';

void main() => runApp(MyApp());

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: Text('TA Assistant')),
        body: GridView.count(
          crossAxisCount: 2,
          children: [
            MyTickersWidget(),        // From watchlist module
            PortfolioSummaryWidget(), // From portfolio module
          ],
        ),
      ),
    );
  }
}
```

**Flutter Benefits:**

- **Cross-platform**: iOS, Android, Web, Desktop from single codebase
- **Same RxDart patterns**: BehaviorSubject, Observable streams mirror RxJS
- **Module structure**: `modules/*/dart/` follows same pattern as `modules/*/ts/`
- **Type safety**: Dart's strong typing similar to TypeScript

---

## Summary

| Layer            | Frontend (SvelteKit)         | Backend (Go/Goa)         |
| ---------------- | ---------------------------- | ------------------------ |
| **Host**         | `apps/sveltekit-appshell`    | `apps/go-server`         |
| **Discovery**    | `ModuleLoader` + glob        | Go imports in `cmd/*.go` |
| **Registration** | `Registry.register(bundle)`  | `NewEndpoints(svc)`      |
| **Widgets**      | `IWidget` → Svelte component | N/A                      |
| **Handlers**     | `IHandler.execute()`         | N/A                      |
| **Routes**       | `IParamsRoute`               | Goa HTTP DSL             |
| **State**        | RxJS + Svelte stores         | In-memory / DB           |

## Module Workflow Tooling

To manage the lifecycle of modules within the monorepo, a CLI tool is provided in `scripts/module-workflow`.

### Core Commands

| Command                   | Description                                                                    |
| ------------------------- | ------------------------------------------------------------------------------ |
| `moon run :add-module`    | Adds a new feature module (submodule), updates registry and workspace configs. |
| `moon run :delete-module` | Removes a module, cleaning up git submodules and config references.            |
| `moon run :rename-module` | Renames a module, moving the submodule and refactoring internal imports/names. |

### Configuration Automation

The tooling automatically manages:

1.  **Registry**: `apps/sv-appshell/src/lib/module-registry.ts` (or equivalent)
2.  **Node Workspace**: `pnpm-workspace.yaml`
3.  **Go Workspace**: `go.work`
4.  **Git Submodules**: `.gitmodules`, `.git/config`
