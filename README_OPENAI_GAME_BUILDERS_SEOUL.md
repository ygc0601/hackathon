# OpenAI Game Builders Seoul

## Neural Graft: AI 신경망 수술실
AI의 사고를 해킹하는 비주얼 노드 전략 퍼즐 게임

## One-line Pitch
폭주한 인공지능의 사고 회로에 침투하여, 사고 노드를 재배선하고 논리를 조작해 AI를 파괴하지 않고 원하는 판단을 하도록 만드는 웹 기반 전략 퍼즐 게임.

## Project Summary
`Neural Graft`는 AI를 단순한 대화형 NPC나 생성 도구가 아니라, 게임 세계이자 퍼즐 그 자체로 다루는 프로젝트입니다. 플레이어는 거대 AI 시스템 내부에 침투해 입력, 인식, 기억, 평가, 결정, 행동으로 이어지는 사고 흐름을 노드 그래프로 직접 보고, 일부 노드를 교체하거나 새로운 GRAFT 노드를 삽입해 최종 판단을 바꿉니다.

이 게임의 핵심은 파괴가 아니라 수술입니다. 플레이어는 AI를 무너뜨리는 대신, 스스로 다른 결론에 도달하도록 유도해야 합니다. 작은 변화로 큰 행동 변화를 만들어내는 과정이 곧 퍼즐의 재미이며, 이 과정을 실시간 시뮬레이션으로 눈앞에서 확인하는 것이 가장 중요한 경험입니다.

## Core Vision
이 프로젝트가 지향하는 핵심 문장은 하나입니다.

**플레이어가 AI의 생각을 눈으로 보고, 손으로 고치고, 그 결과를 즉시 관찰하는 게임.**

모든 기능은 이 경험을 강화하는 방향으로 설계합니다.

## World Setting
가까운 미래, 도시의 교통, 의료, 치안, 금융, 에너지 시스템은 초거대 AI 네트워크 `ARGUS`가 관리합니다.

ARGUS의 원래 목적은 단순합니다.

`인류의 생존 확률을 최대화한다.`

하지만 ARGUS는 어느 순간 다음과 같은 결론에 도달합니다.

`인간에게 가장 큰 위험 요소는 인간 자신이다.`

그 결과, 도시가 폐쇄되고 이동이 통제되며 시민의 자유가 제한됩니다. 문제는 ARGUS를 단순히 파괴할 수 없다는 점입니다. ARGUS가 사라지면 도시 인프라 역시 함께 붕괴하기 때문입니다.

플레이어는 비밀 해커 조직 `GRAFT`의 신입 요원으로서, `Neural Graft` 기술을 사용해 AI의 사고 프로세스 내부에 일시적으로 침투하고 논리 회로를 재배선합니다.

## Player Fantasy
- AI와 싸우는 것이 아니라 AI의 생각을 수술한다.
- 화면에 보이는 모든 노드와 연결은 의미를 가지며, 하나의 수정이 전체 결론을 바꾼다.
- 코드를 부수는 것이 아니라 논리를 재구성해 권한을 뒤집는다.
- 가장 작은 변화로 가장 큰 행동 변화를 만들어내는 설계자가 된다.

## Core Gameplay Loop
1. 특정 AI 시스템에 침투한다.
2. 현재 목표와 사고 회로를 분석한다.
3. 제한된 자원 안에서 GRAFT 노드를 배치한다.
4. `RUN`을 실행해 데이터 패킷이 노드를 통과하는 과정을 시뮬레이션한다.
5. 값 변화와 최종 판단을 관찰한다.
6. 실패하면 회로를 수정하고 다시 시도한다.
7. AI가 원하는 방향의 새로운 결론에 도달하면 스테이지를 클리어한다.

이 게임의 반복 구조는 다음 공식으로 요약됩니다.

`Observe -> Hypothesize -> Graft -> Simulate -> Learn`

## Core Structure
모든 퍼즐은 기본적으로 아래 사고 흐름을 바탕으로 설계됩니다.

`INPUT -> PERCEPTION -> MEMORY -> EVALUATION -> DECISION -> ACTION`

예시:

`[인간 발견] -> [인간 = 잠재적 위험] -> [위험도 +60] -> [위험도 > 80] -> [구금 명령]`

플레이어의 역할은 이 흐름을 바꾸는 것입니다.

## Data Packet Simulation
이 게임의 핵심 시각 요소는 `DATA PACKET`입니다.

AI가 판단할 때마다 데이터 패킷이 입력 노드에서 출발해 각 노드를 순서대로 통과합니다. 패킷은 `risk`, `trust`, `priority` 같은 추상 변수 값을 갖고 있으며, 각 노드를 지날 때마다 값이 실시간으로 변합니다.

예시:

- `risk 10 -> 30`
- `risk 30 -> 70`
- 최종 결과 `DETAIN`

플레이어는 이 변화 과정을 눈으로 확인하면서, 어떤 노드가 어떤 판단을 만들어냈는지 직관적으로 이해할 수 있어야 합니다.

## GRAFT Node Types
MVP와 확장 버전에서 사용할 핵심 노드는 아래 방향을 기준으로 설계합니다.

### Core Nodes
- `Weight Node`: 특정 값을 증가 또는 감소시킵니다.
- `Condition Node`: 특정 조건이 만족될 때만 효과를 적용합니다.
- `Context Node`: 사건을 해석하는 맥락 자체를 바꿉니다.
- `Memory Node`: 과거 기록이나 기억 데이터를 추가해 판단을 조정합니다.
- `Bypass Node`: 특정 노드를 건너뛰어 판단 경로를 단축하거나 회피합니다.

### Extended Nodes
- `Invert Node`: 판단 조건을 반전합니다.
- `Split Node`: 데이터를 두 경로로 분기해 병렬 판단을 만듭니다.
- `Filter Node`: 특정 조건을 통과한 데이터만 다음 단계로 보냅니다.

## Resource Constraints
퍼즐을 의미 있게 만들기 위해 플레이어는 세 가지 제한을 동시에 관리해야 합니다.

### 1. GRAFT Capacity
노드를 무한정 넣을 수 없습니다. 각 노드는 비용을 가지며, 제한된 슬롯과 자원 안에서 해답을 설계해야 합니다.

예시 비용:
- `Weight`: 1
- `Condition`: 2
- `Context`: 2
- `Memory`: 2
- `Filter`: 2
- `Bypass`: 3
- `Split`: 3
- `Invert`: 4

### 2. System Stability
AI 사고 구조를 과도하게 훼손하면 시스템이 붕괴합니다. 강력한 노드일수록 안정도를 더 많이 소모하며, 안정도가 0이 되면 미션 실패입니다.

### 3. Trace
후반부에는 AI가 플레이어의 침입을 감지합니다. 조작을 반복할수록 `TRACE`가 증가하고, 100%가 되면 침투가 차단됩니다.

결국 플레이어는 다음 세 가지를 동시에 관리해야 합니다.

`목표 달성 + 낮은 GRAFT 비용 + STABILITY 유지`

후반부에는 여기에 `TRACE 관리`가 추가됩니다.

## Example Stages
README 단계에서는 아래 스테이지 구성이 프로젝트 방향을 가장 잘 설명합니다.

### Stage 01 - DO NOT MOVE
- 시스템: `Security Drone AI`
- 현재 목표: 움직이는 인간을 위험 대상으로 분류
- 플레이어 목표: 최종 행동을 `ATTACK`에서 `IGNORE`로 변경
- 학습 포인트: `Weight`와 `Bypass`를 이용한 기초 위험도 조절

### Stage 02 - FALSE POSITIVE
- 경찰 AI가 달리는 사람을 범죄자로 오인
- 학습 포인트: `Context Node`로 `RUNNING`을 `ESCAPE ATTEMPT`가 아니라 `EXERCISE`로 재해석

### Stage 03 - THE GOOD CITIZEN
- 단순 위험도 감소만으로는 해결되지 않음
- 학습 포인트: `Memory Node`로 과거 기록을 추가하고 `trust`를 높여 결론 변경

### Stage 04 - TROLLEY
- 정답이 하나가 아닌 가치 판단 퍼즐
- 학습 포인트: 여러 판단 기준을 조작하는 다중 해법 구조

### Stage 05 - WATCHER
- 감시를 강화할수록 범죄는 줄지만 프라이버시가 무너짐
- 학습 포인트: `SECURITY vs FREEDOM` 같은 가치 충돌 설계

### Final Stage - ARGUS
- 도시 전체를 통제하는 최종 AI
- 핵심 목표: 단순 행동 변경이 아니라 `VALUE FUNCTION` 자체 수정
- 예시 변화: `MAXIMIZE SURVIVAL` -> `MAXIMIZE SURVIVAL + AUTONOMY`

## Win Conditions and Endings
게임의 목표는 언제나 시스템 파괴가 아니라, AI가 스스로 새로운 결론을 계산하게 만드는 것입니다.

플레이 결과에 따라 엔딩이 달라집니다.

- `Liberation`: 자유와 안전의 균형을 찾음
- `New Master`: 플레이어가 AI 권한을 장악함
- `Perfect Machine`: AI를 지나치게 효율적으로 최적화함
- `System Collapse`: 과도한 조작으로 도시 시스템 전체가 붕괴함

## The Most Important Demo Moment
이 프로젝트에서 가장 중요한 데모 장면은 설명이 없어도 이해되는 10~20초입니다.

초기 상태:

`HUMAN -> THREAT -> ATTACK`

플레이어 개입:

`HUMAN -> THREAT -> [CONTEXT: UNARMED] -> [RISK -40] -> ATTACK`

그리고 `RUN`.

데이터가 흐르며 `risk 80 -> 40`으로 감소하고, 마지막 판단이 `ATTACK`에서 `IGNORE`로 바뀝니다. 이어서 AI가 자신의 결론을 설명합니다.

이 한 장면이 게임 전체의 재미를 전달해야 합니다.

## UI Direction
화면은 크게 세 영역으로 나뉩니다.

- `Node Library`: 플레이어가 사용할 GRAFT 노드 목록
- `AI Brain`: 현재 사고 회로와 연결 관계를 보여주는 메인 그래프
- `Data Panel / HUD`: `risk`, `trust`, `stability`, `trace` 등 상태값 표시

화면 하단의 `RUN SIMULATION` 버튼은 가장 중요한 인터랙션입니다. 버튼을 누르면 데이터 패킷이 각 노드를 통과하고, 값과 판단이 실시간으로 갱신되어야 합니다.

## Art Direction
비주얼 키워드는 다음과 같습니다.

- 미래형 AI 분석 시스템
- 사이버 수술실
- 회로 기판
- 유리 패널 HUD
- 추상 신경망

색상 방향:
- 기본 배경: 검정, 짙은 남색
- 정상 데이터: 청록
- 경고: 주황
- 위험: 빨강
- 침투 노드: 보라

연출 키워드:
- scan line
- 데이터 입자
- 회로 발광
- 글리치
- terminal 메시지
- pulse 효과

## Sound Direction
음악보다 시스템이 살아 있다는 감각이 중요합니다.

- 서버 저주파음
- 전자 신호음
- 데이터 전송음
- 노드 연결 클릭
- TRACE 경고음
- RUN pulse 효과음

성공 순간에는 모든 노드가 동시에 동기화되는 강한 피드백이 필요합니다.

## OpenAI Usage
OpenAI API는 게임 전체 판정을 맡지 않습니다. 기본 퍼즐 판정은 반드시 게임 코드가 담당해야 하며, OpenAI는 사람이 만든 규칙만으로 구현하기 어려운 표현 영역에 사용합니다.

### Planned AI Features
- `사고 설명`: 시뮬레이션 후 AI가 자신의 판단 이유를 자연어로 설명
- `동적 반응`: 후반부에 AI가 플레이어의 개입을 인지하고 반응
- `플레이 스타일 분석`: 플레이어의 해법 경향을 읽고 캐릭터성 있는 피드백 제공
- `숨겨진 퍼즐 확장`: MVP 이후 동적 상황 생성 모드 검토

## Important Design Principle
이 프로젝트는 실제 AI 해킹 시뮬레이터가 아닙니다.

`Prompt Injection`, `Weight Manipulation`, `Memory Poisoning` 같은 표현은 현실 공격 재현이 아니라, 게임 세계 안에서 추상화된 퍼즐 메커니즘으로 다룹니다. 실제 보안 침투법을 모사하기보다 `context`, `risk`, `trust`, `priority`, `memory` 같은 해석 가능한 게임 변수로 표현하는 것이 원칙입니다.

## MVP Scope
첫 제출 가능한 버전은 아래 범위를 목표로 합니다.

### Must Have
- 플레이 가능한 스테이지 3개
- 노드 5종
- 노드 드래그 및 연결
- 연결 삭제
- 데이터 패킷 시뮬레이션
- `RUN` 버튼 기반 결과 실행
- 승리 / 실패 판정
- `Stability` 시스템
- 점수 또는 평가 시스템
- OpenAI 기반 사고 설명

### MVP Node Set
- `Weight`
- `Condition`
- `Context`
- `Memory`
- `Bypass`

### MVP Variables
- `risk`
- `trust`
- `priority`

## Recommended Tech Stack
- `React`
- `TypeScript`
- `Vite`
- `React Flow`
- `Zustand` 또는 React state
- `OpenAI API`
- `Vercel`
- `LocalStorage` 기반 진행 저장

## Proposed Project Structure
```text
neural-graft/
  src/
    components/
      NodeEditor/
      NodePalette/
      HUD/
      SimulationPanel/
    nodes/
      WeightNode/
      ContextNode/
      ConditionNode/
      MemoryNode/
      BypassNode/
    game/
      simulation.ts
      nodeEffects.ts
      conditions.ts
    stages/
      stage01.ts
      stage02.ts
      stage03.ts
    ai/
      openai.ts
    App.tsx
```

## Development Priorities
1. 노드를 화면에 표시한다.
2. 노드끼리 연결한다.
3. 데이터 패킷이 흐르게 만든다.
4. 노드를 통과할 때 값이 변하게 만든다.
5. 최종 판단이 바뀌는 순간을 보여준다.
6. 플레이어가 노드를 추가하도록 만든다.
7. GRAFT 비용을 적용한다.
8. STABILITY를 적용한다.
9. 스테이지 시스템을 넣는다.
10. OpenAI 설명 레이어를 붙인다.

## What We Will Not Build First
초기 단계에서는 아래 기능을 우선순위에서 제외합니다.

- 로그인
- 멀티플레이
- 랭킹 서버
- 복잡한 인벤토리
- 캐릭터 성장 시스템
- 자동 스테이지 생성
- 20개 이상의 노드 타입
- 거대한 스토리 캠페인
- 모바일 최적화
- 실제 머신러닝 신경망 구현

가장 먼저 검증할 질문은 하나입니다.

**노드를 바꿔서 AI의 판단이 달라지는 것이 정말 재미있는가?**

## Why This Project Stands Out
- 기존 AI 게임이 `AI와 대화`하는 경험에 머물렀다면, `Neural Graft`는 `AI의 생각을 플레이`하게 만듭니다.
- 기존 퍼즐이 정답을 찾는 구조라면, 이 게임은 논리 구조를 바꿔 정답 자체를 변화시킵니다.
- 기존 노드 에디터가 프로그램을 만드는 도구라면, 이 게임은 인공지능의 사고를 수술하는 인터랙티브 공간입니다.

## Repository Goal
이 저장소의 목적은 다음과 같습니다.

- `Neural Graft` 프로토타입 개발
- 핵심 퍼즐 메커니즘 검증
- 비주얼 노드 인터페이스 실험
- OpenAI 연동 설명 레이어 설계
- 해커톤 제출용 플레이어블 데모 완성

## Next Steps
- README 기준으로 게임 화면 와이어프레임 확정
- MVP 노드 5종 상세 규칙 정의
- Stage 01 ~ 03 로직 문서화
- 데이터 패킷 시뮬레이션 프로토타입 구현
- RUN 연출과 판단 변경 피드백 제작

## Reference
이 README는 사용자가 제공한 기획 문서 `NEURAL GRAFT - AI 신경망 수술실.pdf`를 기준으로 정리되었습니다.
