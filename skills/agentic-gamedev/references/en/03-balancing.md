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
