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
