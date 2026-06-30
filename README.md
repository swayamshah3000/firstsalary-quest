# FirstSalary Quest

A gamified **financial-literacy simulator** for Indian students, fresh graduates, and
first-time earners. Play a 12-month salary simulation, make one money decision each
month, and watch five meters react.

> 🎓 **Educational simulator only — not a financial advisory app.** Nothing here is
> financial advice. It teaches concepts through a game; it does not store real account
> data or recommend real products.

## Tech stack

- **Tauri 2** — cross-platform desktop shell (Rust)
- **SvelteKit + Svelte 5** (runes) — frontend
- **TypeScript** — language
- **SQLite** via `tauri-plugin-sql` — local database
- **Zod** — content & input validation

## Architecture

For a full walkthrough of how the app is structured — the layers, the financial
engine, the state hub, persistence, the content system, and a suggested reading
order — see [ARCHITECTURE.md](ARCHITECTURE.md).

## Project layout

```
src/
  routes/            SvelteKit pages: / /setup /game /dashboard /calculators
  lib/
    components/      Reusable Svelte components (ScoreMeter, DisclaimerBanner)
    stores/          gameStore.ts — game state (profile, month, 5 meters, history)
    db/              schema.sql (source of truth) + index.ts (typed queries)
    schemas/         Zod schemas (decisionCard, profile)
    calculators/     emergencyFund / sip / emi calculators
    decisions.ts     loads + validates decision cards from content/
  content/
    decisions/       JSON decision cards (one per month)
    lessons/         JSON learning modules
src-tauri/           Rust backend, tauri.conf.json, capabilities, icons
```

## Database

The schema lives in [`src/lib/db/schema.sql`](src/lib/db/schema.sql) and is applied as a
v1 migration by the Rust backend ([`src-tauri/src/lib.rs`](src-tauri/src/lib.rs)) when the
app first opens `sqlite:firstsalary.db`. Tables: `user_profile`, `game_progress`,
`decision_history`, `badges`, `quiz_results`.

## Develop & run

```bash
npm install
npm run dev          # frontend only, in a browser at http://localhost:1420
npm run tauri:dev    # full desktop app (requires the Tauri CLI — see below)
npm run tauri:build  # production desktop bundle
```

`npm run dev` runs the SvelteKit frontend in a normal browser. The SQLite features only
work inside the Tauri shell (`tauri:dev`), since they go through `tauri-plugin-sql`.

### Tauri CLI

This project uses the **cargo-based** Tauri CLI (the npm `@tauri-apps/cli` ships a native
binary). Install it once:

```bash
cargo install tauri-cli --version "^2.0.0" --locked
```

Then `cargo tauri dev` / `cargo tauri build` (wired up as the `tauri:*` npm scripts).

### App icons

`src-tauri/icons/` contains placeholder icons. Regenerate proper ones from a single
source image with:

```bash
cargo tauri icon path/to/logo.png
```

## ⚠️ Known blocker on this Windows machine (Application Control / WDAC)

See [`docs/BUILD-NOTES.md`](docs/BUILD-NOTES.md). In short: a Windows Application Control
(WDAC/AppLocker) policy on this machine blocks loading freshly-compiled, unsigned
**proc-macro DLLs** and native node binaries, which prevents the Rust/Tauri layer from
compiling here. The **frontend builds and type-checks cleanly** (`npm run build`,
`npm run check`); only the desktop compile step is blocked. The fix is an IT/policy
change or building on an unrestricted machine.
