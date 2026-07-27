#!/usr/bin/env node
/* =====================================================
 * 주간 회고 로컬 실행기 — `claude -p` (헤드리스)
 *
 * API 키가 필요 없다. 이 기기에 이미 로그인된 Claude Code 인증을 그대로 쓴다.
 *
 *   npm run retro           # 회고 → 커밋 → npm test (푸시 안 함)
 *   npm run retro -- --push # 검사를 통과하면 푸시까지
 *   npm run retro -- --force  # 이번 주에 이미 돌았어도 다시 실행
 *
 * 설계 원칙(플레이북 11.3):
 *   멱등    — 이번 주 회고 커밋이 이미 있으면 즉시 종료
 *   게이트  — 회고는 커밋만 한다(git push는 .claude/retro-settings.json에서 차단).
 *             npm test를 통과한 커밋만 이 스크립트가 민다.
 *   침묵    — 교훈이 없으면 아무것도 커밋하지 않는다. 빈 주는 정상이다.
 * ===================================================== */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const DO_PUSH = args.includes('--push');
const FORCE = args.includes('--force');

const sh = (cmd, opts = {}) =>
  spawnSync(cmd, { cwd: ROOT, shell: true, encoding: 'utf8', ...opts });
const out = (cmd) => (sh(cmd).stdout || '').trim();
const run = (cmd, label) => {
  const r = spawnSync(cmd, { cwd: ROOT, shell: true, stdio: 'inherit' });
  if (r.status !== 0) fail(`${label} 실패 (exit ${r.status})`);
};
const log = (...m) => console.log(...m);
const fail = (msg) => { console.error(`\n❌ ${msg}`); process.exit(1); };

/* ---------- 이번 주 식별자 (KST 기준 ISO 주차) ---------- */
function kstWeekId(now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000); // KST를 UTC처럼 다룬다
  const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // 그 주의 목요일
  const thu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  thu.setUTCDate(thu.getUTCDate() - ((thu.getUTCDay() + 6) % 7) + 3);
  const week = 1 + Math.round((d - thu) / (7 * 24 * 3600 * 1000));
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
const WEEK = kstWeekId();
const TRAILER = `Retro-Run: ${WEEK}`;

/* ---------- 사전 조건 ---------- */
log(`🔁 주간 회고 — ${WEEK} (KST)\n`);

if (out('git rev-parse --abbrev-ref HEAD') !== 'main') {
  fail(`main 브랜치에서만 돕니다 (현재: ${out('git rev-parse --abbrev-ref HEAD')})`);
}
if (out('git status --porcelain')) {
  fail('작업 트리가 깨끗하지 않습니다. 커밋하거나 되돌린 뒤 다시 실행하세요.\n' + out('git status --short'));
}

/* 멱등 — 이번 주 회고가 이미 돌았으면 끝 */
if (!FORCE && out(`git log --grep "${TRAILER}" --format=%h -1`)) {
  log(`이번 주(${WEEK}) 회고는 이미 반영됐습니다 — 종료. (다시 돌리려면 --force)`);
  process.exit(0);
}

log('원격 최신 상태로 맞추는 중…');
run('git pull --rebase origin main', 'git pull --rebase');
run('npm test', '시작 전 정합성 검사');

const BASE = out('git rev-parse HEAD');

/* ---------- 회고 실행 ---------- */
const PROMPT = `이 저장소의 \`RETRO.md\` 를 읽고 그 지시서대로 이번 주 회고를 수행하라.
지시서가 유일한 권위다 — 이 메시지에 없는 규칙도 거기 있으면 따르고, 충돌하면 지시서를 따른다.

오늘 날짜(KST)를 확인하고 \`git log --since\` 로 지난 7일 범위를 스스로 확정하고 시작하라.
승격할 교훈이 없으면 커밋하지 말고 이유를 요약해 끝내라 — 빈 주는 정상이다.

만드는 모든 커밋 메시지 마지막 줄에 다음 트레일러를 넣어라 (중복 실행 방지에 쓴다):
${TRAILER}

푸시하지 마라. 권한 설정에서 막혀 있고, 푸시는 npm test를 통과한 뒤 실행기가 한다.`;

log('회고 실행 중 (claude -p) — 몇 분 걸립니다…\n');
const claude = spawnSync(
  'claude',
  ['-p', '--settings', '.claude/retro-settings.json', '--model', 'claude-opus-5'],
  { cwd: ROOT, shell: true, input: PROMPT, stdio: ['pipe', 'inherit', 'inherit'] },
);
if (claude.status !== 0) fail(`claude -p 종료 코드 ${claude.status}`);

/* ---------- 검증 → 푸시 ---------- */
const commits = out(`git log --oneline ${BASE}..HEAD`);
if (!commits) {
  log('\n반영할 교훈 없음 — 커밋 없이 종료(정상).');
  process.exit(0);
}

log(`\n회고가 만든 커밋:\n${commits}\n`);

const test = spawnSync('npm test', { cwd: ROOT, shell: true, stdio: 'inherit' });
if (test.status !== 0) {
  fail(
    '정합성 검사 실패 — 푸시하지 않았습니다.\n' +
      `커밋은 로컬에 남아 있습니다. 확인 후 고치거나 \`git reset --hard ${BASE}\` 로 되돌리세요.`,
  );
}

if (!DO_PUSH) {
  log(`\n✅ 검사 통과. 푸시는 하지 않았습니다 — 확인 후 \`git push origin main\` 하거나,`);
  log(`   다음부터 자동으로 밀려면 \`npm run retro -- --push\` 를 쓰세요.`);
  process.exit(0);
}

run('git push origin main', 'git push');
log('\n✅ 회고 반영 완료 — 푸시했습니다.');
