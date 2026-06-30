# FirstSalary Quest — Architecture

A guide to how this app is built, why it's structured the way it is, and where to
look when you want to understand or change something.

> 🎓 **Educational simulator only — not financial advice.** The whole design
> deliberately avoids recommending real products; it teaches concepts.

---

## 1. The big picture

FirstSalary Quest is a **local-first desktop app**: a 12-month "first salary"
simulation plus a learning track. There is no backend and no network — all state
lives on the device.

It's built in clear layers, each depending only on the ones beneath it:

```
            ┌────────────────────────────────────────────┐
   UI       │  routes/  (SvelteKit pages)  +  components/ │   what you see
            └───────────────┬────────────────────────────┘
                            │ reads/derives, calls actions
            ┌───────────────▼────────────────────────────┐
   State    │  lib/stores/gameStore.ts                    │   the single hub
            └───────┬───────────────┬─────────────┬───────┘
                    │               │             │
        ┌───────────▼──┐   ┌────────▼──────┐  ┌───▼─────────────┐
 Logic  │ lib/engine/  │   │ lib/badges.ts │  │ lib/storage/    │  pure logic +
        │ (sim model)  │   │ lib/decisions │  │ (persistence)   │  persistence
        └───────┬──────┘   └───────┬───────┘  └───────┬─────────┘
                │                  │                  │
        ┌───────▼──────────────────▼──────────────────▼─────────┐
 Data   │  lib/schemas/ (Zod)   +   content/*.json   +  SQLite   │  shapes & data
        └────────────────────────────────────────────────────────┘
```

**The golden rule of data flow:** the UI never computes game logic. It calls an
*action* on the store (e.g. `applyChoice`), the store runs the **pure engine**,
saves the new state through the **storage** abstraction, and the UI re-renders
from **derived** values. Everything is one-directional.

---

## 2. Tech stack (and why)

| Layer | Choice | Why |
|-------|--------|-----|
| Desktop shell | **Tauri 2** (Rust) | Tiny native binary, offline, local SQLite |
| Frontend | **SvelteKit + Svelte 5 (runes)** | Reactive, compiles to a static SPA |
| Language | **TypeScript** | Types flow from Zod schemas through the whole app |
| Database | **SQLite** via `tauri-plugin-sql` | Local persistence on desktop |
| Validation | **Zod** | One source of truth for content + input shapes |
| Charts | **LayerChart** | Svelte-native charting (the report's net-worth chart) |
| Tests | **Vitest** | Unit tests for the engine, calculators, and content |

SvelteKit is configured as a **static SPA** (`adapter-static`, `ssr = false`,
`prerender = true` — see [vite.config.ts](vite.config.ts) and
[src/routes/+layout.ts](src/routes/+layout.ts)) so Tauri can serve it from disk.

---

## 3. Directory map

```
src/
  routes/                 SvelteKit pages (one folder per screen)
    +layout.svelte        nav + global styles; calls hydrate() on mount
    +layout.ts            ssr=false, prerender=true (SPA config)
    +page.svelte          / (home)
    setup/                /setup     — create a character
    game/                 /game      — the month-by-month loop
    dashboard/            /dashboard — meters, money, resilience, badges
    report/               /report    — final report + share card + chart
    learn/                /learn     — lesson hub + reader + quiz
    budget/               /budget    — first-salary allocation mini-game
    calculators/          /calculators — 6 financial calculators
  lib/
    schemas/              Zod schemas: decisionCard, profile, lesson (+ index)
    engine/               the pure financial simulation (see §4)
    stores/gameStore.ts   the central state hub (see §5)
    storage/              SQLite ⇄ localStorage abstraction (see §6)
    calculators/          pure calculator functions (+ tests)
    components/           ScoreMeter, DisclaimerBanner, Badges, Quiz
    decisions.ts          loads + validates decision cards; picks one per month
    lessons.ts            loads + validates lessons
    badges.ts             badge definitions + evaluation
    db/                   schema.sql (the DB) + index.ts (typed queries)
    content.validate.test.ts   runs the loaders so bad JSON fails in tests
  content/
    decisions/*.json      50 decision cards
    lessons/*.json        20 learning modules (100 quiz questions)
src-tauri/                Rust backend: Cargo.toml, tauri.conf.json, src/lib.rs
docs/BUILD-NOTES.md       the Windows WDAC build constraint (see §10)
```

---

## 4. The financial engine — the heart of the app

Everything interesting happens in [src/lib/engine/](src/lib/engine/). It is
**pure** (no Svelte, no `$lib` runtime imports, no I/O), which is why it can be
unit-tested in isolation ([engine.test.ts](src/lib/engine/engine.test.ts)).

The core idea: **track real rupees, then derive the game meters from them.**
Choices don't nudge meters directly — they change real money, and the meters fall
out of that. This keeps the numbers internally consistent.

| File | Responsibility |
|------|----------------|
| [types.ts](src/lib/engine/types.ts) | `FinancialState`, `DecisionEffects`, `Meters`, loans/SIPs/insurance |
| [config.ts](src/lib/engine/config.ts) | All tunable assumptions (city costs, coverage rules, weights) |
| [setup.ts](src/lib/engine/setup.ts) | `createInitialState(profile)` — starting money position |
| [simulate.ts](src/lib/engine/simulate.ts) | `applyEffects` (a choice) and `advanceMonth` (a month tick) |
| [meters.ts](src/lib/engine/meters.ts) | `computeMeters`, `resilienceScore`, `netWorthValue` |

**`FinancialState`** holds cash, emergencyFund, investments, loans, SIPs,
insurance cover, recurring expenses, and a `history[]` of monthly snapshots (used
by the report chart).

**`applyEffects(state, effects)`** applies a choice's `DecisionEffects` (e.g.
`addLoan` creates an EMI + liability, `startSip` adds a recurring investment,
`insurance` raises cover, `cash`/`baseExpenses`/`lifestyleExpenses` adjust money).
It returns a *new* state — never mutates.

**`advanceMonth(state)`** simulates one month: salary in → expenses out → EMIs
paid (interest then principal, with a final-instalment settle to avoid rounding
residue) → SIP contributions → investment growth → emergency-fund interest →
snapshot appended → `month++`.

**`computeMeters(state)`** maps the real numbers to five 0–100 meters (higher is
always better): net worth, emergency readiness, protection (insurance adequacy,
which depends on dependents and city tier), lifestyle inflation, and financial
freedom. **`resilienceScore`** is a weighted blend of those five (weights in
config) — the headline number on the report.

> Read the engine top-down: `types.ts` → `config.ts` → `setup.ts` → `simulate.ts`
> → `meters.ts`, with `engine.test.ts` open beside it (run `npm test` and watch
> the assertions describe the intended behaviour).

---

## 5. The state hub — `gameStore.ts`

[src/lib/stores/gameStore.ts](src/lib/stores/gameStore.ts) is the only place the
UI talks to. It holds three **writable** stores and exposes everything else as
**derived** or as **actions**.

**Writable (raw) state:**
- `userProfile` — the character (or `null`)
- `gameState` — the engine's `FinancialState` (or `null`)
- `quizResults` — `{ questionId: boolean }`

**Derived (computed, read-only) views:**
- `meters` = `computeMeters(gameState)`
- `currentMonth`, `isGameOver`
- `resilience`, `resilienceVerdict`
- `moneySummary` (cash / EF / invested / net worth)
- `badges`, `earnedBadgeCount`

**Actions (the only way to change state):**
- `startNewGame(profile)` — wipe storage, create initial state, save
- `applyChoice(card, i)` — run the engine, record the decision, persist
- `skipMonth()` — advance a month with no decision
- `recordQuizAnswer(id, correct)` — update + persist quiz progress
- `hydrate()` — load a saved game on app start (called from the layout)
- `resetGame()`

Actions persist **fire-and-forget** through `persist(...)` — a save failure logs
a warning but never breaks gameplay.

Because meters/resilience/badges are *derived*, they recompute automatically
whenever `gameState` changes — there's no manual "update the UI" code anywhere.

---

## 6. Persistence — the storage abstraction

[src/lib/storage/](src/lib/storage/) hides *where* data is saved behind one
interface, so the same game code works in the browser demo and the desktop app.

- [types.ts](src/lib/storage/types.ts) — the `GameStorage` interface + `PersistedGame`
- [localStorage.ts](src/lib/storage/localStorage.ts) — browser backend (one JSON blob)
- [sqlite.ts](src/lib/storage/sqlite.ts) — desktop backend (`tauri-plugin-sql`)
- [index.ts](src/lib/storage/index.ts) — `getStorage()` picks the right one

`getStorage()` checks `isTauri()` and either **dynamically imports** the SQLite
backend (so `tauri-plugin-sql` is *never* loaded in a plain browser or during the
build) or returns the localStorage backend. This dynamic import is deliberate and
important — it's what lets the same build run as both a web preview and a native
app.

On desktop, the SQL schema in [db/schema.sql](src/lib/db/schema.sql) is the single
source of truth; it is embedded into the Rust backend as a migration via
`include_str!` (see [src-tauri/src/lib.rs](src-tauri/src/lib.rs)) and applied on
first launch.

---

## 7. The content system

Game content is **data, not code** — JSON files validated by Zod at load time.

- **Decision cards** ([content/decisions/](src/content/decisions/), 50 files) are
  validated by [decisionCard.ts](src/lib/schemas/decisionCard.ts) and loaded by
  [decisions.ts](src/lib/decisions.ts). A card's choices carry `DecisionEffects`
  (real actions), and `pickCardForMonth(month, seed)` chooses one card from that
  month's pool deterministically from a per-character seed — so different
  characters get different scenarios (replayability) but a single run is stable
  on reload.
- **Lessons** ([content/lessons/](src/content/lessons/), 20 files, 100 quiz
  questions) are validated by [lesson.ts](src/lib/schemas/lesson.ts) and loaded by
  [lessons.ts](src/lib/lessons.ts).

Both loaders use `import.meta.glob(..., { eager: true })` and **throw on the first
invalid file**, so authoring mistakes fail loudly.

> ⚠️ **Important gotcha:** because the app builds with `ssr = false`, the
> production build does **not** execute these loaders — so a schema-invalid JSON
> file will pass `npm run build` but 500 the page at runtime. That's exactly why
> [content.validate.test.ts](src/lib/content.validate.test.ts) exists: it runs
> both loaders under Vitest. **After editing content, run `npm test`, not just the
> build.**

---

## 8. Screens (routes)

Each route is a thin view over the store. Highlights:

- **/setup** — a form validated by `userProfileSchema`; calls `startNewGame`.
- **/game** — `pickCardForMonth` → render the card → `applyChoice` → meters and
  the money strip update live.
- **/dashboard** — derived meters, money, resilience, badges, history.
- **/report** — the final share card, the **LayerChart** net-worth chart (from
  `gameState.history`), badges, and a copy-to-clipboard share line.
- **/learn** — a single page that toggles between the module grid and a lesson
  reader; the `Quiz` component records answers via `recordQuizAnswer`.
- **/budget** — a standalone mini-game (no engine) that scores a salary allocation
  into needs/wants/savings and coaches you.
- **/calculators** — six pure calculators (emergency fund, SIP growth, EMI, SIP
  goal, insurance estimate, rent-vs-buy).

---

## 9. Testing

`npm test` runs Vitest ([vitest.config.ts](vitest.config.ts), which only needs the
`$lib` alias since the tested code is pure):

- [engine.test.ts](src/lib/engine/engine.test.ts) — the simulation behaves like
  real money (saving grows net worth, EMIs amortise to zero, SIPs compound,
  insurance raises protection, meters stay clamped 0–100).
- [calculators.test.ts](src/lib/calculators/calculators.test.ts) — each calculator,
  including round-tripping the SIP-goal solver against the SIP growth formula.
- [content.validate.test.ts](src/lib/content.validate.test.ts) — all 50 cards and
  20 lessons load and validate.

`npm run check` runs `svelte-check` (full TypeScript pass, currently 0 errors).

---

## 10. Building & running (and the Windows constraint)

```bash
npm install
npm run dev        # frontend in a browser at localhost:1420 (uses localStorage)
npm run check      # type-check
npm test           # unit tests
npm run build      # static SPA into build/
npm run tauri:dev  # full desktop app (needs the cargo Tauri CLI; uses SQLite)
```

⚠️ On the development machine, a Windows **Application Control (WDAC)** policy
blocks compiling the Rust/Tauri layer (it blocks loading unsigned proc-macro
DLLs). The **frontend builds and runs fine**; only the native desktop compile is
blocked. Build the desktop app on an unrestricted machine or CI. Full details and
remedies are in [docs/BUILD-NOTES.md](docs/BUILD-NOTES.md).

---

## 11. Suggested reading order

1. **[schemas/](src/lib/schemas/)** — the data shapes everything else relies on.
2. **[engine/](src/lib/engine/)** + **[engine.test.ts](src/lib/engine/engine.test.ts)** — the pure model; read the test alongside the code.
3. **[stores/gameStore.ts](src/lib/stores/gameStore.ts)** — how raw state, derived views, actions, and persistence connect.
4. **[storage/](src/lib/storage/)** — the two backends behind one interface.
5. **[decisions.ts](src/lib/decisions.ts) / [lessons.ts](src/lib/lessons.ts) / [badges.ts](src/lib/badges.ts)** — content loading + derived achievements.
6. The **routes/** — now that you know the store, each page is small.

---

## 12. How to extend it

- **Add a decision card:** drop a JSON file in `content/decisions/` matching
  [decisionCard.ts](src/lib/schemas/decisionCard.ts) (effects are real actions —
  `addLoan`, `startSip`, `insurance`, expense deltas). Run `npm test`.
- **Add a lesson / quiz:** add a JSON file in `content/lessons/` matching
  [lesson.ts](src/lib/schemas/lesson.ts); unique `questionId`s. Run `npm test`.
- **Add a badge:** add an entry to `ALL_BADGES` in [badges.ts](src/lib/badges.ts)
  with an `earned(ctx)` predicate over state + meters.
- **Add a calculator:** write a pure function in `calculators/`, export it from
  the barrel, add a card to `/calculators`, and add a test.
- **Tune the simulation:** change the assumptions in
  [engine/config.ts](src/lib/engine/config.ts) (city costs, coverage rules, meter
  weights) — the tests will tell you what you broke.

---

## 13. Key design decisions (the "why")

- **Real money drives meters** (not abstract nudges) → the game's numbers are
  internally consistent and the engine is a meaningful, testable model.
- **Pure engine + unit tests** → the hardest logic is isolated and verifiable.
- **One storage interface, two backends, dynamic import** → the same build runs as
  a web demo (localStorage) and a native app (SQLite) without leaking Tauri APIs
  into the browser bundle.
- **Content as validated data** → non-developers can add scenarios/quizzes; bad
  data fails fast.
- **Educational framing everywhere** → app-wide disclaimer, no product names, and
  a "consult a SEBI-registered adviser" line on the report — by design, to stay an
  educational tool rather than investment advice.
