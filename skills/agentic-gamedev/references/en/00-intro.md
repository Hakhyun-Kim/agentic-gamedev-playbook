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
