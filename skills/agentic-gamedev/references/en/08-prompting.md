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
