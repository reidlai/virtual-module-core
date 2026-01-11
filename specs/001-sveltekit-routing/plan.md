# Implementation Plan: Framework-Agnostic Module Routing

**Branch**: `001-sveltekit-routing` | **Date**: 2026-01-10 | **Spec**: [spec.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/001-sveltekit-routing/spec.md)

## Summary

This feature refactors `virtual-module-core` to be a **framework-agnostic routing engine**. It introduces an Adapter Pattern where the core library handles generic route matching, sorting, and conflict detection, while pluggable **Framework Adapters** (lived in App Shell) translate framework-specific conventions (SvelteKit, Next.js, etc.) into a standardized schema. A reference **SvelteKit Adapter** will be implemented to support the existing `sveltekit/` directory convention and file patterns.

## Technical Context

**Language/Version**: TypeScript 5.3+
**Primary Dependencies**: None (zero-dependency core library)
**Architecture Pattern**: Adapter Pattern (Core Library + Pluggable Adapters)
**Storage**: N/A (in-memory routing)
**Testing**: Vitest (unit tests for core and adapter)
**Target Platform**: Node.js/Browser (ES Module)
**Project Type**: Library (Shared Kernel / DI Bridge)
**Performance Goals**: O(N) route matching
**Constraints**: Core must know NOTHING about `+page.svelte` or `[id]` syntax.
**Scale/Scope**: Support 10+ frameworks via adapters; 10-100 modules per app.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Rule                         | Status     | Notes                                                                 |
| :--------------------------- | :--------- | :-------------------------------------------------------------------- |
| **Branching & Protection**   | ✅ PASS    | Working on feature branch `001-sveltekit-routing`                     |
| **12-Factor & SOLID**        | ✅ PASS    | **Improved**: Aligns strictly with Open/Closed Principle via Adapters |
| **Testing (BDD-First)**      | ⚠️ PARTIAL | Core library unit tests. BDD deferred to App Shell integration.       |
| **DevSecOps Gates**          | ✅ PASS    | Pre-commit hooks configured                                           |
| **Containers & Base Images** | N/A        | Library package; no Docker image                                      |
| **Secrets & Licensing**      | ✅ PASS    | MIT license; no secrets                                               |
| **Monorepo (Moonrepo)**      | N/A        | Standalone library consumed by Moonrepo projects                      |

**Conclusion**: All applicable rules pass. Refactor improves SOLID alignment.

## Project Structure

### Documentation

```text
specs/001-sveltekit-routing/
├── spec.md              # Feature specification (Refactored to Framework-Agnostic)
├── plan.md              # This file
├── research.md          # Architecture decisions (Adapter Pattern)
├── data-model.md        # Core entities & Adapter Interface
└── quickstart.md        # Guide for Module Devs & Adapter Authors
```

### Source Code

```text
src/
├── types/
│   └── index.ts         # IParamsRoute (Generic), IFrameworkAdapter
├── registry/
│   ├── Router.ts        # Generic matching, sorting, layout resolution
│   ├── Router.test.ts   # Generic routing tests
│   ├── Registry.ts      # Module registration & conflict detection
│   └── Registry.test.ts
└── adapters/            # (Reference Implementation only - or lived in test)
    └── SvelteKitAdapter.ts # Reference implementation logic (for testing/docs)
```

**Structure Decision**:

- `IParamsRoute` is the canonical schema.
- `IFrameworkAdapter` is the contract.
- SvelteKit logic is MOVED out of core `Router` into a reference adapter (or keeping a minimal reference implementation for validation, while actual production adapters might live in App Shell, keeping core pure). _Decision: Core will export the Interface. The SvelteKit Adapter logic will be implemented as a reference in tests/docs or a separate optional export to verify the pattern._

## Complexity Tracking

Refactor increases initial complexity (abstraction layer) but significantly reduces long-term debt and framework lock-in.
