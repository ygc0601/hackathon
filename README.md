# 같이읽기

지적·발달장애인이 어려운 안내문을 사진으로 찍으면 개인의 읽기 수준에 맞는 쉬운말과 음성으로 안내하는 웹 애플리케이션입니다.

이 프로젝트는 **신뢰할 수 있는 AI와 인간이 함께 만들어가는 안전하고 포용적인 미래사회**를 주제로 한 해커톤 출품작입니다. AI가 모든 판단을 대신하기보다 문서를 쉽게 설명하고, 중요정보 누락 가능성을 표시하며, 보호자가 접근성 설정을 관리하는 구조를 지향합니다.

## 해결하려는 문제

지적·발달장애인은 인지 능력, 문해력, 선호하는 소통 방식에 개인차가 큽니다. 우편물이나 공공 안내문에는 어려운 단어와 긴 문장이 많아 당사자가 혼자 이해하기 어렵습니다.

같이읽기는 문서 촬영부터 쉬운말 결과 확인까지의 단계를 단순화하고, 보호자가 설정한 읽기 수준과 화면 설정을 당사자 기기에 자동으로 반영합니다.

## 핵심 기능

- 보호자 이메일 계정 로그인과 로그인 상태 유지
- 보호자 계정에 당사자 기기를 연결하는 기기 연결 방식
- 쉬운말 수준, 문장 길이, 글자 크기, 음성 속도, 고대비 설정
- 이미지 선택 즉시 크기와 용량을 조정하는 전처리
- Google Cloud Vision을 이용한 한글 문서 OCR
- OpenAI API를 이용한 개인 맞춤형 쉬운말 변환
- 날짜, 시간, 금액, 전화번호, 비율 등 중요정보 누락 검사
- 브라우저 TTS와 읽는 문장 실시간 강조
- 당사자 화면 전체에 적용되는 남색 계열 고대비 모드
- OCR과 번역 진행 상태 및 이해하기 쉬운 오류 안내

## 사용 흐름

### 보호자

1. 이메일 계정으로 로그인합니다.
2. 보호자 역할을 선택합니다.
3. 당사자의 쉬운말 수준과 접근성 설정을 저장합니다.
4. 연결 코드를 이용해 당사자 기기를 보호자 계정에 연결합니다.

### 당사자

1. 기기 연결 화면에서 보호자가 알려 준 연결 코드를 입력합니다.
2. 우편물이나 안내문을 카메라로 촬영합니다.
3. 이미지 전처리, OCR, 쉬운말 변환이 자동으로 진행됩니다.
4. 큰 글자로 결과를 읽거나 TTS로 듣습니다.
5. 확인 표시가 나온 날짜와 숫자는 원문과 비교합니다.

## 기술 구성

| 영역 | 사용 기술 |
| --- | --- |
| 웹 클라이언트 | React 19, React Router, Vite 8 |
| 인증 및 데이터 | Firebase Authentication, Cloud Firestore |
| 서버 | Firebase Functions v2, Node.js 22 |
| OCR | Google Cloud Vision Document Text Detection |
| 쉬운말 변환 | OpenAI Responses API, JSON Schema 출력 |
| 음성 안내 | Web Speech API |
| 검사 | Node.js Test Runner, Oxlint, Vite Build |

## 프로젝트 구조

```text
.
├─ client/                 React 웹 애플리케이션
├─ functions/              OCR·쉬운말 변환 서버 함수
│  ├─ scripts/             로컬 비밀 키 입력과 프롬프트 평가
│  ├─ src/                 함수, 프롬프트, 중요정보 검사
│  └─ test/                서버 단위 테스트
├─ docs/                   기획서, 기능 명세, 설계, 테스트 계획
├─ firebase.json           Firebase 및 Emulator 설정
└─ firestore.rules         Firestore 보안 규칙
```

## 로컬 실행 준비

다음 항목이 필요합니다.

- Node.js 22
- npm
- Firebase 프로젝트
- 활성화된 Firebase Authentication과 Cloud Firestore
- 활성화된 Google Cloud Vision API
- OpenAI API 키

### 1. 의존성 설치

프로젝트 루트에서 각각 실행합니다.

```powershell
cd client
npm install
```

```powershell
cd functions
npm install
```

### 2. 클라이언트 환경 변수 설정

```powershell
cd client
Copy-Item .env.example .env
```

생성된 `client/.env`에 Firebase 콘솔의 웹 앱 설정값을 입력합니다.

```dotenv
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. 로컬 OpenAI 키 등록

```powershell
cd functions
npm run secret:local
```

표시되는 입력란에 OpenAI API 키를 입력합니다. 입력 내용은 화면에 보이지 않으며 `functions/.secret.local`에만 저장됩니다.

### 4. Firebase Functions Emulator 실행

첫 번째 터미널에서 실행합니다.

```powershell
cd functions
npm run serve
```

- Functions Emulator: `http://127.0.0.1:5001`
- Emulator UI: `http://127.0.0.1:4000`

Google Cloud Vision 인증 오류가 발생하면 Google Cloud CLI에서 애플리케이션 기본 인증을 설정해야 합니다.

```powershell
gcloud auth application-default login
```

### 5. React 개발 서버 실행

두 번째 터미널에서 실행합니다.

```powershell
cd client
npm run dev
```

브라우저에서 `http://localhost:5173`에 접속합니다.

## 검사 명령

```powershell
cd client
npm run lint
npm run build
```

```powershell
cd functions
npm run check
npm test
```

실제 OpenAI API를 이용한 프롬프트 평가에는 비용이 발생할 수 있습니다.

```powershell
cd functions
npm run eval:prompt
```

## 보안과 안전 원칙

- `client/.env`와 `functions/.secret.local`은 Git에 커밋하지 않습니다.
- OpenAI API 키는 브라우저 코드에 넣지 않고 서버 함수에서만 사용합니다.
- OpenAI 요청에는 저장 비활성화 옵션을 사용합니다.
- 원본 이미지는 애플리케이션 코드에서 Firestore나 Firebase Storage에 저장하지 않습니다.
- OCR과 AI 결과는 틀릴 수 있으므로 날짜, 금액, 연락처 등 중요정보를 원문과 비교합니다.
- 쉬운말 결과는 의료·법률·금융 분야의 전문적인 판단을 대신하지 않습니다.
- 비용 보호를 위해 OCR과 쉬운말 변환에 사용량 제한을 적용합니다.

## MVP 범위

현재 MVP의 중심은 **쉬운말 번역**입니다. 다음 기능은 의도적으로 제외했습니다.

- 미션 수행과 활동 리포트
- 금융 앱 잠금과 송금 승인
- 픽토그램
- 보호자 목소리 복제 TTS
- 운영 환경 배포

## 문서

- [프로젝트 계획서](docs/프로젝트_계획서.md)
- [기능 명세서](docs/기능명세서.md)
- [시스템 설계](docs/시스템설계.md)
- [테스트 계획](docs/테스트계획.md)
- [해커톤 보고서](docs/해커톤_보고서.md)
