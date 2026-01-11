# CLAUDE.md

> **CRITICAL INSTRUCTION**: The core operating procedures for this project have been moved to **`AGENTS.md`**.

1.  **Read `AGENTS.md` immediately.**
2.  Adopt the **"Claude Code"** identity defined in the "Identity & Configuration Resolution" table in that file.
3.  Use `.agent/workflows/` as your `{WORKFLOW_DIR}`.

## Slash Command Routing

When the user invokes any `/speckit.*` command, you **MUST**:
1. Read the corresponding workflow file from `.agent/workflows/speckit.{command}.md`
2. Execute the workflow instructions in that file exactly as written
3. Pass any text after the command as `$ARGUMENTS`

**Available commands:**

| Command | Workflow File |
|---------|---------------|
| `/speckit.constitution` | `.agent/workflows/speckit.constitution.md` |
| `/speckit.specify <description>` | `.agent/workflows/speckit.specify.md` |
| `/speckit.clarify` | `.agent/workflows/speckit.clarify.md` |
| `/speckit.plan` | `.agent/workflows/speckit.plan.md` |
| `/speckit.tasks` | `.agent/workflows/speckit.tasks.md` |
| `/speckit.analyze` | `.agent/workflows/speckit.analyze.md` |
| `/speckit.implement` | `.agent/workflows/speckit.implement.md` |
| `/speckit.checklist <type>` | `.agent/workflows/speckit.checklist.md` |

**Example:** When user types `/speckit.specify user authentication`, read `.agent/workflows/speckit.specify.md` and execute with `$ARGUMENTS = "user authentication"`.

## Platform Requirements

**Unix/Linux/macOS/Ubuntu WSL only** - Windows is NOT supported.

When using WSL, the project **must** be located on a native Linux filesystem path (e.g., `~/projects/virtual-module-core`), NOT on a Windows-mounted path (`/mnt/c/...`).

Running from Windows-mounted paths causes path resolution errors with moonrepo:
```
Error: JoinPathsError { inner: JoinPathsError }
```

**To fix**: Clone or move the project to your WSL home directory:
```bash
cd ~
git clone <repo-url> virtual-module-core
cd ~/virtual-module-core
pnpm install
```

## Active Technologies
- TypeScript (ES2022), Node.js v20 LTS + Vitest (testing), ESM module system (001-sveltekit-routing)
- N/A (in-memory routing, no persistence) (001-sveltekit-routing)
- TypeScript 5.3+ + None (zero-dependency core library) (001-sveltekit-routing)
- N/A (in-memory routing) (001-sveltekit-routing)

- Node.js v20 (LTS) (managed via toolchain) + Moonrepo, pnpm (001-initialize-current-project)
- Svelte 5 (managed via toolchain) + Vite (001-initialize-current-project)
- TailwindCSS (managed via toolchain) + PostCSS (001-initialize-current-project)
- TypeScript (ES2022) (managed via toolchain) (001-initialize-current-project)
- SvelteKit v2 (managed via toolchain) (001-initialize-current-project)
- Go v1.22+ (managed via toolchain) (001-initialize-current-project)
- RxJS v7 (managed via toolchain) (001-initialize-current-project)
- RxDart v0.22+ (managed via toolchain) (001-initialize-current-project)
- Flutter v3.22+ (managed via toolchain) (001-initialize-current-project)
- Dart v2.22+ (managed via toolchain) (001-initialize-current-project)
- Firebase v10+ (managed via toolchain) (001-initialize-current-project)

## Recent Changes
- 001-sveltekit-routing: Added TypeScript (ES2022), Node.js v20 LTS + Vitest (testing), ESM module system
