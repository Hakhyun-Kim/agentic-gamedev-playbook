#!/usr/bin/env node
/* 장별 references/en/*.md & references/ko/*.md → PLAYBOOK.md & PLAYBOOK.ko.md 재생성. `npm run build` */
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, CHAPTERS, composePlaybook } from './playbook-source.mjs';

function buildLang(lang, filename) {
  const out = join(ROOT, filename);
  const next = composePlaybook(lang);
  const prev = (() => { try { return readFileSync(out, 'utf8'); } catch { return null; } })();

  if (prev === next) {
    console.log(`${filename} 최신 상태 (${CHAPTERS.length}장, ${next.split('\n').length}줄)`);
  } else {
    writeFileSync(out, next, 'utf8');
    console.log(`${filename} 재생성 (${CHAPTERS.length}장, ${next.split('\n').length}줄)`);
  }
}

buildLang('en', 'PLAYBOOK.md');
buildLang('ko', 'PLAYBOOK.ko.md');

