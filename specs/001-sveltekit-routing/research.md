# Research: Framework-Agnostic Routing Architecture

**Feature**: Framework-Agnostic Module Routing
**Phase**: 0 (Research)
**Date**: 2026-01-10

## Overview

This research defines the architecture for a generic routing engine that supports arbitrary frontend frameworks via an Adapter Pattern. The core library must remain pure, while adapters handle the "dirty work" of parsing framework-specific file conventions.

## Decision 1: The Abstraction Layer (Adapter Pattern)

**Chosen**: `IFrameworkAdapter` Interface

**Mechanism**:
Core library defines the "Target Schema" (`IRoute`). Adapters implement a `parse()` method that takes module metadata/files and outputs `IRoute[]`.

**Rationale**:

- **Open/Closed Principle**: Open for extension (new frameworks), closed for modification (core router).
- **Separation of Concerns**: Core focuses on math (sorting/matching); Adapter focuses on IO/Parsing (filenames/structure).
- **Future Proofing**: Support Next.js, Vue, generic HTML, or even CLI tools without touching core.

## Decision 2: The Generic Route Schema

**Chosen**: Normalized `path` with `:param` syntax and explicit `metadata`

**Schema**:

- `path`: `/users/:id/posts` (Standardized, no `[id]` or `_id`)
- `component`: The actual code (opaque to router)
- `type`: `'page' | 'layout' | 'error' | 'other'` (Generic types)
- `metadata`: `{ method: 'GET', framework: 'sveltekit', ... }` (Extensible bag of data)

**Rationale**:

- `:param` is the most universal standard (Express, Vue Router, React Router).
- `metadata` allows framework-specific features (content negotiation, loaders) to pass through opaque to the core.

## Decision 3: Conflict Detection Responsibility

**Chosen**: Core Library

**Mechanism**: Registry enforces unique `path` across all registered modules, regardless of which adapter produced them.

**Rationale**:

- Global namespace requires global policing.
- Adapters don't know about each other; Core does.

## Decision 4: SvelteKit Reference Implementation

**Chosen**: Implement as a "Standard Adapter" reference.

**Behavior**:

- Translates `sveltekit/routes/blog/[slug]/+page.svelte` -> `{ path: '/blog/:slug', type: 'page' }`
- Translates `(group)` -> Strips from path.
- Translates `[[optional]]` -> Handling logic (TBD: Core needs generic optional support or Adapter explicit expansion). _Decision: Core supports optional segments via syntax like `/blog/:slug?`._

## Decision 5: Layout Resolution

**Chosen**: Implicit Path-Based (Generic)

**Mechanism**: If a route matches `/a/b`, the router looks for layout routes at `/`, `/a`, `/a/b`.

**Rationale**:

- Works for SvelteKit (file nesting = path nesting).
- Works for Next.js (layout.tsx).
- Works for flat configs (manual path defining).

## Best Practices

**Adapter Implementation**:

- **Stateless**: Adapters should be pure functions where possible `(files) => routes`.
- **Fail Fast**: Adapters should throw on invalid framework syntax before hitting core.
- **Normalization**: ALWAYS output standard `:param` syntax to Core.

**Core Library**:

- **Zero IO**: Core never reads files system. It operates on objects provided by the Registry/Adapter.
- **Param Agnostic**: Core matching logic supports standard regex-like parameter matching.

## References

- [Adapter Pattern](https://refactoring.guru/design-patterns/adapter)
- [Express Routing](https://expressjs.com/en/guide/routing.html)
- [SvelteKit Routing](https://svelte.dev/docs/kit/routing)
