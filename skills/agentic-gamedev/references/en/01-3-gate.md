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
