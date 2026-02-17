# Implementation Plan: resClient Integration

**Branch**: `002-resclient-resgate-connection-imodulebundle` | **Date**: 2026-02-16 | **Spec**: [spec.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/spec.md)

## Summary

Add an optional, pre-authenticated, and shared `resClient` property to the `IModuleBundle` interface. This allows virtual modules to utilize the RES protocol for real-time data synchronization. The AppShell will manage the connection lifecycle, including authentication and reconnection, while modules focus on data subscription and local staging of changes when offline.

## Technical Context

**Language/Version**: Go 1.24.11, Node.js v20, TypeScript 5.3+  
**Primary Dependencies**: SvelteKit v2, Svelte 5, RxJS v7, Zodios, ResClient (NEEDS CLARIFICATION), go-res, Goa v3  
**Storage**: N/A (Interface and communication layer change)  
**Testing**: vitest (frontend), Go standard testing (backend), Cucumber (BDD)  
**Target Platform**: Linux (Docker/Distroless)
**Project Type**: Monorepo Web Application (SvelteKit + Go)  
**Performance Goals**: Sub-200ms real-time synchronization latency  
**Constraints**: 12-factor configuration, offline-capable staging, pre-authenticated shared connection  
**Scale/Scope**: Unified real-time client for all virtual modules

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

1. **Branching**: Using `002-resclient-resgate-connection-imodulebundle`. (Compliant)
2. **Tech Stack**: SvelteKit and Go are authorized. (Compliant)
3. **Containers**: Multi-stage distroless Docker builds mandatory for deployment. (Compliant)
4. **Testing**: BDD-First with Cucumber required. (Compliant)
5. **Governance**: Moonrepo is the exclusive task runner. (Compliant)

## Phase 0: Outline & Research

1. **Research ResClient Library**:
   - Identify the correct npm package for RES protocol client (e.g., `resclient`).
   - Determine how to import types for strict typing (FR-002).
2. **Offline Outbox Pattern**:
   - Research existing patterns in the codebase or best practices for staging changes via RxJS when the socket is down.
   - Design a reusable pattern for modules to record "staged" updates and sync upon reconnection.
3. **AppShell Integration**:
   - Research how the AppShell currently handles authentication tokens.
   - Design the injection mechanism to provide the shared `resClient` to the `Registry`.

## Project Structure

### Documentation (this feature)

```text
specs/002-resclient-resgate-connection-imodulebundle/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
sveltekit/
├── src/
│   ├── types/
│   │   └── index.ts     # Update IModuleBundle
│   ├── registry/
│   │   ├── Registry.ts  # Preserve resClient
│   │   └── adapters/    # Parse resClient from exports
│   └── appshell/        # Shared connection management
go/
└── pkg/
    └── module/
        └── module.go    # Sync Go interfaces if needed
```

**Structure Decision**: Web application option. Changes focus on shared types in SvelteKit and internal Registry logic.

## Proposed Changes

### [SvelteKit Core]

Summary: Extend the module bundle interface and registry to support official real-time client integration.

#### [MODIFY] [index.ts](file:///home/reidlai/GitLocal/virtual-module-core/sveltekit/src/types/index.ts)
- Add `IResClient` interface (based on `resclient` library).
- Add optional `resClient: IResClient | null` property to `IModuleBundle`.

#### [MODIFY] [Registry.ts](file:///home/reidlai/GitLocal/virtual-module-core/sveltekit/src/registry/Registry.ts)
- Ensure the `register` method preserves the `resClient` property in the stored module map.
- Update internal bundle storage logic to avoid stripping unknown (now new known) properties.

#### [MODIFY] [SvelteKitAdapter.ts](file:///home/reidlai/GitLocal/virtual-module-core/sveltekit/src/adapters/SvelteKitAdapter.ts)
- Logic update to detect and extract `resClient` from raw module exports and assign it to the `IModuleBundle` returned by `parse`.

---

## Verification Plan

### Automated Tests

1. **Unit Test: Registry Preservation**
   - **Command**: `npm test sveltekit/src/registry/Registry.test.ts`
   - **Scenario**: Register a bundle with a mock `resClient`. Verify `registry.getModule(id).resClient` is identical to the input.

2. **Unit Test: Adapter Parsing**
   - **Command**: `npm test sveltekit/src/adapters/SvelteKitAdapter.test.ts`
   - **Scenario**: Pass a mock SvelteKit module object containing a `resClient` to `SvelteKitAdapter.parse()`. Verify the returned `IModuleBundle` has the property.

3. **Type Check**
   - **Command**: `npm run build` (within `sveltekit/`)
   - **Scenario**: Verify that the project compiles without errors after introducing the new types.

### Manual Verification

1. **Demo Module Integration**
   - Create a temporary `DemoModule` in `sveltekit/src/examples/RealtimeDemo.ts` that provides a mock `resClient`.
   - Use a simple Svelte component to access the client from the bundle and print its `status` to the UI.
   - Verify that "connected" or "disconnected" is rendered correctly based on the mock state.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      |            |                                      |
