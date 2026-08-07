---
title: 'Refactoring 1,477 lines of Engine Code into Re-Export Barrel Modules'
date: '2026-08-05'
category: 'Architecture'
author: 'Hakhyun Kim'
summary: 'How we split monolithic engine.js into sub-modules without breaking a single consumer import line.'
---

# Refactoring 1,477 lines of Engine Code into Re-Export Barrel Modules

As our educational tower defense game *Math Defense Hero* grew, `engine.js` reached 1,477 lines and `render3d.js` expanded to 2,555 lines. While manageable for humans, long single files inflate context usage for AI coding agents.

## The Re-Export Barrel Pattern

Instead of updating consumer `import` statements across dozens of UI and testing files, we turned `engine.js` into a **re-export hub**:

```js
// engine.js — Barrel file re-exporting sub-modules
export * from './engine/state.js';
export * from './engine/combat.js';
export * from './engine/roster.js';
export * from './engine/economy.js';
```

## Verification

We verified the refactoring via:
- 14 engine invariant unit assertions
- 3,000 generated math question tests
- 60 automated balance bot runs
- Zero runtime console errors across 5 demo waves
