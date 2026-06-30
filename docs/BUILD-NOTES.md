# Build notes — Windows Application Control (WDAC) blocker

## What works on this machine

- `npm install` — ✅
- `npm run check` (svelte-check / TypeScript) — ✅ 0 errors
- `npm run build` (Vite + Rollup → static SPA in `build/`) — ✅
- `npm run dev` (frontend in a browser) — ✅ (SQLite features need the Tauri shell)

## What is blocked

Compiling the **Rust / Tauri** layer fails. The machine has a Windows **Application
Control policy (WDAC / AppLocker)** that blocks loading freshly-compiled, unsigned
binaries from user-writable locations.

Two concrete symptoms were observed:

1. **`create-tauri-app` and the npm `@tauri-apps/cli`** ship a native `.node` addon that
   the policy blocks:
   ```
   Error: An Application Control policy has blocked this file.
   ...create-tauri-app.win32-x64-msvc.node
   ```

2. **Any Rust crate that uses a proc-macro** (serde derive, `tauri-macros`, etc.) fails,
   because rustc compiles proc-macros to a DLL and then `LoadLibrary`s it:
   ```
   error: ...\target\debug\deps\serde_derive-XXXX.dll: LoadLibraryExW failed:
   An Application Control policy has blocked this file. (os error 4551)
   ```
   This was reproduced with a minimal `serde`-deriving crate, and it is also what stops
   `cargo install tauri-cli` from finishing. Note the crate's own `build.rs` ran fine —
   only the proc-macro **DLL load** is blocked.

Because Tauri depends on proc-macros (`tauri::generate_context!`, serde everywhere), the
desktop app cannot be compiled on this machine as currently configured. This is an
environment/policy constraint, **not** a problem with the project's code.

## How to unblock

Any one of these resolves it:

- **Build on an unrestricted machine** (personal PC, CI runner, or a VM without the WDAC
  policy). The repo is complete and standard — `npm install` then
  `cargo install tauri-cli --version "^2" --locked` then `cargo tauri build`.
- **Ask IT to adjust the WDAC/AppLocker policy** to allow execution/loading of binaries
  from your Rust build directories and the npm cache, e.g.:
  - `%USERPROFILE%\.cargo\`
  - the project's `src-tauri\target\`
  - `%LOCALAPPDATA%\npm-cache\`
  (Exact rule format depends on whether the org uses WDAC or AppLocker.)
- **CI builds**: run `cargo tauri build` in GitHub Actions / GitLab CI where no such
  policy applies, and ship the produced installer.

## Verifying once unblocked

```bash
npm install
cargo install tauri-cli --version "^2.0.0" --locked
cargo tauri icon path/to/logo.png   # replace placeholder icons
npm run tauri:dev                   # launches the desktop app
```

The frontend half can always be checked independently with `npm run check` and
`npm run build`.
