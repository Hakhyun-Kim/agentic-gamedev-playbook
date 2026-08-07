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
