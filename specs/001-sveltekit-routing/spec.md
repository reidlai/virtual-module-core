# Feature Specification: Framework-Agnostic Module Routing

**Feature Branch**: `001-sveltekit-routing`
**Created**: 2026-01-10
**Status**: Draft - Refactored to Framework-Agnostic Architecture
**Original Input**: "/speckit.specify I would like to refactor all widgets and routes are loaded from sveltekit/ instead of svelte/..."

## Context & Architecture

This library serves as the **framework-agnostic core** for the [Virtual Module Architecture](https://github.com/reidlai/portfolio-virtmod/docs/VIRTUAL-MODULE-ARCHITECTURE.md). It enables modules to be dynamically injected into a [Host App Shell](https://github.com/reidlai/ta-workspace/docs/APPSHELL-ARCHITECTURE.md) regardless of frontend framework (SvelteKit, Next.js, React, Vue, etc.).

**Adapter Pattern**:

- **Core Library** (`virtual-module-core`): Provides framework-agnostic routing primitives (`IRoute`, `Router`, conflict detection)
- **Framework Adapters** (in App Shell): Translate framework-specific conventions (e.g., SvelteKit's `+page`, Next.js's `page.tsx`) into the core schema
- **Separation of Concerns**: Core library has zero knowledge of framework syntax; adapters bridge the gap

## Clarifications

### Session 2026-01-10

**Core Library Clarifications**:

- Q: How should the system handle duplicate route paths across modules? → A: Throw an error during registration (fails fast on detection). **[CORE]**
- Q: How should 404 and runtime errors be scoped? → A: 404 is handled when no route matches; runtime errors are handled hierarchically. **[CORE]**
- Q: How should layout hierarchies be resolved? → A: Implicit path-based hierarchy (parent layouts match by path prefix). **[CORE]**
- Q: How should a module's layout interact with the Shell's main content area? → A: Nested: Module layouts render within the Shell's slot-based content area. **[CORE]**

**Adapter Clarifications**:

- Q: Should the system support legacy `:param` syntax? → A: Adapters normalize framework conventions (e.g., `:param` → generic format). **[ADAPTER]**
- Q: How should we prioritize between optional and rest parameters? → A: Adapter defines specificity rules based on framework standards. **[ADAPTER]**
- Q: Should the system support the legacy `svelte/` directory? → A: Adapter decision (e.g., SvelteKit adapter errors on `svelte/`). **[ADAPTER]**
- Q: What HTTP methods should server endpoints support? → A: Framework-specific (SvelteKit: GET/POST/etc.; Next.js: route handlers). **[ADAPTER]**
- Q: How should content negotiation work? → A: Adapter translates framework conventions to route metadata. **[ADAPTER]**

**Architecture Clarification**:

- Q: Should `virtual-module-core` hard-code SvelteKit conventions or support multiple frameworks? → A: **Framework-agnostic with adapters**. Core provides generic routing; App Shell provides framework-specific adapters (SvelteKit, Next.js, React Router, etc.).

## User Scenarios & Testing

### User Story 1 - Generic Route Registration (Priority: P1) **[CORE]**

As a module developer, I want to register routes using a simple, framework-agnostic schema that the core library can match and manage.

**Why this priority**: Foundation for all framework support; enables adapter pattern.

**Independent Test**: Register routes with generic `IRoute` schema; verify core router matches paths correctly.

**Acceptance Scenarios**:

1. **Given** a route with `path: '/blog'` and `component: BlogComponent`, **When** registered, **Then** it appears in the route registry.
2. **Given** a route with `path: '/users/:id'`, **When** matching `/users/123`, **Then** it matches with `params = { id: '123' }`.
3. **Given** nested routes with `type: 'layout'`, **When** matching a deep path, **Then** the layout hierarchy is resolved by path prefix.

---

### User Story 2 - Conflict Detection & Hierarchy (Priority: P1) **[CORE]**

As a module developer, I want the core router to detect duplicate route paths across modules and resolve layout hierarchies automatically.

**Why this priority**: Prevents runtime conflicts; essential for multi-module apps.

**Independent Test**: Register conflicting routes; verify error is thrown. Register layout/page pairs; verify hierarchy resolution.

**Acceptance Scenarios**:

1. **Given** two modules register `path: '/dashboard'`, **When** the second registration occurs, **Then** an error is thrown.
2. **Given** routes `/`, `/blog`, `/blog/posts`, **When** matching `/blog/posts`, **Then** layouts for `/` and `/blog` are included in the match result.
3. **Given** a route with no matching layouts, **When** matched, **Then** the `layouts` array is empty or contains only root layout.

---

### User Story 3 - Advanced Matching & Sorting (Priority: P2) **[CORE]**

As a module developer, I want the core router to support dynamic parameters, wildcards, and specificity-based sorting without knowing framework syntax.

**Why this priority**: Enables complex routing patterns (e.g., `/users/:id`, `/docs/*`); framework adapters translate to this.

**Independent Test**: Register routes with varying specificity; verify sorting and matching behavior.

**Acceptance Scenarios**:

1. **Given** routes `/blog/featured` (static) and `/blog/:slug` (dynamic), **When** matching `/blog/featured`, **Then** the static route wins.
2. **Given** a route `/docs/*` (wildcard), **When** matching `/docs/api/reference`, **Then** it matches with wildcard capture.
3. **Given** overlapping patterns, **When** sorted, **Then** more specific routes appear first (static > dynamic > wildcard).

---

### User Story 4 - SvelteKit Adapter (Reference Implementation) (Priority: P2) **[ADAPTER]**

As a SvelteKit module developer, I want an adapter that translates SvelteKit conventions (`+page`, `sveltekit/`, `[param]`) into the core routing schema.

**Why this priority**: Demonstrates adapter pattern; enables SvelteKit modules.

**Independent Test**: Adapter parses SvelteKit routes; core router matches them correctly.

**Acceptance Scenarios**:

1. **Given** a SvelteKit route `+page.svelte` in `sveltekit/blog/`, **When** parsed by adapter, **Then** it registers as `{ path: '/blog', type: 'page', component }`.
2. **Given** a SvelteKit route `[slug]/+page.svelte`, **When** parsed, **Then** it registers as `{ path: '/blog/:slug', component }`.
3. **Given** a module with `svelte/` directory, **When** adapter runs, **Then** it throws an error (legacy not supported).
4. **Given** `+layout` and `+page` files, **When** parsed, **Then** both register with correct `type` metadata.

---

## Requirements

### Functional Requirements

#### Core Library (US1-US3)

**Route Registration & Schema**:

- **FR-001 [CORE]**: `IRoute` MUST include fields: `path` (string), `component` (any), optional `type` (string), optional `metadata` (object).
- **FR-002 [CORE]**: The `Router` MUST support dynamic parameters in paths (e.g., `:id`, `:slug`).
- **FR-003 [CORE]**: The `Router` MUST support wildcard/catch-all patterns (e.g., `*`, `/**`).

**Conflict Detection**:

- **FR-004 [CORE]**: The `Registry` MUST throw an error if duplicate route paths are registered (fail-fast).

**Layout Hierarchy**:

- **FR-005 [CORE]**: The `Router` MUST resolve layout hierarchies using path-prefix matching.
- **FR-006 [CORE]**: `RouteMatch` MUST include optional `layouts` array (ordered root → leaf).

**Sorting & Specificity**:

- **FR-007 [CORE]**: The `Router` MUST implement specificity-based sorting: static segments > dynamic segments > wildcards.
- **FR-008 [CORE]**: When multiple routes match, the `Router` MUST return the most specific match.

**Error Handling**:

- **FR-009 [CORE]**: When no route matches, `Router.match()` MUST return `null` (404).
- **FR-010 [CORE]**: Module layouts MUST nest within the App Shell's content slot (slot-based nesting).

#### Framework Adapter Interface (US4)

**Adapter Contract**:

- **FR-011 [ADAPTER]**: The system MUST define an `IFrameworkAdapter` interface with methods: `parseModuleRoutes(module) → IRoute[]`.
- **FR-012 [ADAPTER]**: Adapters MUST normalize framework-specific syntax to core schema (e.g., SvelteKit `[param]` → `:param`).
- **FR-013 [ADAPTER]**: Adapters MUST handle framework-specific metadata (e.g., SvelteKit `type: 'server'`, Next.js route handlers).
- **FR-014 [ADAPTER]**: Adapters MUST validate directory conventions (e.g., error on `svelte/` for SvelteKit adapter).

#### SvelteKit Adapter (Reference Implementation)

- **FR-015 [SVELTE-ADAPTER]**: SvelteKit adapter MUST recognize `sveltekit/` directory.
- **FR-016 [SVELTE-ADAPTER]**: SvelteKit adapter MUST error on `svelte/` directory (legacy).
- **FR-017 [SVELTE-ADAPTER]**: SvelteKit adapter MUST parse `+page`, `+layout`, `+error`, `+server` file types.
- **FR-018 [SVELTE-ADAPTER]**: SvelteKit adapter MUST normalize `[param]`, `[...rest]`, `[[optional]]`, `(group)` syntax.

### Key Entities

- **IRoute** (core): `{ path: string, component: any, type?: string, metadata?: object }`
- **RouteMatch** (core): `{ route: IRoute, params: Record<string, string>, layouts?: IRoute[] }`
- **IFrameworkAdapter** (interface): `{ parseModuleRoutes(module): IRoute[] }`

## Success Criteria

### Measurable Outcomes

- **SC-001**: Core router supports any framework via adapters (no hard-coded syntax).
- **SC-002**: SvelteKit adapter (reference) translates all SvelteKit 2 routing patterns correctly.
- **SC-003**: Router match time remains O(N) where N = number of routes.
- **SC-004**: All core library tests pass; SvelteKit adapter tests pass separately.
- **SC-005**: Documentation demonstrates adding a new framework adapter (e.g., Next.js) in <50 LOC.
