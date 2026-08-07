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
