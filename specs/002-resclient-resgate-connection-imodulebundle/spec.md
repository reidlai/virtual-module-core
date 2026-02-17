# Feature Specification: Add resClient to IModuleBundle

**Feature Branch**: `002-resclient-resgate-connection-imodulebundle`  
**Created**: 2026-02-16  
**Status**: Draft  
**Input**: User description: "add resClient for resgate connection in IModuleBundle"

## Clarifications

### Session 2026-02-16

- Q: Who manages the lifecycle of the resClient connection? → A: AppShell provides the initialized client and handles its lifecycle.
- Q: Should resClient use a specific library's type or a generic interface? → A: Import and use types from the ResClient library.
- Q: Should all modules share a single resgate connection or have dedicated ones? → A: All modules share a single resgate connection managed by the AppShell.
- Q: Should the resClient be pre-authenticated? → A: The resClient is pre-authenticated by the AppShell using the current user's token.
- Q: How should connection failures and offline work be handled? → A: AppShell re-establishes connections; modules can work offline, and the system must provide a mechanism to stage changes for eventual synchronization.
- Q: What is the behavior if resClient is null? → A: The module bundle should focus on standard API connections (e.g., REST/Zodios) to the backend instead of using the RES protocol.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Real-Time Data Subscription (Priority: P1)

As a module developer, I want to be able to expose a `resClient` in my module bundle so that the system or other modules can use it to subscribe to real-time data from `resgate`.

**Why this priority**: High priority because real-time synchronization is a core capability of the virtual module system (as documented in the Developer Guide).

**Independent Test**: Can be fully tested by creating a mock module that initializes with a `resClient` and verifying that the `Registry` correctly stores and exposes this client.

**Acceptance Scenarios**:

1. **Given** a module initialization function, **When** it returns an `IModuleBundle` containing a `resClient`, **Then** the `Registry` should store the bundle including the `resClient`.
2. **Given** a registered module with a `resClient`, **When** a consumer requests the module from the `Registry`, **Then** it should be able to access the `resClient`.

---

### User Story 2 - Real-Time Widget Updates (Priority: P2)

As a widget developer, I want to access the `resClient` provided by the module bundle so that my widget can reflect real-time state changes without manual polling.

**Why this priority**: Enhances the developer experience and ensures UI consistency across real-time modules.

**Independent Test**: Can be tested by a widget requesting the `resClient` from its parent module's bundle.

**Acceptance Scenarios**:

1. **Given** a widget is part of a module bundle, **When** it attempts to access the `resClient` field of the `IModuleBundle`, **Then** it should receive the initialized client if present.

---

### Edge Cases

- **What happens when the `resClient` is not provided (is null)?**
  - The `resClient` field should be optional in `IModuleBundle`. If null, the module MUST focus on its standard API connections to the backend (e.g., via Zodios/RxJS services) instead of using the RES protocol for real-time synchronization.
- **How does the system handle multiple modules with different `resgate` connections?**
  - Each `IModuleBundle` has its own `id`, so the `resClient` is scoped to that specific module bundle.
- **What happens during a connection drop?**
  - The `resClient` should enter an "offline" state. Modules should stage local changes in an internal "outbox".
- **How are changes synced back?**
  - Upon reconnection, the AppShell or a dedicated sync service should process the staged "outbox" entries to synchronize state with Resgate.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `IModuleBundle` interface MUST include an optional `resClient` property.
- **FR-002**: The `resClient` property MUST be provided as an initialized, pre-authenticated instance by the AppShell/Host environment and strictly typed using the project's RES client library.
- **FR-003**: The `Registry` MUST be updated (if necessary) to ensure it doesn't strip or ignore the `resClient` property when registering bundles.
- **FR-004**: Module adapters MUST be able to parse and include the `resClient` from raw module exports into the `IModuleBundle`.
- **FR-005**: The system MUST provide an implementation or pattern for an "Offline Outbox" to stage changes when the `resClient` connection is lost.
- **FR-006**: The AppShell MUST automatically attempt reconnection and signal state changes to all using modules.
- **FR-007**: Modules MUST gracefully fallback to non-RES API communication if the `resClient` is not provided in the bundle.

### Key Entities _(include if feature involves data)_

- **IModuleBundle**: The central entity representing a module's capabilities and artifacts.
- **resClient**: An object representing a connection to a RES gateway, allowing for real-time data operations (get, subscribe, call).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `IModuleBundle` interface in `src/types/index.ts` contains the `resClient` property.
- **SC-002**: 100% of modules can optionally provide a `resClient` during registration without breaking existing functionality.
- **SC-003**: Unit tests for `Registry` confirm that `resClient` is preserved after registration.
