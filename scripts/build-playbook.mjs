#!/usr/bin/env node
/* 장별 references/*.md → PLAYBOOK.md 재생성. `npm run build` */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, CHAPTERS, composePlaybook } from './playbook-source.mjs';

const out = join(ROOT, 'PLAYBOOK.md');
const next = composePlaybook();
const prev = (() => { try { return readFileSync(out, 'utf8'); } catch { return null; } })();

if (prev === next) {
  console.log(`PLAYBOOK.md 최신 상태 (${CHAPTERS.length}장, ${next.split('\n').length}줄)`);
} else {
  writeFileSync(out, next, 'utf8');
  console.log(`PLAYBOOK.md 재생성 (${CHAPTERS.length}장, ${next.split('\n').length}줄)`);
}
