# Tasks: resClient Integration

**Input**: Design documents from `/specs/002-resclient-resgate-connection-imodulebundle/`
**Prerequisites**: [plan.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/plan.md), [spec.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/spec.md), [research.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/research.md), [data-model.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/data-model.md), [contracts/res-interface.md](file:///home/reidlai/GitLocal/virtual-module-core/specs/002-resclient-resgate-connection-imodulebundle/contracts/res-interface.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths are relative to repository root.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Install `resclient` library in `sveltekit/package.json`
- [ ] T002 [P] Remove redundant `IResClient.d.ts` in favor of `@types/resclient` or package types
- [x] T003 [P] Create BDD feature file `features/res_client.feature` based on acceptance scenarios

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [ ] T004 [P] Cleanup `sveltekit/src/types/index.ts` (Standardize RES client types)
- [ ] T005 [P] Update `sveltekit/src/appshell/AppShellResProvider.ts` to use `ResClient` from package
- [x] T006 Update `Registry.ts` core storage to ensure it doesn't strip new properties from bundles

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Real-Time Data Subscription (Priority: P1) 🎯 MVP

**Goal**: Enable module developers to expose `resClient` in `IModuleBundle` and have it preserved by the Registry.

**Independent Test**: Register a mock module with a `resClient` property and verify `registry.getModule(id).resClient` matches.

### Implementation for User Story 1

- [x] T007 [US1] Update `IModuleBundle` interface in `sveltekit/src/types/index.ts` to include optional `resClient`
- [x] T008 [US1] Explicitly handle `resClient` property in `Registry.ts` registration methods
- [x] T009 [US1] Update `SvelteKitAdapter.ts` to detect and extract `resClient` from raw exports
- [x] T010 [P] [US1] Add unit test for Registry preservation in `sveltekit/src/registry/Registry.test.ts`
- [x] T011 [P] [US1] Add unit test for SvelteKitAdapter parsing in `sveltekit/src/adapters/SvelteKitAdapter.test.ts`

**Checkpoint**: User Story 1 functional - Modules can now provide real-time clients.

---

## Phase 4: User Story 2 - Real-Time Widget Updates (Priority: P2)

**Goal**: Widgets access `resClient` from their module bundle to reflect real-time updates.

**Independent Test**: Mount a demo widget, provide it a bundle with a mock `resClient`, and verify it detects the "connected" status.

### Implementation for User Story 2

- [x] T012 [US2] Create demo component using `resClient` in `sveltekit/src/examples/RealtimeDemo.svelte`
- [x] T013 [US2] Implement fallback logic in demo component to use REST if `resClient` is null

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T014 [P] Update `docs/VIRTUAL-MODULE-ARCHITECTURE.md` with ResClient lifecycle and sync patterns
- [x] T015 [P] Update `docs/DEVELOPER-GUIDE.md` with resgate integration instructions for modules
- [x] T016 [P] Update `README.md` with instructions on using `resClient` in virtual modules
- [ ] T018 Cleanup redundant Go stack dependencies and `RESRegistrar` interface logic
- [ ] T019 [US1] Implement `ResOutboxState` using Svelte 5 runes for offline data staging

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (needs US1 types and Registry logic).

### Parallel Opportunities

- T001 and T002 can run in parallel.
- T008 and T009 can run in parallel within Phase 3.
- T012 can run in parallel with polish tasks.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 & 2.
2. Complete Phase 3 (US1).
3. **STOP and VALIDATE**: Run unit tests (T009, T010).

### Incremental Delivery

1. Foundation ready (T001-T006).
2. US1 adds type support and storage (T007-T011).
3. US2 demonstrates UI usage (T012-T013).
