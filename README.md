# 🎮 Agentic GameDev Playbook

**AI가 만들고, AI가 검증하는 게임 개발 방법론** — 문서 + Claude Code 스킬 + MCP 서버.

> *An agentic AI methodology for building games: the AI designs, implements, balance-tests
> (by playing hundreds of simulated runs itself), verifies and ships. Primary docs in English
> ([PLAYBOOK.md](PLAYBOOK.md)); secondary docs in Korean ([PLAYBOOK.ko.md](PLAYBOOK.ko.md)).
> Zero external assets — all graphics/audio are code.*

한 줄 요약: **복잡성을 에셋이 아니라 코드에 두면, AI가 기획→구현→밸런싱→검증→배포 전 과정을 자율적으로 돌릴 수 있다.**

서로 다른 장르·프레임워크의 게임 4개([dungeon100](https://github.com/Hakhyun-Kim/dungeon100) 3D 로그라이크,
[defenehero](https://github.com/Hakhyun-Kim/defenehero) 3D 타워 디펜스, [door-runner](https://github.com/Hakhyun-Kim/door-runner) 2D 러너,
[giwa-village](https://github.com/Hakhyun-Kim/giwa-village) 3D 멀티플레이 소셜)에서
동일하게 반복 검증된 방식을 일반화했습니다.

네 번째는 **모양이 다른 프로젝트**입니다 — 싱글플레이 런이 없어 "사망 분포"를 뽑을 수 없고,
규칙 일부가 다른 언어·런타임에서 돕니다. 방법론을 버리는 대신 *그 자리를 무엇이 대신하는지*
찾은 결과가 [2.5](PLAYBOOK.md) 소스 대조 검사 · [3.7](PLAYBOOK.md) 결정점 기대값 검사 ·
[3.8](PLAYBOOK.md) 시계 주입입니다.

그리고 그 검증은 **출시 후에도 멈추지 않습니다** — 같은 봇을 스케줄에 걸어, 밤마다 밸런스 회귀를 잡고
매일 아침 새 트렌드를 조사해 다음 할 일을 제안하게 만드는 방법이 [11장](PLAYBOOK.md#11-상시-자동화--사람이-자는-동안-도는-루프)에 있습니다.

## 핵심 내용 ([PLAYBOOK.md](PLAYBOOK.md) / [한국어 PLAYBOOK.ko.md](PLAYBOOK.ko.md))

| 장 | 내용 |
|----|------|
| 3-Gate | 무엇을 만들지 고르는 기준: 절차성 · 재미(결정 추가) · 검증가능 |
| 아키텍처 4대 규약 | 순수 로직/렌더 분리 · 시드 결정론 · 밸런스 단일 파일 · 이벤트 방출 (+ 두 언어에 걸친 수치 대조) |
| **AI 자동 밸런싱** ★ | 가상 플레이어(초보/보통/고수) 봇 시뮬레이션 → 사망 분포 → 기준선 회귀 게이트 · 측정용/사람형 봇 분리 · CI 함정 셋 · **표본 없이 결정점 검사** · **시계 주입** |
| 그래픽 인디 탈출 | 에셋 0개: 블롭 그림자 · 파티클 풀 · 카메라 셰이크 · 블룸 · 절차 캐릭터 |
| 사운드 | Web Audio 합성 (tone+noise 2도구) + 절차 생성 BGM(스텝 시퀀서) |
| 진행 설계 | "숫자가 아니라 **행동**을 바꾸는 잭팟" · 메타 진행 · 킬 콤보 |
| 자동 검증 하네스 | 디버그 훅 · ?rafshim · 고정 타임스텝 · 픽셀 회수 · **연출 전용 훅** — AI가 자기 게임을 플레이 |
| 첫 5분 설계 | 심사자는 몇 분만 본다: 바로 시작 · 1회성 코치 칩 · 목표 노출 · 자동 시연 |
| **상시 자동화** ★ | 배포 게이트 스모크 · 야간 밸런스 회귀(이탈 시 이슈) · **일일 봇 실주행을 게임 콘텐츠로** · 아침 트렌드 스카우트 · 문서 자동 생성 |
| 부트스트랩 체크리스트 | 새 게임 시작 시 복사해 쓰는 20항목 |

> 이 문서는 **스스로 갱신됩니다.** 주간 회고 에이전트가 게임 저장소들의 변화를 읽어 근거가 분명한
> 교훈은 해당 장(`references/en/`, `references/ko/`)에 직접 커밋하고, 사람의 판단이 필요한 것만
> [REVIEW_QUEUE.md](REVIEW_QUEUE.md)에 남깁니다.

## 저장소 구조 — 원천은 장별 파일

```
skills/agentic-gamedev/
  SKILL.md          ← 실행용 요약 + 라우팅 ("밸런스 작업이면 03을 열어라")
  references/
    en/             ← ★ 단일 진실 원천 (영문 메인 15개 장)
    ko/             ← ★ 단일 진실 원천 (한국어 서브 15개 장 — AI 말투 교정 적용)
PLAYBOOK.md         ← references/en/ 합본 (영문 메인 생성물)
PLAYBOOK.ko.md      ← references/ko/ 합본 (한국어 서브 생성물)
mcp/server.mjs      ← references/en/ 및 references/ko/를 합쳐 도구/리소스로 서빙
.claude/writing-style.md ← D:\metah-blog 스타일 지침 기반 글쓰기 가이드
```

문서를 고칠 때는 **`references/en/` 또는 `references/ko/` 의 해당 장만** 고치고 `npm run build` 로 합본을 재생성합니다.
셋이 어긋나면 `npm test` 가 실패합니다 — 플레이북 2.5(합칠 수 없으면 어긋날 때 깨지게 묶어라)를
이 저장소 자신에게 적용한 것입니다.


덕분에 **스킬은 MCP 서버 없이도 완결**됩니다. 필요한 장만 `Read` 로 펼치므로 컨텍스트도 아낍니다.

## 사용법 — 네 가지 중 편한 것

### ① 그냥 문서로 읽기

[PLAYBOOK.md](PLAYBOOK.md) 를 읽거나, 새 게임 프로젝트의 컨텍스트(CLAUDE.md 등)에 붙여넣으세요.

### ② Claude Code 플러그인 (스킬 + MCP 한번에)

```
/plugin marketplace add Hakhyun-Kim/agentic-gamedev-playbook
/plugin install agentic-gamedev@agentic-gamedev-playbook
```

설치되면:
- **스킬** `agentic-gamedev` — "게임 만들어줘", "밸런스 맞춰줘", "퀄리티업" 같은 요청에서 자동 발동해 방법론대로 작업합니다.
- **MCP 서버** `gamedev-playbook` — 아래 도구/프롬프트가 함께 등록됩니다.

### ③ 스킬만 단독으로 (Claude.ai / Claude Desktop / 다른 에이전트 도구)

MCP 서버를 띄울 수 없는 환경이면 `skills/agentic-gamedev/` 폴더만 있으면 됩니다 —
`SKILL.md` 와 `references/` 가 함께 있으면 그 자체로 완결된 스킬입니다.

```bash
git clone https://github.com/Hakhyun-Kim/agentic-gamedev-playbook
cd agentic-gamedev-playbook/skills && zip -r agentic-gamedev.zip agentic-gamedev
```

Claude Code라면 이 폴더를 `~/.claude/skills/` 또는 프로젝트의 `.claude/skills/` 에 복사해도 됩니다.

### ④ MCP 서버 단독 연결 (Claude Code / 다른 MCP 클라이언트)

의존성 0개, Node 18+만 있으면 됩니다.

```bash
# Claude Code
claude mcp add gamedev-playbook -- npx -y github:Hakhyun-Kim/agentic-gamedev-playbook

# 또는 클론해서
git clone https://github.com/Hakhyun-Kim/agentic-gamedev-playbook
claude mcp add gamedev-playbook -- node agentic-gamedev-playbook/mcp/server.mjs
```

다른 MCP 클라이언트라면 설정에:

```json
{
  "mcpServers": {
    "gamedev-playbook": {
      "command": "npx",
      "args": ["-y", "github:Hakhyun-Kim/agentic-gamedev-playbook"]
    }
  }
}
```

**제공 도구(tools)**
| 도구 | 설명 |
|------|------|
| `playbook_toc` | 목차 |
| `playbook_section {query}` | 주제로 섹션 전문 검색 ("밸런싱", "사운드", "juice"…) |
| `playbook_checklist` | 새 게임 부트스트랩 체크리스트 |
| `playbook_full` | 전문 |

**제공 프롬프트(prompts)** — 클라이언트에서 슬래시로 바로 실행
| 프롬프트 | 설명 |
|----------|------|
| `new-game {concept}` | 컨셉 한 줄로 새 게임을 방법론대로 시작 |
| `balance-tuning` | 기존 게임에 밸런스 봇 + 회귀 게이트 구축 |
| `quality-pass` | 에셋 0개 그래픽/사운드/게임필 퀄리티업 |

각 플레이북 섹션은 **리소스**(`playbook://section/N`)로도 노출됩니다.

## 개발

```bash
npm run build         # references/*.md → PLAYBOOK.md 재생성
npm test              # MCP 스모크 + 버전 3중 대조 + 원천/합본/스킬 일치 (17항목)
node mcp/server.mjs   # 서버 직접 실행 (stdio)
```

서버는 `references/*.md`를 런타임에 합쳐 파싱합니다 — **장 파일을 고치면 도구 응답도 바뀝니다.**
합본(`PLAYBOOK.md`)만 고치면 `npm test`가 실패하니, 항상 장 파일을 고치고 빌드하세요.

### 자동화

**CI** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) — 푸시·PR마다 원천·합본·스킬·MCP
정합성 게이트. 키가 필요 없습니다.

**주간 회고** — 게임 저장소들의 지난 주 변화를 읽어 플레이북에 승격합니다. GitHub Actions가 아니라
**로컬에서 `claude -p` 로** 돕니다. API 키 없이 그 기기의 Claude Code 로그인을 그대로 씁니다.

```bash
npm run retro           # 회고 → 커밋 → npm test (푸시 안 함)
npm run retro -- --push # 검사를 통과하면 푸시까지
```

> **일반 터미널에서 실행하세요.** Claude Code 앱 안에서 돌리면 자식 프로세스가 앱의 인증을
> 물려받지 못해 `Not logged in` 이 납니다. 모델을 고정하려면 `CLAUDE_RETRO_MODEL=claude-opus-5`.

작업 지시서는 [`RETRO.md`](RETRO.md)에 있습니다 — **프롬프트를 저장소 안에** 둔 이유는, 방법론
문서를 고치는 주체의 규율이 스케줄러 설정 안에 숨어 있으면 리뷰도 diff도 안 되기 때문입니다.

세 가지가 강제됩니다(플레이북 11.3):
- **멱등** — 이번 주 회고 커밋(`Retro-Run: <주차>` 트레일러)이 이미 있으면 즉시 종료
- **게이트 먼저** — 회고는 커밋만 합니다. `git push`는
  [`.claude/retro-settings.json`](.claude/retro-settings.json)에서 **거부**되고,
  `npm test`를 통과한 커밋만 실행기가 밉니다
- **침묵** — 교훈이 없으면 아무것도 커밋하지 않습니다. 빈 주는 정상입니다

## 라이선스

MIT — 자유롭게 복사해 다음 게임을 만드세요.
