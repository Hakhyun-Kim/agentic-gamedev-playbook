/* MCP 서버 스모크 테스트: 핸드셰이크 → 도구/리소스/프롬프트 왕복 검증
 * + 버전 3중 대조 + 플레이북 합본 신선도 + 스킬↔장별 파일 링크 검증 */
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, REF_DIR, CHAPTERS, composePlaybook } from './playbook-source.mjs';
const server = spawn(process.execPath, [join(ROOT, 'mcp', 'server.mjs')], { stdio: ['pipe', 'pipe', 'inherit'] });

const pending = new Map();
let nextId = 1;
let buf = '';

server.stdout.on('data', (chunk) => {
  buf += chunk.toString();
  let idx;
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    const msg = JSON.parse(line);
    const resolver = pending.get(msg.id);
    if (resolver) { pending.delete(msg.id); resolver(msg); }
  }
});

function rpc(method, params) {
  const id = nextId++;
  const p = new Promise((res, rej) => {
    pending.set(id, res);
    setTimeout(() => rej(new Error(`timeout: ${method}`)), 5000);
  });
  server.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  return p;
}
const notify = (method) => server.stdin.write(JSON.stringify({ jsonrpc: '2.0', method }) + '\n');

let failed = 0;
function check(name, cond) {
  console.log(`${cond ? '✅' : '❌'} ${name}`);
  if (!cond) failed++;
}

try {
  const init = await rpc('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } });
  check('initialize', init.result && init.result.serverInfo.name === 'gamedev-playbook');
  notify('notifications/initialized');

  const tools = await rpc('tools/list');
  check('tools/list (4개)', tools.result && tools.result.tools.length === 4);

  const toc = await rpc('tools/call', { name: 'playbook_toc', arguments: {} });
  check('playbook_toc', toc.result && toc.result.content[0].text.includes('목차'));

  const sec = await rpc('tools/call', { name: 'playbook_section', arguments: { query: '밸런싱' } });
  check('playbook_section(밸런싱)', sec.result && sec.result.content[0].text.includes('가상 플레이어'));

  const secSound = await rpc('tools/call', { name: 'playbook_section', arguments: { query: '사운드' } });
  check('playbook_section(사운드)', secSound.result && secSound.result.content[0].text.includes('Web Audio'));

  const chk = await rpc('tools/call', { name: 'playbook_checklist', arguments: {} });
  check('playbook_checklist', chk.result && chk.result.content[0].text.includes('balance-bot'));

  const res = await rpc('resources/list');
  check('resources/list (10+)', res.result && res.result.resources.length >= 10);

  const read = await rpc('resources/read', { uri: res.result.resources[2].uri });
  check('resources/read', read.result && read.result.contents[0].text.length > 50);

  const prompts = await rpc('prompts/list');
  check('prompts/list (3개)', prompts.result && prompts.result.prompts.length === 3);

  const ng = await rpc('prompts/get', { name: 'new-game', arguments: { concept: '고양이 낚시 로그라이크' } });
  check('prompts/get(new-game)', ng.result && ng.result.messages[0].content.text.includes('고양이 낚시'));

  const bad = await rpc('tools/call', { name: 'no_such_tool', arguments: {} });
  check('unknown tool → error', !!bad.error);

  const ping = await rpc('ping');
  check('ping', !!ping.result);

  // 버전은 세 곳(package.json · plugin.json · server.mjs)에 살아 있어 손으로 맞추면 반드시 어긋난다.
  // 플레이북 2.5의 원칙을 이 저장소 자신에게 적용 — 합칠 수 없으면 어긋날 때 깨지게 묶는다.
  const readVer = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8')).version;
  const srcVer = readFileSync(join(ROOT, 'mcp', 'server.mjs'), 'utf8').match(/const VERSION = '([^']+)'/)?.[1];
  const vers = { 'package.json': readVer('package.json'), 'plugin.json': readVer('.claude-plugin/plugin.json'), 'server.mjs': srcVer };
  const uniq = [...new Set(Object.values(vers))];
  check(`버전 3중 일치 (${uniq.length === 1 ? uniq[0] : JSON.stringify(vers)})`, uniq.length === 1);

  // ---- 원천(references/*.md) ↔ 생성물(PLAYBOOK.md) ↔ 스킬(SKILL.md) 대조 ----
  // 셋 다 같은 내용을 가리켜야 한다. 같은 이유로 합칠 수 없으니 어긋나면 깨지게 묶는다.
  const onDisk = readdirSync(REF_DIR).filter((f) => f.endsWith('.md')).sort();
  check(
    `references 목록 일치 (${CHAPTERS.length}장)`,
    onDisk.length === CHAPTERS.length && onDisk.every((f) => CHAPTERS.includes(f)),
  );

  const built = readFileSync(join(ROOT, 'PLAYBOOK.md'), 'utf8').replace(/\r\n/g, '\n');
  check('PLAYBOOK.md 최신 (npm run build)', built === composePlaybook());

  const skill = readFileSync(join(ROOT, 'skills', 'agentic-gamedev', 'SKILL.md'), 'utf8');
  const linked = [...skill.matchAll(/references\/([\w.-]+\.md)/g)].map((m) => m[1]);
  const dangling = [...new Set(linked)].filter((f) => !CHAPTERS.includes(f));
  check(`SKILL.md 참조 경로 유효 (${new Set(linked).size}개)`, linked.length > 0 && dangling.length === 0);
  if (dangling.length) console.log(`   존재하지 않는 파일: ${dangling.join(', ')}`);

  const unlinked = CHAPTERS.filter((f) => f !== '00-intro.md' && !linked.includes(f));
  check(`모든 장이 SKILL.md에서 도달 가능`, unlinked.length === 0);
  if (unlinked.length) console.log(`   스킬이 안내하지 않는 장: ${unlinked.join(', ')}`);

  console.log(failed === 0 ? '\n✅ 모든 MCP 스모크 테스트 통과' : `\n❌ ${failed}개 실패`);
  process.exitCode = failed === 0 ? 0 : 1;
} catch (e) {
  console.error('❌ 테스트 실패:', e.message);
  process.exitCode = 1;
} finally {
  server.kill();
}
