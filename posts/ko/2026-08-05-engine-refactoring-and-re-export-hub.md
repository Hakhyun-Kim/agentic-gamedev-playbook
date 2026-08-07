---
title: '1,477줄 모놀리식 엔진 코드를 부르는 쪽 경로 변경 없이 분할한 리팩토링 사례'
date: '2026-08-05'
category: '아키텍처'
author: '김학현'
summary: 'engine.js 단일 파일이 거대해졌을 때 소비자의 import 경로를 1줄도 안 바꾸고 재수출 허브로 안전하게 분할한 경험을 공유합니다.'
---

# 1,477줄 모놀리식 엔진 코드를 부르는 쪽 경로 변경 없이 분할한 리팩토링 사례

*용사 수학 디펜스* 프로젝트가 커지면서 `engine.js`가 1,477줄, `render3d.js`가 2,555줄까지 부풀어 올랐습니다. 단일 파일이 너무 길어지면 AI 코딩 에이전트가 코드를 읽고 고칠 때 컨텍스트 비용이 불필요하게 커지는 문제가 생깁니다.

## 재수출 허브(Barrel) 패턴 적용

수십 개 UI 및 테스트 파일의 `import` 구문을 일일이 수정하는 대신, 기존 `engine.js`를 내부 모듈들을 모아 재수출하는 허브로 전환했습니다.

```js
// engine.js — 내부 모듈을 재수출하는 배럴 파일
export * from './engine/state.js';
export * from './engine/combat.js';
export * from './engine/roster.js';
export * from './engine/economy.js';
```

소비자 측 코드는 `import { tick } from './engine.js'` 구문을 단 1줄도 수정할 필요가 없었습니다.

## 검증 결과

- 엔진 불변식 검사 14건 통과
- 수학 퀴즈 3,000문제 자동 해독 검사 통과
- 밸런스 봇 60판 시뮬레이션 결과 수치 100% 일치
