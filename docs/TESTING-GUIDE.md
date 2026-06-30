# Testing & Learning Walkthrough

A hands-on guide to exercise **every feature**, understand **what it does**, **why
it matters**, and **which code powers it**. Follow it top to bottom — the order
matches the natural user journey, so your understanding builds up as you go.

> You'll test in the **browser** (`npm run dev`). The desktop/SQLite build is
> blocked on this machine, but the browser uses the localStorage backend and is
> functionally identical — same screens, same logic.

---

## 0. Get it running

```bash
npm install        # once
npm run dev        # starts the app
```
Open **http://localhost:1420** in a browser. Open **DevTools** (F12) and keep two
tabs handy:
- **Console** — to spot any runtime errors.
- **Application → Local Storage → localhost:1420** — to watch data persist under
  the key `firstsalary-quest:game`.

**Tip:** to start totally fresh at any time, run this in the Console:
```js
localStorage.clear(); location.reload();
```

---

## 1. The automated test suite (your safety net)

Before clicking anything, run the tests. This is "testing" too — and it's what an
interviewer means by "is it tested?".

```bash
npm test       # 19 unit tests (engine, calculators, content)
npm run check  # full TypeScript check — expect 0 errors
npm run build  # produces the static app in build/
```

**What each test file proves (open them and read alongside):**
- [src/lib/engine/engine.test.ts](../src/lib/engine/engine.test.ts) — the money
  simulation behaves correctly (saving grows net worth, EMIs pay off to ₹0, SIPs
  compound, insurance lifts protection, meters stay 0–100).
- [src/lib/calculators/calculators.test.ts](../src/lib/calculators/calculators.test.ts)
  — every calculator's maths, incl. the SIP-goal solver round-trip.
- [src/lib/content.validate.test.ts](../src/lib/content.validate.test.ts) — all 50
  cards and 20 lessons load and pass their schemas.

**Why it matters:** these tests guard the hardest, least-visible logic. Try this:
open `engine.test.ts`, change an expected number to something wrong, run
`npm test`, watch it fail — that's the safety net working.

---

## 2. Home page  (`/`)

**Test:** Load `/`. You should see the hero, three feature cards, the yellow
educational disclaimer, and a primary button that says **"Create your character"**
(or "Continue your run" if you already have a game).

**Look for:** the button text changes based on whether a game exists (it reads the
`hasProfile` store).

**Why it matters:** it sets the framing ("learn before you make expensive
mistakes") and the **educational-only disclaimer** is shown app-wide — the legal/
ethical backbone of the whole product.

**Code:** [src/routes/+page.svelte](../src/routes/+page.svelte),
[src/routes/+layout.svelte](../src/routes/+layout.svelte) (nav + disclaimer).

---

## 3. Character setup  (`/setup`)

**Test:**
1. Click "Create your character".
2. Leave **Name** blank and submit → you should get a validation message (not a
   silent failure).
3. Fill Name (e.g. *Aarav*), pick a City, type any salary (e.g. `50000`), choose
   family dependency and job type, submit.
4. You land on **`/game`** at Month 1.

**Look for:** the salary field accepts *any* number now (this was a real bug we
fixed — the browser used to block round numbers like 40000).

**Why it matters:** the character drives the entire simulation — city sets your
cost of living, salary sets income, family dependency adds expenses and changes
whether term insurance matters. It's the input to the engine.

**Code:** [src/routes/setup/+page.svelte](../src/routes/setup/+page.svelte)
(validates with `userProfileSchema`, calls `startNewGame`),
[src/lib/schemas/profile.ts](../src/lib/schemas/profile.ts),
[src/lib/engine/setup.ts](../src/lib/engine/setup.ts) (`createInitialState`).

---

## 4. The game loop  (`/game`)  ← the core

**Test:**
1. At Month 1, note the **money strip** (Cash / Invested / Net Worth) and the five
   **meters** at the bottom.
2. Read the decision card and click a choice.
3. Watch: a **💡 lesson** appears, the **meters move**, the **money strip
   changes**, and the month advances.
4. Keep going through all 12 months. At the end you get a **"You finished all 12
   months!"** screen with **"See your report →"**.

**Things to verify (this is where you'll learn the engine):**
- **Take an EMI** (a "buy on EMI / loan" choice) → Net Worth drops, and in later
  months you'll see Cash get nibbled as EMIs are paid.
- **Start a SIP** (an "invest / SIP" choice) → "Invested" grows month over month;
  the **Financial Freedom** meter rises.
- **Buy health insurance** → the **Protection** meter jumps.
- **Overspend on lifestyle** → the **Lifestyle Inflation** meter falls.
- **Consistency check:** Net Worth ≈ Cash + Emergency Fund + Invested − any loan
  balances. Meters never leave 0–100.

**Replayability test:** finish or reset, then create a *different* character name
→ Month 1 shows a **different scenario**. Same character always sees the same
sequence (deterministic). This is the per-month card pool.

**Why it matters:** this is the product. Every choice is a real money action run
through the simulation, so the consequences are realistic and compounding — that's
what makes it teach, not just quiz.

**Code:** [src/routes/game/+page.svelte](../src/routes/game/+page.svelte),
[src/lib/decisions.ts](../src/lib/decisions.ts) (`pickCardForMonth`),
[src/lib/stores/gameStore.ts](../src/lib/stores/gameStore.ts) (`applyChoice`),
[src/lib/engine/simulate.ts](../src/lib/engine/simulate.ts) (`applyEffects`,
`advanceMonth`).

---

## 5. Persistence  (does my progress survive?)

**Test:**
1. Mid-game, **refresh the page** (F5) → your character, month, money and meters
   are exactly where you left them.
2. In DevTools → Application → Local Storage, open the `firstsalary-quest:game`
   key → you'll see the full saved game as JSON (profile, state, decisionHistory,
   quizResults).
3. Start a **new character** → the old save is wiped and replaced.

**Why it matters:** it's "local-first" — your data lives on your device, works
offline, no account needed. The same code path writes to SQLite in the desktop
build.

**Code:** [src/lib/storage/](../src/lib/storage/) (`getStorage` picks
localStorage vs SQLite), `hydrate()` in the store (restores on load).

---

## 6. Dashboard  (`/dashboard`)

**Test:** Open `/dashboard` during or after a game. Check:
- The **Financial Resilience Score** (0–100) and its verdict band.
- The four money figures and the five meters.
- The **Badges** row (count + grid).
- The **decision history** list.
- After finishing, a green **"view your full report"** banner appears.
- With no game started, it shows an empty "Create a character" state.

**Why it matters:** the at-a-glance health view. The **Resilience Score** is the
single headline number that blends all five meters — the thing a player optimises.

**Code:** [src/routes/dashboard/+page.svelte](../src/routes/dashboard/+page.svelte),
meters/resilience are *derived* in [gameStore.ts](../src/lib/stores/gameStore.ts),
formulas in [src/lib/engine/meters.ts](../src/lib/engine/meters.ts).

---

## 7. Final report + share card  (`/report`)

**Test:**
1. Finish a game → "See your report →".
2. Check the big **share card** (score /100, verdict, net worth).
3. Check the **net-worth-over-the-year chart** (it's drawn from the monthly
   history the engine recorded).
4. Click **"Copy share text"** → paste somewhere; it copies a sentence with your
   score + badge count + the educational disclaimer.
5. Scroll to the **Badges** section and the **decision list**.

**Why it matters:** this is the "viral hook" — the shareable outcome that makes
students compare scores, and the chart visualises the consequences of a year of
choices. Note the **SEBI-safe disclaimer** at the bottom.

**Code:** [src/routes/report/+page.svelte](../src/routes/report/+page.svelte)
(LayerChart for the chart).

---

## 8. Badges

**Test:** Play a **wise** run (always pick the saving/investing/insuring option) →
on the report/dashboard most/all of the **9 badges** light up in full colour. Play
a **reckless** run (always the tempting option) → most badges stay greyed
("Locked") with a hint.

**Why it matters:** rewards good habits and gives concrete goals ("get the EMI
Escape Artist badge"). They're computed purely from your state, so they're always
honest.

**Code:** [src/lib/badges.ts](../src/lib/badges.ts) (each badge has an
`earned(ctx)` rule), [src/lib/components/Badges.svelte](../src/lib/components/Badges.svelte).

---

## 9. Learning modules + quizzes  (`/learn`)

**Test:**
1. Open `/learn` → a grid of **20 modules** and a "completed X/20" counter.
2. Click a module → read the sections, then the **quiz**.
3. Answer a question → it locks and shows **✓/✗** (and marks the right answer);
   the running **score** updates; a perfect score shows "🎉 Perfect!".
4. Go back → that module's card now shows **"✓ n/5"** and the counter increments.
5. Refresh → your quiz progress persists.

**Why it matters:** this is the "literacy" half — bite-sized lessons + immediate
quiz feedback. Quiz results persist so progress is tracked (it'd power the brief's
"before/after scores" in a pilot).

**Code:** [src/routes/learn/+page.svelte](../src/routes/learn/+page.svelte),
[src/lib/lessons.ts](../src/lib/lessons.ts),
[src/lib/components/Quiz.svelte](../src/lib/components/Quiz.svelte),
`recordQuizAnswer` in the store.

---

## 10. Budget mini-game  (`/budget`)

**Test:**
1. Open `/budget`. Adjust the category amounts.
2. Watch the **"Balanced 🎯 / left over / over budget"** indicator and the
   **needs/wants/savings split bar** update live.
3. Set Investments + Emergency fund to 0 → the **Coach** warns you. Make savings
   ≥ 20% → it praises you. Overspend → it flags you're over budget.

**Why it matters:** it teaches the very first skill — *give every rupee a job* and
keep a healthy savings rate — interactively, with instant feedback. It's
standalone (doesn't touch the engine), which is itself a good thing to notice.

**Code:** [src/routes/budget/+page.svelte](../src/routes/budget/+page.svelte).

---

## 11. Calculators  (`/calculators`)

**Test each of the six** — change inputs and watch outputs recompute live:
1. **Emergency Fund** — expenses × months vs saved → target, shortfall, % funded.
2. **SIP Growth** — monthly × return × years → future value (note returns > what
   you put in).
3. **Loan EMI** — principal/rate/tenure → monthly EMI + total interest.
4. **SIP for a Goal** — target/return/years → the monthly SIP needed.
5. **Insurance Estimator** — income + city + "dependents?" → recommended covers
   (toggle dependents off → **Term = "Not urgent"**; switch Metro/Tier-2 → health
   cover changes).
6. **Rent vs Buy** — enter a home price/rent etc. → a **verdict** plus buy vs
   rent-and-invest net worth.

**Why it matters:** the "show me the maths" layer behind the game's decisions —
the same calculator functions the engine and lessons rely on. Great for a player
to plug in their *own* numbers.

**Code:** [src/routes/calculators/+page.svelte](../src/routes/calculators/+page.svelte),
[src/lib/calculators/](../src/lib/calculators/).

---

## 12. Edge cases — try to break it

Doing this builds real confidence in the app:
- **All reckless choices** for 12 months → Net Worth can go deeply negative,
  Resilience near 0, verdict "High Risk". Meters still clamp at 0 (don't go
  negative). ✅ correct.
- **Visit a screen with no game** (`/dashboard`, `/report` after `localStorage.clear()`)
  → friendly empty state, not a crash.
- **Over-allocate the budget** → "over budget" warning, not a broken number.
- **Reload on every screen** mid-flow → state restores each time.
- **Two browser tabs** → each reads the same localStorage on load.

---

## 13. Connect it to the code (the "aha" exercise)

Trace **one click** through the layers — this is the whole architecture in
miniature:

1. You click a choice in [game/+page.svelte](../src/routes/game/+page.svelte) →
   it calls `applyChoice(card, i)`.
2. `applyChoice` in [gameStore.ts](../src/lib/stores/gameStore.ts) runs
   `applyEffects` then `advanceMonth` from the **engine**, sets `gameState`, and
   calls `persist(...)`.
3. `gameState` changing makes `meters`, `resilience`, `moneySummary`, and `badges`
   (all **derived**) recompute automatically.
4. The UI re-renders from those derived values. Persistence happened in the
   background.

If you understand that loop, you understand the app. The full map is in
[ARCHITECTURE.md](../ARCHITECTURE.md).

---

## 14. Quick checklist

```
[ ] npm test (19 pass) · npm run check (0 errors) · npm run build (ok)
[ ] Home: button reflects whether a game exists
[ ] Setup: blank name blocked; any salary accepted
[ ] Game: meters + money react; EMI/SIP/insurance/lifestyle each behave
[ ] Game: different character → different Month-1 card
[ ] Persistence: refresh mid-game restores; new game wipes
[ ] Dashboard: resilience, meters, money, badges, history, empty state
[ ] Report: share card, chart, copy share text, badges
[ ] Badges: wise run lights them up; reckless run leaves them locked
[ ] Learn: read + quiz + score + completion + persistence (all 20 modules)
[ ] Budget: split bar + coach + balance indicator
[ ] Calculators: all 6 recompute; insurance term toggles; rent-vs-buy verdict
[ ] Edge cases: negative run clamps; empty states; reloads
```
