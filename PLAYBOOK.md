# Agentic GameDev Playbook — AI-Driven Game Development & Automated Verification

> A pragmatic methodology for building games with agentic AI, battle-tested across 4 games of different genres and tech stacks. Use this playbook as your default starting point for new game projects.

## Proven Projects

| Project | Genre | Tech Stack | Repository |
|---------|-------|------------|------------|
| **Dungeon 100** (`dungeon100`) | 3D Roguelike Dungeon Crawler | React + Three.js + TypeScript + Vite | [dungeon100](https://github.com/Hakhyun-Kim/dungeon100) |
| **Math Defense Hero** (`defenehero`) | 3D Educational Tower Defense | Vanilla JS + Three.js + esbuild | [defenehero](https://github.com/Hakhyun-Kim/defenehero) |
| **Door Runner** (`door-runner`) | 2D Runner | Vanilla JS + Canvas | [door-runner](https://github.com/Hakhyun-Kim/door-runner) |
| **Giwa Village** (`giwa-village`) | 3D Multiplayer Social (On-chain) | React Three Fiber + viem + Solidity | [giwa-village](https://github.com/Hakhyun-Kim/giwa-village) |

While genres and frameworks differed, the core methodology remained identical across all four projects. This proves the approach is a reusable template rather than a one-off stroke of luck.

The fourth project (`giwa-village`) had a distinct structure compared to the first three — it lacked single-player runs, making traditional death-distribution tracking impossible. Furthermore, part of the core logic ran in Solidity smart contracts.

Rather than abandoning the methodology when facing a non-standard project, we derived alternative verification techniques: **2.5** (Source Cross-Checking), **3.7** (Decision-Point Expectation), and **3.8** (Clock Injection). When a standard loop doesn't fit, find what lighter mechanism can replace it instead of giving up on automated verification.

---

## 0. Executive Summary

> **Place complexity in code rather than external assets, enabling AI agents to design, implement, balance, verify, and ship autonomously.**

Instead of relying on heavy asset pipelines or generated bitmap images, graphics are created via **procedural geometry** and audio via **Web Audio synthesis code**. This converts all project artifacts into plain text (code) that AI agents can inspect, edit, and test directly. Developers set the direction for gameplay and fun, while AI executes the implementation and playtests.

This verification loop continues post-launch. By running balance simulation bots on nightly schedules, you automatically catch balance regressions and gather daily market trend scouts (→ [11. Automation](#11-automation--background-loops)).

---

## 1. Feature Selection Standard — The 3-Gate Rule

Before adopting a new game concept or feature, pass it through three mandatory gates. If it fails any gate, defer it regardless of how appealing it seems.

| Gate | Key Question | Pass Example | Fail Example |
|------|--------------|--------------|--------------|
| **① Procedural** | Can it be generated in code (seeded RNG, math, Canvas, Web Audio) without external assets? | Procedural dungeons, synthesized SFX | Hand-drawn frame-by-frame sprite animations |
| **② Fun (Decisions)** | Does it add meaningful *decisions (choices)* to the core loop, or is it decorative? | Choosing between synergy build or stat upgrade | Static background scenery in the UI corner |
| **③ Verifiable** | Is it decoupled as pure logic so automated bots can measure metrics? | Wave survival rate, death depth distribution | Subjective elements like "vibe" or "feeling" |

- **Dungeon 100** used this rule to select a procedural roguelike genre ("a game where complexity resides in code, not art assets").
- **Math Defense Hero** used this rule to choose legendary evolution traits over linear numeric upgrades (switching from stat inflation to action-changing jackpots).

### 1.1 Gate ② (Fun) requires continuous re-validation — Re-check when adjacent systems evolve

A choice that starts as a meaningful decision can silently degrade into a tedious chore when adjacent systems (like adaptive balancing or lower-bound generators) are introduced. Gate ② is not a one-time check; ask *"Does this choice still affect outcomes?"* whenever surrounding logic changes.

The primary warning signal is repetition. If players pass through the same selection screen dozens of times per run without thought, that UI has ceased to be a decision and became a ritual. The fix is to remove the choice and convert it to a **blind randomized outcome**—show what was awarded and what was missed to retain tension, but remove the manual click to reduce decision fatigue to zero.

> **Production Example (Math Defense Hero, 2026-08-03):**
> Initially, players selected one of 3 difficulty cards before every math gate. However, an adaptive balancing system (scaling based on recent answer accuracy) was already adjusting difficulty dynamically, rendering manual card selection redundant. Players were clicking through the same menu 15+ times per session.
>
> We replaced manual selection with an automated roulette animation (spinning and stopping within 1.2–1.6s). Removing the manual pick eliminated UI fatigue while preserving the excitement of random draws. The automated balance bot used the exact same seeded RNG roulette, ensuring test logic remained fully synchronized with player logic.

---

## 2. Core Architecture Rules (Mandatory Checklist)

Enforce these 4 rules from **commit zero** when starting a new game project. Adhering to these rules unlocks automated balancing, deterministic testing, and continuous verification out of the box.

### 2.1 Decouple Pure Logic from Rendering ★ (Most Critical)

Write all core gameplay rules (combat, economy, wave scaling) as **pure functions completely unaware of the DOM or 3D renderer**. The renderer and audio engine merely consume event arrays emitted by the core engine.

```
data.(js|ts)     — All numeric balance values (tune numbers exclusively here)
engine.(js|ts)   — Pure logic: tick(state, dt) → events[] (shared by bot & live game)
render.(js|ts)   — Renderer: draws state and translates events to visual effects
sfx / music      — Audio engine: turns events into sound
main / app       — Main controller wiring components together
```

This separation enables **headless balance bots**. Bots bypass the `render` layer entirely and execute `engine` ticks at maximum speed in Node/CLI environments.

### 2.2 Seeded Determinism

Unify all pseudo-random number generation around a single seeded RNG function (an 11-line `mulberry32` implementation is sufficient). Guaranteeing *"Same Seed = Identical Playthrough"* makes bug reproduction and balance regression testing effortless.

```js
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Inject RNG functions into the engine via `createGame({ rng })`. The live web app passes `Math.random`, while automated test bots inject `mulberry32(seed)`.

**Pitfalls when modifying procedural generators:**

1. **Never draw branch decisions from the primary RNG stream:** Drawing a condition (e.g., *"Is this a special dungeon branch?"*) from the main `rand()` shifts all subsequent random numbers by one position, altering layout seeds across unbranched levels. Derive branch decisions from a separate seeded sub-stream.
2. **Append new random calls after existing generator calls:** Inserting a random call in the middle of a generation sequence causes stream offsets identical to pitfall #1.
3. **Preserve generator spatial contracts:** If unit spawner logic assumes *"room interiors consist exclusively of floor tiles"*, ensure new procedural layouts strictly preserve rectangular floor bounds so entity placement logic remains unmodified.
4. **Align connectivity rules with pathfinding:** If BFS pathfinding operates on 4-way cardinal grid directions, level connectivity checks must enforce 4-way cardinal adjacency. Diagonal-only passages appear open visually but block cardinal movement, trapping automated bots infinitely.
5. **Normalize enemy density when map area changes:** Expanding level area by 1.65x spreads out enemies and artificially lowers difficulty. Keep threat-per-unit-area constant to ensure balance tests remain meaningful.

> **Automated Map Verification CLI:**
> Create a headless CLI script (`npm run floor-check`) that invokes procedural map generators across hundreds of seeds in under 1 second. Verify reachability, trapped tiles, and spatial density automatically before committing layout changes.

### 2.2.1 Determinism in On-Chain & Probabilistic Games

While determinism primarily serves bot verification, it also builds player trust. Rather than simply publishing drop-rate tables, provide tools allowing players to **re-run seeds and choices to verify outcomes independently**.

```js
// Replay run via seed & player choices without requiring a backend server
const replayed = resolveRun(seed, choices);
assert(replayed.floor === onchainEvent.floor);
```

> **Giwa Village Production Note:**
> Consolidating dungeon resolution into pure functions allowed `scripts/verify-run.mjs` to reproduce contract execution down to the exact byte. An in-game *"🔒 Verify Outcome"* button recalculated completed floor state from seeds to match on-chain logs. *(Note: Unpredictable real-time values like `block.timestamp` in boss fights were explicitly documented as outside verification scope.)*

### 2.3 Single-File Balance Config

Consolidate all game balance numbers (costs, health scaling, drop rates, exponential multipliers) into a single `data` config module. Modifying numbers in one central file prevents desynchronization between bot simulations and live client builds.

### 2.4 Event-Driven Engine Output

The `tick(state, dt)` engine mutates state and returns a read-only array of frame events. Renderers and sound engines consume this array to trigger particle effects, floating damage text, and SFX.

```js
const events = tick(state, dt);   // [{type:'kill', x, y, gold}, {type:'castleHit', dmg}, ...]
renderer.onEvents(state, events); // Visual effects
handleEvents(events);             // Audio & toast UI
```

Under this architecture, headless bots ignore event arrays while web clients consume them for juice—**one engine, two consumers.**

### 2.5 Cross-Language Value Verification

When rules span multiple runtimes (e.g., TypeScript client + Solidity smart contracts or C# server), maintaining a single balance file is impossible. Enforce consistency by writing automated static AST/regex parsers that fail test suites if values diverge across repositories.

```js
// Parse threshold bounds across Solidity, TS Server, and TS Client
const table = {
  contract: doorThresholds('contracts/Guilds.sol', 'function doorRoll'),
  server:   doorThresholds('server/src/guilds.ts', 'doorOutcome('),
  client:   doorThresholds('client/src/chain/guilds.ts', 'function doorRollLocal'),
};
// Test fails if values diverge across implementations
```

### 2.6 Robust State Persistence (localStorage)

When implementing autosave:
1. **Save only at safe static checkpoints:** Capture state snapshots during preparation phases between waves, never during active combat loops where complex object graphs risk serialization bugs.
2. **Immediate serialization with deferred idle writes:** Serialize state synchronously upon state change, but defer disk/localStorage I/O using `requestIdleCallback`. Always register `pagehide` and `visibilitychange` listeners to flush pending writes instantly when tabs close.
3. **Treat save files as untrusted user input:** Clamp out-of-bound stats, drop invalid IDs, and relocate overlapping inventory items to bench slots during deserialization to prevent game crashes.
4. **Test invalid payloads:** Include automated test cases feeding malformed/hand-edited JSON files to ensure the parser recovers gracefully without throwing runtime exceptions.

### 2.7 Procedural Content Requirements Reporting

When procedural content generators read live simulation values (e.g., monster HP scaling), declare validation metadata (`needs`, `calc`) alongside the generated output:

```js
return {
  text: `If ${n} Orcs reach the castle, how much damage is taken?`,
  answer: hp * n,
  needs: [hp, n],         // Values that must appear explicitly in problem text
  calc: { mul: [hp, n] }, // Mathematical operations required
};
```

If generated parameters exceed target grade constraints (`fitsGrade`), automatically re-roll seeds, falling back to safe default templates if limits continue to fail.

### 2.8 Modularizing Large Files Without Modifying Import Paths

As engine files grow beyond 2,000 lines, split logic into sub-modules under `engine/` while maintaining a root **re-export hub (barrel file)**.

```js
// engine.js — Barrel file re-exporting sub-modules
export * from './engine/state.js';
export * from './engine/combat.js';

// Consumers continue using: import { tick } from './engine.js'
```

Keeping consumer import paths identical keeps refactoring diffs clean and isolates risk during code reorganizations.

### 2.9 Major-Feature Subtraction and Quality Gates

A major feature is not complete when its happy path first works. When a new loop replaces or absorbs an older one, unreachable screens, commands, save branches, bots, and terminology can leave the game in a confusing "half of each game" state. Treat the following two passes as part of the feature, not as optional polish.

**Before implementation — subtraction audit**

1. List every production entry point touched by the replacement: UI controls and routes, input bindings, data/config, save and migration paths, bot policy, tests, and player-facing copy.
2. Classify each old path as **remove**, **isolate for compatibility/test coverage**, or **keep**. Give every kept path a named owner and a reason; do not leave obsolete code reachable merely because it still compiles.
3. Capture the current deterministic-test and smoke-test baseline before moving code. Move legacy fixtures out of the production path where possible so the active loop has one obvious source of truth.

**After implementation — independent quality pass**

1. Replay the first minute and the full new loop on desktop and mobile. Check that the next action, state change, reward, and failure signal are legible without old labels or controls competing for attention.
2. Review information hierarchy, visual contrast and motion scope, feedback/sound, input latency, performance, and accessibility. Pick the highest-value one to three upgrades, or record why no upgrade is warranted with evidence.
3. Re-run deterministic engine tests and the real-player-equivalent balance bot, then perform the relevant manual smoke path. Document removed and deferred legacy items with their follow-up owner.

Call a change "major" when it alters the core loop or crosses two or more systems. It is ready to ship only after both gates are recorded; this makes cleanup and quality review scheduled work instead of a promise made after scope has already expanded.

---

## 3. Automated AI Balancing ★ (Core Engine)

Instead of manually playing hundreds of sessions to tune difficulty, **automated bots execute the game engine across hundreds of runs to output death-distribution reports**.

### 3.1 Simulated Player Profiles

Define player skill brackets using behavioral parameters:

```js
const PROFILES = {
  'beginner':     { acc: 0.45, actionsPerTurn: 1, comboChance: 0.15, sloppy: 0.5 },
  'intermediate': { acc: 0.70, actionsPerTurn: 3, comboChance: 0.70, sloppy: 0.3 },
  'expert':       { acc: 0.90, actionsPerTurn: 6, comboChance: 1.0,  sloppy: 0 },
};
```

Parameters like `acc` (accuracy) and `sloppy` (mistake rate) mimic **imperfect human gameplay**. Simulating only optimal play fails to reflect actual player difficulty curves.

### 3.2 Death Distribution Reports

Execute N automated sessions to track wave/depth distribution (mean, median, percentiles):

```
[Normal] Beginner     Avg Wave 9.1  (Median  9)   ← Goal: Enjoy early waves, hit wall at W10
[Normal] Intermediate Avg Wave 17.8 (Median 18)   ← Goal: Smooth mid-game progression
[Normal] Expert       Avg Wave 24.3 (Median 25)   ← Goal: Mastery pushes deep into late-game
```

Verify that survival depth monotonically increases with skill profiles and ensure zero infinite survival exploits exist.

### 3.3 Baselines & Regression Gates

Lock verified distributions in `baseline.json`. On subsequent commits, re-run bots and fail CI builds if median depth strays beyond allowed tolerances (e.g., ±3 waves).

```bash
node scripts/balance-bot.mjs 120 check   # Exits with 1 if baseline diverges
```

> **Math Defense Hero Production Note:**
> Adding legendary evolution traits initially caused expert median wave depth to jump from 22 to 29. The regression gate failed instantly, allowing us to introduce snowball suppression logic before shipping.

*Handling Valid Baseline Shift:*
If a bug fix corrects unintended unit destruction, median survival depth may jump significantly. Rather than reverting valid logic, update `baseline.json` with new measurements and document the reason in comments.

### 3.4 Decoupling Measurement Bots from Humanlike Bots

Modifying bot behavior invalidates baselines because you can no longer isolate whether metric shifts stem from game changes or bot code edits. Maintain two distinct bot categories:

- **`hard` (Measurement Bot):** Baseline gatekeeper. AI logic is strictly frozen once baselines are set.
- **`human` (Humanlike Bot):** Simulates human perception. Parses only visible HUD elements (HP text, combination hints, rarity borders) and operates with realistic reaction delays.

When giving humanlike bots defensive behaviors (e.g., retreating when low on HP), enforce **action timeouts** to prevent infinite boss battle stalemates.

### 3.5 The 2 Core Rules of Difficulty Curves

**① Threat Ramp — Accelerate damage taken rather than bloating enemy health.**

```js
// Bad: Infinite enemy HP bloat → Spongy early game enemies
// Good: Accelerate damage taken in late waves → Preserves early game feel
export const castleDmgScale = (w) => 1 + Math.max(0, w - 15) * 0.08;
```

**② Soft Cap — Asymptotically approach limits instead of multiplicative scaling.**

```js
value += (CAP - value) * 0.15;   // Diminishing returns keep stats bounded
```

Apply soft caps to movement speeds, attack ranges, and HP curves to prevent unbounded snowballing.

### 3.6 3 Rules for Running Bots in CI

1. **Clean Profile State:** Always initialize bots with empty local storage to prevent skipping intro/tutorial flows.
2. **Reduce Viewport Resolution:** Reduce headless viewports (640x360) to eliminate software rendering bottlenecks.
3. **Filter Benign 404s:** Exclude non-critical asset errors (e.g., favicons or optional sound fallbacks) so CI gates only fail on genuine runtime errors.

### 3.7 Closed-Form Expectation Testing for Decision Points

For simple Push-Your-Luck mechanics (e.g., choosing whether to bank rewards or push deeper), compute the zero-expectation breakeven threshold mathematically instead of running statistical bot runs:

```js
const breakeven = (pSafe + 2 * pBonus) / pTrap; // e.g., 3.59 floors
ok(breakeven >= 2 && breakeven <= 8);
```

### 3.8 Clock Injection for Time-Bound Rules

Rules tied to real time (daily resets, weekly events) should accept injected timestamps (`isEventNow(now = Date.now())`). Test time jumps in local test suites to verify daily bonuses instantly.

### 3.9 Tracking Near-Miss Metrics

A 0% death rate does not guarantee a lack of threat. Measure health pool loss variance across surviving runs to verify whether players experience true high-stakes tension.

### 3.10 Avoiding Teleportation in Bot Simulations

Never teleport bots directly to bosses or exits to speed up combat tests. Teleporting bypasses spatial approach risk and invalidates combat data.

### 3.11 Deferring Heavy State Updates Outside Combat Frames

Defer heavy UI and state re-renders (e.g., card unlocks or codex rewards upon elite kill) to peaceful transition points (e.g., portal entry). Deferring updates prevents frame drops during active combat ticks that cause false-positive bot deaths.

---

## 4. Zero-Asset Graphics & Visual Polish ("Escaping Indie Looks")

Generate all visual elements in code inside the `render` layer without external 3D models or art files.

| Technique | Visual Benefit | Core Implementation |
|-----------|----------------|---------------------|
| **Blob Shadows** | Anchors units visually to ground | Radial gradient ellipse under units |
| **Bloom** | Emissive surfaces glow vividly | Threshold filter + additive Gaussian blur |
| **Procedural Textures** | Unlimited themes from 1 texture | Grayscale noise × color palette multiplication |
| **Particle Pool** | Explosions, impacts, fire | Zero-allocation fixed arrays with TTL decay |
| **Floating Damage Numbers** | Impact feedback | Canvas strokeText + fillText fading upwards |
| **Camera Shake** | Hit weight & feedback | Cumulative impulse → squared decay curve |
| **Fog & Vignette** | Depth & environmental mood | Distance-based fog density attenuation |
| **Procedural Characters** | Distinct visual silhouettes | Primitive geometry + class props (helm, staff) |

```js
// Camera Shake: Accumulate impulse per hit, decay quadratically per frame
addShake(v) { this.shake = Math.min(0.8, this.shake + v); }
// Frame update:
this.shake = Math.max(0, this.shake - dt * 1.7);
const s2 = this.shake * this.shake;
cam.position.x += (Math.random() - 0.5) * s2 * 2.2;
```

### 4.1 Lighting, Real-time Shadows & Tone Mapping

1. **Real-time Shadows:** Use 1 Directional Light + PCFSoft 2048 shadow maps. Fit the shadow camera bounds tightly around the active playfield area.
2. **Filmic Tone Mapping:** Enable ACESFilmic tone mapping to prevent bright emissive particles from blowing out into pure white pixels.
3. **Automated Shadow Verification:** Verify shadow map rendering programmatically using pixel diffing (`readPixels`) between shadow ON/OFF frames.

### 4.2 Culling Off-Screen Elements (Frustum Checks)

In top-down or isometric cameras, avoid instantiating background elements (like sky domes or distant clouds) that lie outside the view frustum:

```js
const v = obj.position.clone().project(camera);
// Keep only if |v.x| < 1 && |v.y| < 1 && v.z < 1
```

Implement **Adaptive Quality Scaling**: Sample actual FPS 4 seconds after boot for 3 seconds. If FPS < 45, degrade bloom, DPR, and particle counts automatically, caching the choice in `localStorage`.

### 4.3 Integrating Textures: Separating Color from Bump

When applying textures to procedural meshes:
- **Natural surfaces (wood, dirt):** Use `map` (color map).
- **Stylized elements with defined colors (roof tiles, plaster):** Apply `bumpMap` only to gain surface depth while preserving palette colors.

### 4.4 Positional Impact Ring vs Camera Shake for Auto-Shooters

In games featuring rapid auto-firing weapons, triggering camera shake on every hit causes cumulative screen vibration and motion sickness. Replace global camera shake with **positional ground impact rings** (`ripple(x, z, power)`).

### 4.5 Mobile Viewport Optimization & Performance Profile

Detect mobile devices via `pointer: coarse` media queries and initialize at low quality from boot. Reclaim viewport area occupied by decorative background geometry by widening the camera FOV to enlarge touch targets.

---

## 5. Zero-Asset Audio Synthesis (Web Audio API)

Synthesize all audio effects and background music procedurally using two core primitives:

```js
tone(freq, start, dur, type, vol, glideTo)  // Single oscillator + Gain Envelope
noise(start, dur, vol, freq, q)             // White Noise + Bandpass Filter
```

### 5.1 Audio Design Recipes

- **Success:** Ascending arpeggio (C-E-G-C).
- **Failure:** Soft descending tone (avoid harsh sound design on incorrect answers).
- **Hit Impact:** Short bandpass filtered noise with rate-limiting (45–70ms threshold).
- **Low HP Alarm:** Low-frequency heartbeat pulse + synchronized screen edge pulse.

### 5.2 6 Elements of Rich Synthesized BGM

Avoid monotone electronic beeps by combining:

1. **Chord Progressions:** Define explicit harmony progressions per bar (`[[0, MIN7], [-4, MAJ7], ...]`).
2. **Pads:** Layer 2 saw-wave oscillators detuned by ±6 cents through a low-pass filter.
3. **Arpeggios:** Traverse chord notes using index patterns (`[0,1,2,1,0,2]`).
4. **Bass:** Clean low-pass filtered root notes (kept dry).
5. **Drums:** Sine pitch drop (Kick), bandpass noise (Snare), high-pass noise (Hi-hat).
6. **Reverb:** Feedback delay + low-pass filter bus.

### 5.3 Mandatory Audio Mute Checklist

1. **Separate SFX and BGM Mutes:** Allow users to toggle music independently from sound effects.
2. **Visible HUD Toggle:** Place mute controls prominently in the main HUD using icon + text labels.
3. **Persist Settings:** Cache mute preferences in `localStorage`.
4. **Keyboard Shortcut:** Bind key `M` for instant audio toggling.
5. **Non-destructive Muters:** Check `if (muted) return;` at play time rather than closing `AudioContext`.

### 5.4 Master Chain: Limiter, Panning, and Pitch Jitter

- **Master Limiter:** Connect a `DynamicsCompressor` node to prevent clipping when multiple sounds overlap.
- **Stereo Panning:** Pipe entity X positions into a `StereoPanner` node (-0.85 to 0.85).
- **Pitch Jitter:** Apply random pitch variation (±40–90 cents) to prevent repetitive sound fatigue.

### 5.5 Cleaning Up Sustained Oscillators

Sustained sounds (e.g., charge attacks) must register cleanup calls across 3 distinct termination paths:
1. Normal key/mouse release handlers.
2. Pause and modal UI open events.
3. Component and scene unmount cleanup lifecycle hooks.

### 5.6 Sidechain BGM Ducking

When impact SFX overlap with active BGM frequencies, apply temporary sidechain ducking to dip BGM volume slightly rather than increasing SFX volume:

```js
export function duckBgm(amount = 0.4, dur = 0.4) {
  const t = c.currentTime;
  duckGain.gain.cancelScheduledValues(t);
  duckGain.gain.setValueAtTime(duckGain.gain.value, t);
  duckGain.gain.linearRampToValueAtTime(1 - amount, t + 0.04);
  duckGain.gain.exponentialRampToValueAtTime(1, t + dur);
}
```

---

## 6. Progression & Upgrade Design

| Element | Description | Example A (Roguelike) | Example B (Defense) |
|---------|-------------|-----------------------|---------------------|
| **Rarity & Weights** | Common / Rare / Legendary odds | Common 1.0 / Rare 0.5 / Legend 0.22 | Weight increases with player skill |
| **Synergy Tags** | Holding 2+ matching tags boosts odds ×1.35 | Offense / Survival / Utility | Class & Attribute Synergies |
| **Evolution "Jackpots"★**| Upgrades that *change player actions* | 9-way arc spray, ricochet, explosions | Piercing shots, fire line, AoE slows |
| **Meta-Progression** | Persistence currency retained upon death | Coins → Forge Stat Upgrades | Star Shard → Shrine Blessing |
| **Kill Combos** | Rapid consecutive kills increase multiplier | 4-streak ×2 / 8-streak ×3 | 6-streak ×2 / 12-streak ×3 |

> **Key Design Lesson:**
> Replacing minor numeric boosts (+10% Attack) with **Action-Changing Evolution Jackpots** ("Arrows now pierce 3 targets and explode") yields exponentially higher player satisfaction and engagement.

### 6.1 Making Auxiliary Activities Core Gating Mechanisms

Placing educational or side activities as optional side tasks results in low player engagement. Integrate them directly as **mandatory progression gates** (unit synthesis, evolution unlocks, resurrection checkpoints).

### 6.2 Unifying Growth Vectors

Avoid cluttering progression with duplicate growth systems (e.g., individual unit level-ups AND tier synthesis). Consolidate growth into a single, intuitive synthesis tree.

### 6.3 3-Tier Synergy Evolution Trees

Prevent late-game stagnation by structuring unit evolution into 3 tiers (Basic → Special → Mythic). Restrict Mythic units to specific multi-recipe combinations, providing clear long-term goals for players.

### 6.4 Preventing Free Reroll Exploits

Prevent players from closing and reopening quiz gates to fish for easy questions by locking the specific synthesis combination for the current prep phase upon failure, rather than penalizing player gold.

---

## 7. Game Feel (Juice) & Controls Checklist

Low-cost, high-impact polish features to make games feel responsive and tactile.

- [ ] **Ghost Health Bar:** Primary HP bar decreases instantly; trailing yellow bar follows after a 0.5s delay.
- [ ] **Hit Flash:** Flash unit white + subtle scale-up upon taking damage.
- [ ] **Combo Pop:** Spring easing (`cubic-bezier(0.2,1.6,0.4,1)`) pop-up text chips for combo streaks.
- [ ] **Edge Screen Flash:** Red vignette pulse on base or player damage.
- [ ] **Low HP Pulse & Heartbeat:** Synchronized screen pulse with low-frequency heartbeat audio.
- [ ] **Floating Damage & Gold Numbers:** Numbers float upward and fade out.
- [ ] **Range Circles & Boss Health Bars:** Standard UI indicators (range indicators, upcoming wave previews).
- [ ] **First-Time Coach Chips:** Single-use coach tips with immediate start buttons.
- [ ] **Shareable Result Cards:** Canvas-rendered summary card PNG generator for social sharing.

### 7.0.1 Localized Flash Budget

Game feel does not require flashing the entire screen. Ordinary hits, combines, skills, and boss warnings should emphasize only the unit, card, route, or HUD element that caused the event.

1. **Do not use full-screen white or color flashes.** Use effect-centered auras, rings, particles, and damage numbers instead of overlays that cover the whole battlefield.
2. **Keep each emphasis short and restrained:** default to 400ms or less, low alpha, and a small part of the play area. Merge or refresh rapid repeat events rather than stacking new flashes.
3. **Localize danger signals too.** Base damage, low health, and boss warnings should live at the castle health bar, gate, or boss banner—the place that identifies their cause.
4. **Reinforce meaning with other signals.** Use sound, a brief camera nudge, unit tint, and floating numbers to preserve impact. Do not substitute stronger visual stimulation for clear information.
5. **Verify:** observe at least five seconds of sustained combat on mobile and lower-end screens; the player should be able to identify the source and target of each glow immediately.

### 7.1 Centralizing Feedback Dispatchers

Attach sound effects, visual popups, and toast notifications to a **centralized action queue** rather than scattering invocations across individual feature modules.

### 7.2 Keyboard-First & Predictive UI Standards

1. **Keyboard Binding Standards:** Support standard navigation (Enter to confirm, Space for primary action, Esc to close/cancel, Arrow/Tab to cycle selection).
2. **Predictive Auto-Advancement:** Automatically advance screens after displaying positive outcomes (0.8–1.2s delay). Do not auto-advance failure screens to allow players time to review errors.
3. **Robust Input Handling:** Ensure global key listeners process primary actions even when text inputs lose focus, correctly filtering IME composition states (`ev.isComposing`).

### 7.3 Pointer Precision Media Queries

Detect mobile touch input using `matchMedia('(pointer: coarse)')` instead of User-Agent string parsing. Unify virtual joystick rendering and UI hint text under a single detection constant.

---

## 8. AI Collaboration Prompt Patterns

| Pattern | Example Prompt | Value & Rationale |
|---------|----------------|-------------------|
| **Symptom-First** | "Movement feels unresponsive in late waves — reduce increments or flatten curve." | Delegates root-cause analysis & resolution to AI. |
| **Autonomous Delegation** | "Act as a reviewer and identify missing features to add to the game." | Allows AI agents to proactively discover mini-maps, combos, and polish. |
| **Competitor Analysis** | "Extract key fun factors from competitor reviews and identify what our game lacks." | Generated the core concept of Action-Changing Evolution Traits. |
| **Reference Porting** | "Reference Project X to execute a complete graphics/sound quality pass." | Ports battle-tested implementation patterns across tech stacks. |
| **Rules Promotion** | "Add this architecture constraint to CLAUDE.md to enforce it continuously." | Preserves design rules across context resets and session boundaries. |
| **Background Scheduling**| "Scout daily market trends, open-source repos, and hackathon projects every morning." | Promotes one-off tasks into **continuous daily background loops**. |
| **Sequential Processing**| "Execute steps sequentially, validating each change before moving on." | Prevents overlapping failure modes and enables isolated regression testing. |
| **Multi-Agent Audit** | "Audit all UI pathways across N parallel subagents; apply fixes only after cross-falsification." | Eliminates false positives through cross-verification of agent audits. |

### 8.1 Preserving Text-Based Proofs (Terminal SVGs over Screenshots)

Avoid committing binary screenshots (PNG/GIF) for test proofs. Instead, render CLI stdout directly to **terminal SVG vector files**. This reduces file sizes by ~1000x (12KB SVG vs 11.8MB GIF) and keeps verification proofs reviewable via `git diff`.

---

## 9. Automated Verification Harness

Built-in instrumentation enabling AI agents to execute, inspect, and verify games headlessly.

### 9.1 Core Harness Instrumentation

1. **Debug Hooks:** Expose global control APIs (`window.__game = { state, jump(wave), addGold(n) }`) behind a `?debug` URL gate.
2. **`?rafshim` (rAF Polyfill):** Replace `requestAnimationFrame` throttled background tabs with fixed timers to prevent execution freezes during automated CLI test runs.
3. **Fixed Timestep Engine Loop:** Guarantee identical gameplay speed regardless of rendering frame drops: `while (acc >= 1/60) { tick(1/60); }`.
4. **Disable Time-Altering FX During Bot Runs:** Automatically disable hit-stops (`dt=0` pauses) or slow-motion FX during bot runs to preserve deterministic execution order.
5. **Pixel Capture & Inspection:** Enable `preserveDrawingBuffer` on WebGL canvases to extract raw pixel data (`readPixels`) for automated contrast, bloom, and color checks.
6. **Headless CLI Logic Audits:** Execute pure functions (e.g., maze reachability, procedural generation rules) in Node.js, auditing hundreds of layouts in under 1 second without opening browser instances.

### 9.2 Headless Audio Node Tracking

Since headless browsers lack audio output, override `AudioContext` prototypes to intercept node creation and count active oscillators, buffers, and convolvers:

```js
window.__audio = { osc: 0, buf: 0, panner: 0 };
// Increment node counts upon createOscillator / createBufferSource calls
```

### 9.3 Procedural Content Validation & Evaluation

For generated mathematical problems or text quests, run automated evaluators over tens of thousands of generated instances (`evaluate(p.text) === p.answer`) to catch incorrect answers, ambiguous syntax, or irrational numbers prior to shipping.

### 9.4 Silent Test Execution Enforcement

Ensure test flags (`?rafshim`, `?debug`) automatically mute audio output without overwriting saved user preference state in `localStorage`.

### 9.5 Living Demo Bots via Shared AI Logic

Share core bot decision modules (`src/bot.js`) directly with browser demo modes. Sharing decision logic guarantees that public demo loops serve as continuous, living E2E regression tests.

---

## 10. Designing the First 5 Minutes (Reviewer & Onboarding Optimization)

Game jam evaluations and player retention metrics show a recurring pattern: **reviewers spend only a few minutes per game**, and initial impression polish dictates evaluation scores. Reducing friction before reaching the core gameplay loop is paramount.

| Strategy | Action Item | Purpose |
|----------|-------------|---------|
| **Instant Play Button** | Add "⚡ Instant Battle" to the title menu | Bypass intro cinematics and tutorials to launch Wave 1 in <1 sec |
| **Single-Use Coach Chips**| Display a 1-line control hint during the first run | Teach controls implicitly without forcing modal tutorials |
| **Expose Core Goals Early** | Display ultimate targets on UI ("N steps away from Mythic") | Ensure unique gameplay jackpots are visible immediately |
| **Autoplay Spectate Mode** | Single-click automated AI gameplay showcase | Insurance policy for judges who lack time to play manually |

> **Automated Verification Tip:**
> Lock onboarding pathways with CI smoke tests verifying that clicking "Instant Play" brings up core HUD elements within 2 seconds.

---

## 11. Continuous Automation — Background Execution Loops

Elevate testing tools into **continuous background automation workflows** (CI/Cron), creating self-maintaining verification loops.

| Automated Loop | Frequency | Core Functionality |
|----------------|-----------|--------------------|
| **Deployment Smoke Gate** | On `git push` | Runs headless browser audits; fails deployments on console runtime errors. |
| **Nightly Balance Gate** | Daily at midnight | Runs bot simulations; opens automated GitHub issues if medians drift from baselines. |
| **Daily Ghost Runs** ★ | Daily at midnight | Executes seeded bot runs and commits recorded ghost telemetry as game content. |
| **Morning Trend Scout** | Every morning | Researches game jam trends and open-source repos, filtering top ideas via 3-Gate rules. |
| **Automated Doc Metrics** | Periodic | Parses git commit history to update performance metrics and documentation stats. |

### 11.1 Promoting Test Artifacts to Gameplay Content

Commit daily bot simulation logs (`public/ghost/<date>.json`) as static JSON files. Web clients can fetch these files as daily leaderboard ghosts without requiring dedicated backend servers or databases.

### 11.2 5 Rules for Cron Automation

1. **Idempotence:** Exit instantly if today's record already exists.
2. **Explicit Timezones:** Align Cron UTC execution with game local time (e.g., KST).
3. **Silent Failures:** Never commit corrupted or incomplete bot telemetry; rely on fallback simulation models instead.
4. **Separate Exit Codes:** Distinguish runtime crashes (exit code 1) from valid baseline shifts (exit code 2).

---

## 12. Bootstrap Checklist for New Game Projects

```
[ ] data.(js|ts)   — Centralized numeric balance values
[ ] engine.(js|ts) — Pure tick(state, dt) → events[] with injected RNG
[ ] Seeded RNG (mulberry32) — Live client = Math.random / Bot = seeded RNG
[ ] render.(js|ts) — Render state + emit events to visual effects (blob shadows)
[ ] sfx  — tone() + noise() primitives, rate-limited impact hits (45–70ms)
[ ] music — 16-step sequencer with state-based BGM tracks
[ ] scripts/balance-bot — 3 virtual player profiles × N runs → death distributions
[ ] scripts/baseline.json + `check` regression gate
[ ] Closed-form expectation test for Push-Your-Luck mechanics (3.7)
[ ] Cross-language value verification parsers for multi-runtime projects (2.5)
[ ] Zero-external-asset verification tests (Appendix B)
[ ] window.__game debug hooks + ?rafshim + fixed timestep (Chapter 9)
[ ] Game feel: Ghost health bar, hit flash, combo pops, floating damage text
[ ] Full keyboard controls (Enter/Space/Esc/Tab/hotkeys) with UI hotkey badges
[ ] Predictive UI: Auto-advance single choices, one-button loop execution
[ ] Dominant stat card badges & derived stat hover tooltips
[ ] Action-Changing Evolution Jackpot traits (at least 1 implementation)
[ ] Meta-progression currency retained upon player death
[ ] Adaptive graphics quality scaling based on real-time FPS benchmarks
[ ] First 5 minutes: "Instant Play" + coach chips + target goal hints + PNG share
[ ] CI smoke gate (clean onboarding + 0 console errors, benign 404 filters)
[ ] Nightly automated balance regression Cron (opens issues on drift)
[ ] Daily bot run automation → Commit telemetry JSON as daily leaderboards
[ ] Morning trend scout agent (repo review → 3-Gate filter → top recommendations)
[ ] CLAUDE.md — Architecture rules, verification commands, backlog candidates
[ ] Public repository setup + automated GitHub Pages deployment pipeline
```

> **Implementation Priority:**
> Complete the upper half (Engine, RNG, Balance Bot, Game Feel) during **Week 1**. Add the bottom automation loops **immediately after the core loop is fun**.

---

## Appendix A. Why the Methodology is Genre-Agnostic

| Axis | Roguelike (`dungeon100`) | Defense (`defenehero`) | Social (`giwa-village`) | Genre-Agnostic Abstraction |
|------|-------------------------|------------------------|-------------------------|---------------------------|
| **Core Pressure** | Enemies scale by dungeon depth | Enemies scale by wave number | Weekly boss & scheduled events | Threat & opportunity scaling over time |
| **Growth** | Draft-based item selection | Summon, combine, upgrade | Titles, trinkets, on-chain glyphs | Randomness + Player decision-making |
| **Jackpot** | Evolution skill cards | Legendary evolution traits | — (Future Improvement Item) | Moments that change core player action |
| **Verification** | Death depth distribution | Wave survival distribution | Decision breakeven tests (3.7) | Automated verification of choice validity |
| **Stakes** | Run reset upon death | Base destruction reset | Risk of temporary resource loss | Risk creates meaningful decision-making |

While themes and mechanics differ, the rightmost column (**Genre-Agnostic Abstraction**) remains invariant across all game projects.

---

## Appendix B. License-Safe Rules

Strict policies preventing open-source license violations when importing external assets.

### B.1 Core Import Policy

- **Default Rule:** Procedurally generate assets in code by default.
- **Import Exemption Rule:** If external assets are imported, enforce a strict "No import without ledger registration (`assets.json`)" rule.

### B.2 Asset Class Import Policies

| Asset Class | Policy | Rationale & Requirements |
|-------------|--------|--------------------------|
| **Fonts** | OFL / CC0 only | Document in `CREDITS.md` + mandatory system font fallback. |
| **Graphics** | Allowed under unified art style | Prevent visual clutter caused by mismatched asset styles. |
| **Audio** | Synthesize BGM; single-shot SFX imports allowed | Single-shot SFX benefit from audio samples; BGM requires dynamic code variation. |

### B.3 The 4 Rules of Asset Ledgers

1. **Machine-Readable Ledger (`assets.json`):** Track source URLs, authors, and licenses, auto-generating `CREDITS.md`.
2. **Preserve Original Binaries:** Perform pitch/volume/color modifications in code to retain raw file checksums.
3. **Automated Verification (`npm run assets`):** Run CLI scripts verifying asset fingerprints against ledger entries.
4. **Guaranteed Fallback Grace:** Ensure code falls back gracefully to system fonts and synthesized audio if assets throw 404s.
