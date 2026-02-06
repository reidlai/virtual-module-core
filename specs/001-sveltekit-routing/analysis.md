# Specification Analysis Report

**Feature**: SvelteKit 2 Routing Support & Folder Refactor
**Branch**: `001-sveltekit-routing`
**Analysis Date**: 2026-01-10

## Executive Summary

**🔴 CRITICAL FINDING**: The latest clarification (#12) states the system should be **framework-agnostic with adapters**, but **all three artifacts (spec, plan, tasks) are hard-coded for SvelteKit**. This represents a fundamental architectural contradiction that blocks implementation.

---

## Critical Issues

| ID     | Category            | Severity        | Location(s)                         | Summary                                                                                                                                                             | Recommendation                                                                                          |
| :----- | :------------------ | :-------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------------- | ------------------------------------------- |
| **I1** | **Inconsistency**   | **🔴 CRITICAL** | spec.md:L1,L25 vs L21,L29-115       | Feature title & clarification #12 say "framework-agnostic adapters", but all 4 user stories hard-code SvelteKit (`sveltekit/` directory, `+page`, `[param]` syntax) | **Reframe spec**: Split into (A) Core generic routing + (B) SvelteKit adapter as separate feature/phase |
| **I2** | **Inconsistency**   | **🔴 CRITICAL** | plan.md:L1,L7 vs spec.md:L25        | Plan title "SvelteKit 2 Routing Support" contradicts framework-agnostic clarification                                                                               | Rename to "Framework-Agnostic Module Routing with SvelteKit Adapter"                                    |
| **I3** | **Inconsistency**   | **🔴 CRITICAL** | tasks.md:L1-223 vs spec.md:L25      | All 49 tasks implement SvelteKit-specific logic (`sveltekit/`, `+page`, `[id]`, route groups); zero tasks for adapter abstraction                                   | Restructure: Core routing tasks (generic) + SvelteKit adapter tasks (separate phase)                    |
| **C1** | **Conflicting Req** | **🔴 CRITICAL** | FR-001, FR-002 vs Clarification #12 | FR-001 requires loading from `sveltekit/` directory; FR-002 errors on `svelte/`; but clarification #12 says framework-agnostic                                      | Remove directory hard-coding; introduce adapter interface                                               |
| **C2** | **Conflicting Req** | **🟡 HIGH**     | FR-003, FR-004 vs Clarification #12 | FR-003 uses `RouteType` with `'page'                                                                                                                                | 'layout'                                                                                                | 'error' | 'server'`(SvelteKit-specific names); FR-004 requires recognizing`+page`, `+layout` | Make `RouteType` generic or adapter-defined |
| **A1** | **Ambiguity**       | **🟡 HIGH**     | spec.md:L25, plan.md, tasks.md      | Clarification #12 states "App Shell provides adapters" but no definition of adapter interface, responsibility boundaries, or where adapters live                    | Define `IFrameworkAdapter` interface with `parseRoutes()`, `normalizeConventions()` methods             |
| **U1** | **Underspec**       | **🟡 HIGH**     | FR-019-FR-022 (Cross-Cutting)       | Requirements mention "core library" but adapter pattern means these belong in adapter, not core                                                                     | Reassign responsibilities: Core = generic matching; Adapter = `:param` normalization, `svelte/` error   |

---

## Medium/Low Issues

| ID     | Category        | Severity      | Location(s)                                               | Summary                                                                              | Recommendation                                                                               |
| :----- | :-------------- | :------------ | :-------------------------------------------------------- | :----------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------- |
| **D1** | **Duplication** | **🟠 MEDIUM** | FR-010, FR-012, FR-013 (spec.md:L137-138)                 | Three requirements all describe sorting specificity with slightly different wording  | Consolidate into FR-012 with full hierarchy: static > dynamic > optional > rest              |
| **T1** | **Terminology** | **🟠 MEDIUM** | US1 "Directory Refactor" vs "Framework-Agnostic"          | US1 title implies simple folder rename, but clarification #12 changes scope entirely | Rename US1 to "Module Convention Detection" or similar neutral term                          |
| **T2** | **Terminology** | **🟠 MEDIUM** | spec uses both "SvelteKit-style" and "framework-agnostic" | Inconsistent framing (Lines 9, 14-24 say "SvelteKit standard")                       | Standardize terminology: Drop "SvelteKit-style"; use "framework-native patterns via adapter" |

---

## Coverage Analysis

### Requirements vs Tasks Mapping

| Requirement                           | Has Task? | Task IDs             | Notes                                                                             |
| :------------------------------------ | :-------- | :------------------- | :-------------------------------------------------------------------------------- |
| FR-001 (sveltekit/ loading)           | ✅        | T006-T009            | **CONFLICT**: Requirement hard-codes SvelteKit, contradicts Clarification #12     |
| FR-002 (svelte/ error)                | ✅        | T007, T009           | **CONFLICT**: Should be adapter responsibility, not core                          |
| FR-003 (RouteType)                    | ✅        | T003-T005            | **PARTIAL**: Type works generically but names (`'layout'`) are SvelteKit-specific |
| FR-004 (+page/+layout/+error/+server) | ✅        | T010-T025            | **CONFLICT**: Hard-coded SvelteKit file conventions                               |
| FR-005-FR-008 (Core routing)          | ✅        | T010-T015, T022-T024 | ✅ Generic enough to survive refactor                                             |
| FR-009-FR-013 (Advanced patterns)     | ✅        | T026-T035            | **CONFLICT**: `[...]`, `[[]]`, `(group)` are SvelteKit syntax                     |
| FR-014-FR-018 (Server routes)         | ✅        | T036-T043            | **CONFLICT**: `+server`, HTTP exports are SvelteKit-specific                      |
| FR-019 (`:param` normalization)       | ✅        | T012, T024           | **CONFLICT**: Should be adapter's job, not core                                   |
| FR-020 (Duplicate detection)          | ✅        | T016-T017, T025      | ✅ Core responsibility (survives refactor)                                        |
| FR-021 (Layout nesting)               | ❌        | **NONE**             | **GAP**: No task implements slot-based nesting with App Shell                     |
| FR-022 (404 vs runtime error)         | ✅        | T038, T042           | ✅ Core responsibility (survives refactor)                                        |

**Coverage**: 21/22 requirements have tasks (95%), but **15/22 (68%)** conflict with framework-agnostic clarification.

### Unmapped Tasks

- **T001-T002** (Setup): Generic exports - ✅ OK
- **T006** (README update): Currently SvelteKit-specific - needs rewrite
- **T044** (README examples): Currently SvelteKit-specific - needs rewrite

---

## Constitution Alignment

| Principle             | Status          | Notes                                                                                                                  |
| :-------------------- | :-------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **12-Factor & SOLID** | ⚠️ **VIOLATED** | Current spec violates Open/Closed Principle (framework hard-coding prevents extension to Next.js without modification) |
| **DI Bridge Pattern** | ⚠️ **VIOLATED** | Clarification #12 correctly states adapter pattern, but implementation contradicts (no adapter abstraction defined)    |
| **Testing**           | ✅ PASS         | 23 parallel test tasks defined                                                                                         |
| **Branching**         | ✅ PASS         | Feature branch `001-sveltekit-routing` exists                                                                          |

---

## Metrics

- **Total Requirements**: 22
- **Total Tasks**: 49
- **Coverage %**: 95% (21/22 have tasks)
- **Conflicting Requirements**: 15/22 (68%)
- **Critical Issues**: 4
- **High Issues**: 3
- **Medium Issues**: 3
- **Ambiguity Count**: 1 (adapter interface undefined)
- **Duplication Count**: 1

---

## Next Actions

### 🔴 CRITICAL - MUST RESOLVE BEFORE /implement

The current spec/plan/tasks are **not implementable** due to the fundamental contradiction between Clarification #12 (framework-agnostic) and the implementation (SvelteKit hard-coded).

**Path Forward - Choose ONE**:

**Option A: Refactor to Adapter Pattern** ✅ _Recommended - aligns with clarification #12_

1. Reframe feature as "Generic Module Routing + SvelteKit Adapter"
2. Define `IFrameworkAdapter` interface in core
3. Split tasks into:
   - Core Library: Generic `IRoute`, `Router.match()`, conflict detection (20-25 tasks)
   - SvelteKit Adapter: `sveltekit/` detection, `+page` parsing, `[param]` syntax (15-20 tasks)
4. Move directory/file/syntax requirements to adapter spec

**Option B: Retract Clarification #12**

1. Remove Clarification #12
2. Accept SvelteKit hard-coding as **v1 scope**
3. Add "Future: Framework adapters" to backlog
4. Proceed with current tasks

**Which path should I take?** I recommend **Option A** to honor the architectural vision, but it requires significant rework.
