# Constitution

## Purpose

This file defines immutable, non-negotiable engineering guardrails for this repository.
All specs, plans, and implementations MUST comply. Changes require the change-control
process below. This constitution is intentionally concise and enforceable.

## Scope

**Tech stack and images**: Service packaged as Docker using distroless base images.
Multi-stage Docker builds are mandatory.

**Environments and branches**: local, main, dev-test, sit, uat, staging, prod. Main is
PR-only and has no runtime. Other env branches represent deployable environments.

## Decision Rights & Change Control

**File ownership**: constitution.md is protected. Changes require a PR approved by:
Security Lead + Product Owner (PO) + one Maintainer.

**Recording**: Each change MUST include a rationale and enforcement impact in the PR
description and be labeled `constitution-change`.

**Effective date**: Changes take effect only after CI policy jobs pass and merge
protection gates are satisfied.

## Immutable Rules

### 1. Branching, Protection, and Promotions

- No direct pushes to protected env branches (main, dev-test, sit, uat, staging, prod).
  All changes flow through PRs from issue branches named
  `{issueNumber}-{issue_title_snake_case}`.
- Git commits MUST be pushed only to issue-generated branch `#####-XXXXX`, where #####
  is the GitHub issue number found in GitHub without zero padding and XXXXX is the issue
  title in snake_case with variable length not limited to 5 characters.
- If the issue number is found in branch name, spec-kit MUST use this issue number with
  `gh-` prefix in `/specify` step as feature number.
- Required flow:
  1. local work → push → issue branch
  2. PR issue → main (CI must pass)
  3. PR main → dev-test (CD to dev-test; run unit, mocked integration, smoke)
  4. On dev-test pass: create a release tag
  5. PR dev-test (release tag) → sit (CD to sit; run integration tests)
  6. On sit pass: tag sit at head
  7. With approval: PR sit → uat (CD; run UAT)
  8. On uat pass: tag uat at head
  9. With approval: PR uat → staging (CD; pre-prod checks)
  10. On staging pass: tag staging at head
  11. With approval: PR staging → prod (CD; prod deploy)
- main is PR-only aggregation; never deployed.

### 2. Environments & Configuration

- Environments: local (default), dev-test, sit, uat, staging, prod.
- Config is via environment variables (12-Factor); no secrets in repo. Use dotenv or
  platform env management for local only.
- Dev/prod parity: keep envs as similar as possible (12-Factor).

### 3. Containers & Base Images

- MUST use distroless base docker image with multi-stage builds.
- Image MUST run as non-root, with minimal capabilities, and explicit HEALTHCHECK.

### 4. Secrets & Sensitive Data

- Never commit secrets, keys, tokens, or certificates. All secrets come from the runtime
  secret store or env variables.
- CI MUST run secret detection; any finding blocks merge until remediated.

### 5. Dependencies & Licensing

- Only permissive licenses (MIT, Apache-2.0, BSD). Critical CVEs (and container
  HIGH/CRITICAL, see rule 7) are zero-tolerance: remove, patch, or provide an approved,
  time-bound waiver before merge.

### 6. Testing (BDD-First)

- Use Cucumber with Gherkin. Feature files live in `./features` and are tagged (e.g.,
  @smoke, @integration, @api).
- Steps are atomic/reusable; no business logic in steps.
- All relevant BDD scenarios MUST pass in the target env before promotion.
- Unit tests are isolated (no server runtime or external services; use mocks/stubs).

### 7. DevSecOps Gates (Blocking)

**CI (on PR to main)**:

- SCA passes (no CRITICAL; HIGH requires approved waiver).
- Formatting/linting passes.
- Secrets scanning passes.
- Unit tests pass.
- SAST/Threat Modeling: produce JSON at `./threat_modelling/reports/pr-threats.json`
  and Markdown summary; auto-create GitHub issues for findings with severity labels.

**Container build (pre-merge to env branch)**:

- Build with distroless base.
- Container scan with Trivy; CRITICAL/HIGH findings block unless approved waiver is
  attached to the PR and time-boxed.

**CD per env**:

- dev-test: DAST (e.g., ZAP) MUST run and attach a report; post-deploy integration tests with mock/stub, post-deploy smoke tests (via Cucumber) with mock/stub pass
  CRITICAL runtime vulns must page and trigger rollback policy (see runbook).
- SIT: DAST (e.g., ZAP) MUST run and attach a report; post-deploy integration tests, post-deploy smoke tests (via Cucumber) pass.
- UAT: DAST (e.g., ZAP) MUST run and attach a report; post-deploy Integration tests, post-deploy smoke tests (via Cucumber) pass.
- STAGING: DAST (e.g., ZAP) MUST run and attach a report; post-deploy integration tests, post-deploy smoke tests (via Cucumber) pass.
- PROD: DAST (e.g., ZAP) MUST run and attach a report

### 8. AI Agent Guardrails

AI coding agents MUST:

- Work only against local or issue branches; never push to protected env branches.
- Generate or update BDD feature files for new behaviors; ensure CI passes locally
  before PR.
- Never introduce secrets or disable scans; must honor branch naming and PR
  requirements.
- Include rationale of significant changes in PR description (auto-generated is
  acceptable).
- All agent prompts that impact code MUST be retained in PR comments or artifacts for
  traceability (redact sensitive info).

### 9. Directory & Files That Must Exist

- `.github/workflows/ci.yaml` (see Enforcement)
- `pre-commit-config.yaml`
- `features/` (Cucumber specs)
- `tests/integration/`, `tests/contract/` (integration and contract tests)
- `apps/**/src/` (Source code for applications)
- `modules/**/<lang>/src/` (Polyglot source code for modules, where <lang> means different languages like ts, go, rust, etc.)
- `threat_modelling/` (incl. `reports/`)
- `deploy/docker/` (Dockerfile, entrypoint.sh, etc.)
- `local-devsecops.sh` (local pipeline script)

### 10. Engineering Principles

- Adopt Twelve-Factor and SOLID principles as defaults for maintainability and
  scalability. Deviation requires an approved waiver.

## Definitions of Done (DoD) by Gate

**Main (PR)**: SCA, Lint/format, unit tests, SAST/threat modeling, secrets scan all
green; artifacts uploaded.

**Dev-test**: Binary was built; Docker container was built; Container security scanned; Docker image pushed; service deployed; post-deploy DAST, post-deploy integratoin tests (against composed services), post-deploy smoke tests (via Cucumber) pass; tagged `build-YYYYMMDDHHmm` with deployed container image.

**SIT**: Latest image tagged with `build-YYYYMMDDHHmm` deployed as service; post-deploy DAST, post-deploy integration tests (against composed services), post-deploy smoke tests (via Cucumber) pass; tagged `sit-YYYYMMDDHHmm` with deployed container image; all agreed non-functional acceptance criteria pass; stakeholder sign-off recorded in PR.

**UAT**: Latest image tagged with `sit-YYYYMMDDHHmm` deployed as service; post-deploy DAST, post-deploy integration tests (against composed services), post-deploy smoke tests (via Cucumber) pass; tagged `uat-YYYYMMDDHHmm` with deployed container image; all agreed functional acceptance criteria pass; stakeholder sign-off recorded in PR.

**Staging**: Latest image tagged with `uat-YYYYMMDDHHmm` deployed as service; post-deploy DAST, post-deploy integration tests (against composed services), post-deploy smoke tests (via Cucumber) pass; tagged `staging-YYYYMMDDHHmm` with deployed container image; all agreed functional acceptance criteria pass; stakeholder sign-off recorded in PR.

**Prod**: Remove existing `blue` tag from docker registry; Tagged `prod-YYYYMMDDHHmm` docker container in docker registry with `blue` and `stagging-YYYYMMDDHHmm` docker container in docker registry with `green`; Latest image tagged with `green` deployed as production service; post-deploy DAST pass

## Enforcement Mapping (Reference Job Names)

- `ci-sca`: blocks on CRITICAL; HIGH requires waiver.
- `ci-format-lint`: enforces formatting/lint rules.
- `ci-secrets-scan`: blocks on any secrets.
- `ci-sast-threatmodel`: Run SAST and threat modelling detection and generates `./threat_modelling/reports/pr-threats.json` and MD
  summary; auto-create issues.
- `build-and-scan-image`: builds multi-stage, scans with Trivy; blocks on HIGH/CRITICAL
  unless waived.
- `cd-dast`: Run post-deploy DAST with environment-specific test suites (OWASP ZAP) depends on environment variable ENV.
- `cd-integration-tests`: Run post-deploy integration tests with environment-specific test suites depends on environment variable ENV. E.g. if ENV is `dev-test`, integration tests should run with mock/stub.
- `cd-smoke-tests`: Run post-deploy smoke tests with environment-specific test suites depends on environment variable ENV. E.g. if ENV is `dev-test`, smoke tests should run with mock/stub.

## Waiver/Override Process

**When allowed**: Only for time-bound risk acceptance where no feasible remediation
exists before a deadline.

**Scope**: Specific finding(s), version(s), environment(s), and duration (max 30 days).
Not allowed for secrets in repo.

**Approval**: Both Security Lead and Product Owner MUST approve in the PR (label
`security-waiver` + link to issue with justification and expiry date).

**Recording**: Create a GitHub Issue with details, link to PR, and set an auto-reminder
before expiry. Re-review required at expiry.

**CI behavior**: Jobs MUST read waiver metadata to continue; otherwise block.

## Monorepo Architecture & Stack Strategy

### Workspace Authority (Moonrepo)

- **Governance**: The project MUST use **moonrepo** (`moon`) as the exclusive build system and task runner.
- **Dependency Management**: Moonrepo is the source of truth for the project graph; strict boundaries between projects must be enforced via `moon.yml` configurations.
- **Toolchain Consistency**: All environments (Local Dev & CI) must use Moonrepo's toolchain management to pin specific versions of Node.js and Golang, ensuring zero "works on my machine" issues.

### Authorized Tech Stack

- **Frontend Layer**: **Next.js** or **SvelteKit** are two options for all web interfaces and client-side applications.
- **Backend Layer**: **Golang**, **Python**, or **Rust** are the authorized languages for core API services, focusing on performance and concurrency.
- **Unified CI/CD**: CI pipelines must utilize Moonrepo's caching (`moon ci`) to only build/test affected projects, preventing redundant computation across the Frontend and Backend.

## Out of Scope

See `docs/policies/` for:

- Tool catalogs or language-specific lint/SAST menus.
- Long-form threat modeling methodology.
- Detailed runbooks (rollback, paging, DAST tuning).

## Governance

This constitution supersedes all other practices. All PRs and reviews MUST verify
compliance. Complexity must be justified. Use CLAUDE.md for runtime development
guidance.

Amendments require: documentation, approval from Security Lead + PO + Maintainer,
`constitution-change` label, and passing CI policy jobs before merge.
