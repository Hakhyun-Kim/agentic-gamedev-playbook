#!/usr/bin/env node
/* =====================================================
 * Agentic GameDev Playbook — MCP 서버 (의존성 0개)
 *
 * stdio 위에서 개행 구분 JSON-RPC 2.0으로 MCP 프로토콜을 구현한다.
 * PLAYBOOK.md를 런타임에 파싱하므로 문서가 곧 단일 진실 원천이다.
 *
 * 사용:
 *   claude mcp add gamedev-playbook -- node mcp/server.mjs
 *   또는
 *   claude mcp add gamedev-playbook -- npx -y github:Hakhyun-Kim/agentic-gamedev-playbook
 * ===================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

const VERSION = '1.11.0';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- 플레이북 로드 & 섹션 파싱 ---------- */
const PLAYBOOK = readFileSync(join(ROOT, 'PLAYBOOK.md'), 'utf8');

function parseSections(md) {
  const lines = md.split(/\r?\n/);
  const sections = [];
  let cur = { title: '개요 (검증된 프로젝트)', body: [] };
  for (const line of lines) {
    const m = line.match(/^##\s+(.+)/);
    if (m) {
      sections.push(cur);
      cur = { title: m[1].trim(), body: [`## ${m[1].trim()}`] };
    } else {
      cur.body.push(line);
    }
  }
  sections.push(cur);
  return sections
    .map((s) => ({ title: s.title, text: s.body.join('\n').trim() }))
    .filter((s) => s.text.length > 0);
}
const SECTIONS = parseSections(PLAYBOOK);

function findSection(query) {
  const q = String(query || '').toLowerCase().trim();
  if (!q) return null;
  /* 1) 제목 부분 일치 → 2) 본문 포함 빈도 순 */
  const byTitle = SECTIONS.find((s) => s.title.toLowerCase().includes(q));
  if (byTitle) return byTitle;
  let best = null, bestScore = 0;
  for (const s of SECTIONS) {
    const score = s.text.toLowerCase().split(q).length - 1;
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return best;
}

const toc = () => SECTIONS.map((s, i) => `${i}. ${s.title}`).join('\n');
const sectionByKeyword = (kw) => (findSection(kw) || { text: '' }).text;

/* ---------- MCP 정의 ---------- */
const TOOLS = [
  {
    name: 'playbook_toc',
    description: '플레이북 목차(섹션 목록)를 반환한다. 어떤 섹션이 있는지 먼저 볼 때 사용.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'playbook_section',
    description:
      '주제(예: "밸런싱", "사운드", "아키텍처", "3-gate", "juice", "프롬프트 패턴", "검증 하네스")로 플레이북 섹션 전문을 가져온다.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: '찾을 주제나 키워드' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'playbook_checklist',
    description: '새 게임 부트스트랩 체크리스트를 반환한다. 새 게임 프로젝트를 시작할 때 가장 먼저 호출.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'playbook_full',
    description: '플레이북 전문(마크다운)을 반환한다. 전체 방법론을 컨텍스트에 올릴 때 사용.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

function callTool(name, args) {
  switch (name) {
    case 'playbook_toc':
      return `# Agentic GameDev Playbook — 목차\n\n${toc()}\n\n(playbook_section 도구에 주제를 넘겨 전문을 받으세요)`;
    case 'playbook_section': {
      const s = findSection(args && args.query);
      if (!s) return `"${args && args.query}" 에 해당하는 섹션을 찾지 못했습니다.\n\n목차:\n${toc()}`;
      return s.text;
    }
    case 'playbook_checklist':
      return sectionByKeyword('부트스트랩 체크리스트');
    case 'playbook_full':
      return PLAYBOOK;
    default:
      return null;
  }
}

const PROMPTS = [
  {
    name: 'new-game',
    description: '컨셉 한 줄로 새 게임 프로젝트를 플레이북 방식(순수 로직 분리→봇 밸런싱→검증→배포)으로 시작한다.',
    arguments: [{ name: 'concept', description: '게임 컨셉 (예: "고양이 낚시 로그라이크")', required: true }],
  },
  {
    name: 'balance-tuning',
    description: '기존 게임에 밸런스 봇(가상 플레이어 시뮬레이션)과 기준선 회귀 검증을 구축한다.',
    arguments: [],
  },
  {
    name: 'quality-pass',
    description: '기존 게임에 그래픽/사운드/게임필 퀄리티업 패스를 적용한다 (에셋 0개 원칙).',
    arguments: [],
  },
];

function getPrompt(name, args) {
  if (name === 'new-game') {
    const concept = (args && args.concept) || '(컨셉 미지정 — 사용자에게 물어볼 것)';
    return `다음 컨셉의 게임을 "Agentic GameDev Playbook" 방법론으로 처음부터 만들어줘: **${concept}**

절차:
1. 3-Gate(절차성/재미/검증가능)로 컨셉을 다듬는다.
2. 아래 아키텍처 4대 규약을 첫 커밋부터 지킨다.
3. 코어 루프가 돌아가면 곧바로 밸런스 봇을 만들어 난이도를 수치로 튜닝한다.
4. 그래픽/사운드는 외부 에셋 0개로 코드 생성한다.
5. 디버그 훅과 자동 검증 하네스를 심고, 브라우저에서 직접 플레이해 검증한 뒤 배포한다.

${sectionByKeyword('아키텍처 4대 규약')}

${sectionByKeyword('부트스트랩 체크리스트')}

필요한 섹션(밸런싱/그래픽/사운드/게임필/검증)은 gamedev-playbook MCP의 playbook_section 도구로 가져와 참고할 것.`;
  }
  if (name === 'balance-tuning') {
    return `이 게임에 플레이북의 "AI 자동 밸런싱"을 구축해줘.

순서: (1) 로직이 렌더링과 분리돼 있는지 확인하고 아니면 먼저 분리, (2) RNG 주입식으로 바꾸고,
(3) 실력별 가상 플레이어 프로필을 정의해 N판 시뮬레이션 → 사망 분포 리포트,
(4) 목표 분포(실력 순 단조 증가, 무한 생존 0%)로 곡선을 튜닝, (5) baseline.json + check 회귀 게이트를 만든다.

${sectionByKeyword('AI 자동 밸런싱')}`;
  }
  if (name === 'quality-pass') {
    return `이 게임에 플레이북의 "에셋 0개 퀄리티업" 패스를 적용해줘.
그래픽(블롭 그림자→파티클→셰이크→블룸 순), 사운드(tone/noise 합성 + 절차 BGM), 게임필 체크리스트 순서로.

${sectionByKeyword('인디 탈출')}

${sectionByKeyword('Web Audio')}

${sectionByKeyword('Juice')}`;
  }
  return null;
}

/* ---------- JSON-RPC (stdio, 개행 구분) ---------- */
const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n');
const reply = (id, result) => send({ jsonrpc: '2.0', id, result });
const replyErr = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } });

const rl = createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  line = line.trim();
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return; }
  const { id, method, params } = msg;
  const isNotification = id === undefined || id === null;

  try {
    switch (method) {
      case 'initialize':
        reply(id, {
          protocolVersion: (params && params.protocolVersion) || '2024-11-05',
          capabilities: { tools: {}, resources: {}, prompts: {} },
          serverInfo: { name: 'gamedev-playbook', version: VERSION },
          instructions:
            '게임을 새로 만들거나 밸런싱/퀄리티업할 때 playbook_checklist와 playbook_section을 먼저 조회하세요. ' +
            '이 서버는 "AI가 만들고 AI가 검증하는" 게임 개발 방법론(Agentic GameDev Playbook)을 제공합니다.',
        });
        break;
      case 'ping':
        reply(id, {});
        break;
      case 'tools/list':
        reply(id, { tools: TOOLS });
        break;
      case 'tools/call': {
        const text = callTool(params && params.name, (params && params.arguments) || {});
        if (text == null) replyErr(id, -32602, `unknown tool: ${params && params.name}`);
        else reply(id, { content: [{ type: 'text', text }] });
        break;
      }
      case 'resources/list':
        reply(id, {
          resources: SECTIONS.map((s, i) => ({
            uri: `playbook://section/${i}`,
            name: s.title,
            mimeType: 'text/markdown',
          })),
        });
        break;
      case 'resources/read': {
        const uri = params && params.uri;
        const m = /^playbook:\/\/section\/(\d+)$/.exec(uri || '');
        const s = m && SECTIONS[Number(m[1])];
        if (!s) replyErr(id, -32602, `unknown resource: ${uri}`);
        else reply(id, { contents: [{ uri, mimeType: 'text/markdown', text: s.text }] });
        break;
      }
      case 'prompts/list':
        reply(id, { prompts: PROMPTS });
        break;
      case 'prompts/get': {
        const text = getPrompt(params && params.name, (params && params.arguments) || {});
        if (text == null) replyErr(id, -32602, `unknown prompt: ${params && params.name}`);
        else reply(id, {
          description: (PROMPTS.find((p) => p.name === params.name) || {}).description || '',
          messages: [{ role: 'user', content: { type: 'text', text } }],
        });
        break;
      }
      default:
        if (!isNotification) replyErr(id, -32601, `method not found: ${method}`);
      /* notifications/initialized 등 알림은 조용히 무시 */
    }
  } catch (e) {
    if (!isNotification) replyErr(id, -32603, String((e && e.message) || e));
  }
});

process.stdin.on('close', () => process.exit(0));
