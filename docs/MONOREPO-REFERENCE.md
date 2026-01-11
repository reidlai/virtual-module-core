# Monorepo Reference

Reference:
- [README.md](../README.md)
- [docs/APPSHELL-ARCHITECTURE.md](APPSHELL-ARCHITECTURE.md)
- [docs/VIRTUAL-MODULE-ARCHITECTURE.md](VIRTUAL-MODULE-ARCHITECTURE.md)
- [docs/DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md)

This document outlines the architectural structure and toolchain configuration for the AppShell Workspace.

## Overview

We use [Moonrepo](https://moonrepo.dev) as our primary build system and monorepo management tool. This ensures consistent tooling, efficient caching, and deterministic builds across all environments.

## Directory Structure

The workspace is organized into applications and modules:

- **`apps/`**: Contains end-user application projects.
  - `sv-appshell`: SvelteKit frontend application.
  - `ta-server`: Go backend API server.
- **`modules/`**: Contains shared logic and feature packages.
  - `core`: Shared utilities and type definitions.
  - `portfolio`: Portfolio management logic (Go & UI).
  - `watchlist`: Watchlist management logic (Go & UI).
  - `demo`: Demonstration modules.
- **`scripts/`**: Contains workspace automation tools and scripts.
  - `module-workflow`: The CLI tool for managing feature modules.
- **`.moon/`**: Contains the workspace configuration files (`workspace.yml`, `toolchain.yml`, `tasks.yml`).

## Toolchain Configuration

Moonrepo automatically manages the toolchain to ensure every developer and CI agent uses the exact same versions.

- **Node.js**: v20
- **Package Manager**: pnpm v8

## Project Tasks Reference

Run any task using: `moon run <project>:<task>`

### Applications

#### `sveltekit-appshell` (SvelteKit and Typescript Frontend)
Main application shell.

| Task | Command | Description |
|------|---------|-------------|
| `start` | `vite dev --host` | Start the development server |
| `build` | `pnpm run build` | Build for production |
| `test` | `pnpm run test:unit` | Run unit tests |
| `lint` | `pnpm run lint` | Lint code |
| `format` | `pnpm run format` | Format code |

#### `go-server` (Go Backend)
Main application server.

| Task | Command | Description |
|------|---------|-------------|
| `start` | `go run . api-server` | Run the server |
| `build` | `go build -o ta-server.exe .` | Build binary |
| `test` | `go test . ./cmd/... ./internal/...` | Run tests |
| `lint` | `go run github.com/golangci/golangci-lint/cmd/golangci-lint@latest run -v` | Lint code |
| `format` | `goimports -w .` | Format code |
| `gen` | `goa gen github.com/reidlai/ta-workspace/apps/ta-server/design` | Generate code from design |


### Modules

All virtual modules  follow a standard structure with three possible sub-projects: Frontend (`sveltekit`), Backend (`go`), and Shared Logic (`ts`).

#### Root Project: `<module>`
Aggregates tasks across sub-projects.

| Task | Command | Description |
|------|---------|-------------|
| `build` | (Aggregated) | Builds all valid sub-projects |
| `test` | (Aggregated) | Tests all valid sub-projects |
| `lint` | (Aggregated) | Lints all valid sub-projects |
| `format` | (Aggregated) | Formats all valid sub-projects |
| `go-build` | `go build -v ./go/...` | Build Go backend (if exists) |
| `go-test` | `go test -v ./go/...` | Test Go backend (if exists) |
| `go-lint` | `golangci-lint run -v ./go/...` | Lint Go backend (if exists) |
| `go-format` | `goimports -w ./go` | Format Go backend (if exists) |
| `go-run` | `cd go && go run .` | Run Go server locally (if exists) |
| `goa-gen` | `goa gen ...` | Generate Goa code from design (if exists) |
| `ts-build` | `pnpm --dir ts build` | Build Shared TS logic (if exists) |
| `ts-lint` | `pnpm --dir ts lint` | Lint Shared TS logic (if exists) |
| `ts-test` | `pnpm --dir ts run test` | Test Shared TS logic (if exists) |
| `ts-format` | `pnpm --dir ts run format` | Format Shared TS logic (if exists) |
| `sveltekit-dev` | `pnpm --dir svelte dev` | Start Svelte dev server (if exists) |
| `sveltekit-build` | `pnpm --dir svelte build` | Build Svelte package (if exists) |
| `sveltekit-lint` | `pnpm --dir svelte lint` | Lint Svelte components (if exists) |
| `sveltekit-format` | `pnpm --dir svelte run format` | Format Svelte components (if exists) |
| `sveltekit-check` | `pnpm --dir svelte check` | Type-check Svelte (if exists) |
| `sveltekit-test` | `pnpm --dir svelte run test` | Test Svelte components (if exists) |
| `sveltekit-storybook` | `pnpm --dir svelte run story:dev` | Start Storybook (if exists) |

#### Frontend: `<module>-sveltekit`
Svelte 5 + Svelte Kit 2 + ShadCN Svelte + Vite + Storybook.

| Task | Command | Description |
|------|---------|-------------|
| `dev` | `vite dev` | Start development server |
| `build` | `svelte-package` | Build component library |
| `check` | `svelte-check` | Type-check Svelte files |
| `lint` | `pnpm run lint` | Run ESLint |
| `test` | `vitest run` | Run component tests |
| `format` | `prettier --write .` | Format code |
| `storybook` | `pnpm run story:dev` | Start Storybook |

#### Shared: `<module>-ts`
TypeScript RxJS Logic.

| Task | Command | Description |
|------|---------|-------------|
| `build` | `tsc` / `pnpm build` | Transpile to JS |
| `lint` | `pnpm run lint` | Run ESLint |
| `test` | `vitest run` | Run unit tests |
| `format` | `prettier --write .` | Format code |

#### Backend: `<module>-go`
Goa v3 + Cobra + Viper.

| Task | Command | Description |
|------|---------|-------------|
| `build` | `go build ./...` | Verify compilation |
| `build-server` | `go build -o bin/server .` | Build executable |
| `start` | `./bin/server` or `go run` | Run server locally |
| `test` | `go test ./...` | Run unit tests |
| `lint` | `golangci-lint run` | Lint code |
| `format` | `goimports -w .` | Format code |
| `goa-gen` | `goa gen ...` | Generate code from design |
