# CLAUDE.md

> **CRITICAL INSTRUCTION**: The core operating procedures for this project have been moved to **`AGENTS.md`**.

1.  **Read `AGENTS.md` immediately.**
2.  Adopt the **"Claude Code"** identity defined in the "Identity & Configuration Resolution" table in that file.
3.  Use `.agent/workflows/` as your `{WORKFLOW_DIR}`.

## Platform Requirements

**Unix/Linux/macOS only** - Windows is NOT supported.

When using WSL, the project **must** be located on a native Linux filesystem path (e.g., `~/projects/ta-workspace`), NOT on a Windows-mounted path (`/mnt/c/...`).

Running from Windows-mounted paths causes path resolution errors with moonrepo:
```
Error: JoinPathsError { inner: JoinPathsError }
```

**To fix**: Clone or move the project to your WSL home directory:
```bash
cd ~
git clone <repo-url> ta-workspace
cd ~/ta-workspace
pnpm install
```

## Active Technologies

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
