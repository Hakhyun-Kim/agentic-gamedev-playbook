/* =====================================================
 * 플레이북 단일 진실 원천 — 장별 파일을 읽어 합본을 만든다.
 *
 *   skills/agentic-gamedev/references/*.md   ← 원천 (스킬이 필요한 장만 읽는다)
 *   PLAYBOOK.md                              ← 생성물 (사람이 읽는 합본)
 *
 * MCP 서버·빌드 스크립트·테스트가 모두 이 모듈을 통해 같은 텍스트를 본다.
 * ===================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const REF_DIR = join(ROOT, 'skills', 'agentic-gamedev', 'references');

/* 문서 순서 = 이 배열 순서. 파일을 추가하면 여기에도 넣어야 한다(누락 시 테스트가 잡는다). */
export const CHAPTERS = [
  '00-intro.md',
  '01-3-gate.md',
  '02-architecture.md',
  '03-balancing.md',
  '04-graphics.md',
  '05-audio.md',
  '06-progression.md',
  '07-juice.md',
  '08-prompting.md',
  '09-harness.md',
  '10-first-5-minutes.md',
  '11-automation.md',
  '12-bootstrap.md',
  'A-genre-agnostic.md',
  'B-license-safe.md',
];

/* 줄바꿈은 항상 LF로 정규화한다 — Windows에서 클론하면 CRLF로 체크아웃돼
 * 합본 비교가 내용과 무관하게 어긋난다. */
export const readChapter = (file) => readFileSync(join(REF_DIR, file), 'utf8').replace(/\r\n/g, '\n');

/** 장별 파일 → PLAYBOOK.md 본문 (구분선으로 이어 붙인다) */
export function composePlaybook() {
  return CHAPTERS.map((f) => readChapter(f).trim()).join('\n\n---\n\n') + '\n';
}
