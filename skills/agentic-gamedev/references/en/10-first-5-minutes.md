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
