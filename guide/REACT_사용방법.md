# React 사용방법

## 문서 목적

본 문서는 React를 처음 사용하는 개발자가 Windows 환경에서 개발 도구를 준비하고, React 프로젝트를 생성한 후 컴포넌트 작성, 상태 관리, 화면 이동, 테스트와 운영용 빌드까지 수행할 수 있도록 단계별로 설명한다. 예시는 React, TypeScript, Vite와 npm을 기준으로 작성한다.

## 제1장. React의 기본 개념

React는 웹 화면을 재사용 가능한 컴포넌트로 나누어 개발하는 JavaScript 라이브러리이다. 버튼, 입력 화면, 결과 카드와 메뉴를 각각 독립적인 컴포넌트로 작성하고 필요한 화면에서 조합할 수 있다.

React 컴포넌트는 화면에 표시할 JSX를 반환하는 함수로 작성한다. TypeScript를 사용하는 파일에서는 일반적으로 `.tsx` 확장자를 사용한다.

```tsx
function WelcomeMessage() {
  return <h1>React 예제에 오신 것을 환영합니다.</h1>;
}

export default WelcomeMessage;
```

컴포넌트 이름은 영문 대문자로 시작한다. JSX 안에서는 HTML과 유사한 문법을 사용하지만 `class` 대신 `className`을 사용하고 모든 태그를 닫아야 한다.

## 제2장. 개발 환경 준비

React 개발에는 Node.js, npm, Git과 코드 편집기가 필요하다. Node.js는 Vite와 TypeScript 등 개발 도구를 실행하며, npm은 프로젝트의 외부 패키지를 설치하고 실행 명령을 관리한다.

PowerShell에서 다음 명령을 실행하여 설치 상태를 확인한다.

```powershell
node --version
npm --version
git --version
```

각 명령에서 버전 번호가 출력되어야 한다. Node.js는 안정적인 LTS 버전을 사용한다. 팀원 전원이 동일한 Node.js 버전과 `package-lock.json`을 사용해야 개발 환경 차이를 줄일 수 있다.

## 제3장. React 프로젝트 생성

프로젝트를 생성할 상위 폴더로 이동한 후 Vite의 React TypeScript 템플릿을 실행한다.

```powershell
npm create vite@latest react-example -- --template react-ts
Set-Location react-example
npm install
```

프로젝트가 생성되면 다음 명령으로 개발 서버를 실행한다.

```powershell
npm run dev
```

PowerShell에 표시되는 `http://localhost:5173` 주소를 브라우저에서 연다. 개발 서버는 소스 파일이 변경되면 브라우저 화면을 자동으로 갱신한다. 서버를 종료할 때는 `Ctrl+C`를 입력한다.

## 제4장. 프로젝트 구조 이해

기본 프로젝트의 주요 구조는 다음과 같다.

```text
react-example/
├─ public/
├─ src/
│  ├─ assets/
│  ├─ App.css
│  ├─ App.tsx
│  ├─ index.css
│  └─ main.tsx
├─ index.html
├─ package.json
├─ package-lock.json
├─ tsconfig.json
└─ vite.config.ts
```

`index.html`은 브라우저가 처음 읽는 HTML 문서이다. `src/main.tsx`는 React 애플리케이션을 HTML의 `root` 요소에 연결한다. `src/App.tsx`는 기본 화면을 구성하는 최상위 컴포넌트이다. `public`에는 별도의 변환 없이 배포할 정적 파일을 저장한다.

## 제5장. 컴포넌트 작성

공통 버튼을 별도 컴포넌트로 작성하면 여러 화면에서 동일한 모양과 동작을 재사용할 수 있다.

```tsx
import type { ReactNode } from 'react';

interface ActionButtonProps {
  children: ReactNode;
  onClick: () => void;
}

function ActionButton({ children, onClick }: ActionButtonProps) {
  return (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export default ActionButton;
```

부모 컴포넌트가 자식 컴포넌트에 전달하는 값을 `props`라고 한다. 위 예제에서는 `children`과 `onClick`이 props에 해당한다.

```tsx
<ActionButton onClick={() => alert('버튼을 눌렀습니다.')}>
  확인
</ActionButton>
```

## 제6장. 상태 관리

화면에서 변경되는 값은 `useState`로 관리한다. 입력한 이름, 버튼을 누른 횟수, 로딩 여부와 오류 메시지 등이 상태에 해당한다.

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <section>
      <p>현재 값은 {count}입니다.</p>
      <button onClick={() => setCount((value) => value + 1)}>
        1 증가
      </button>
    </section>
  );
}

export default Counter;
```

상태값을 직접 변경하지 않고 React가 제공하는 상태 변경 함수를 사용한다. 기존 값을 기준으로 계산할 때는 이전 상태를 인자로 받는 함수 형태를 사용한다.

## 제7장. 사용자 입력 처리

입력 요소의 값을 상태와 연결하면 사용자가 입력한 내용을 React에서 관리할 수 있다.

```tsx
import { useState } from 'react';

function NameForm() {
  const [name, setName] = useState('');

  return (
    <section>
      <label htmlFor="name">이름</label>
      <input
        id="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <p>{name ? `${name}님, 안녕하세요.` : '이름을 입력해 주세요.'}</p>
    </section>
  );
}

export default NameForm;
```

`label`의 `htmlFor`와 입력 요소의 `id`를 연결하여 입력 목적을 명확하게 제공한다.

## 제8장. 화면 이동 구현

여러 화면을 주소별로 구분하려면 React Router를 설치한다.

```powershell
npm install react-router-dom
```

라우터는 다음과 같이 구성한다.

```tsx
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

function HomePage() {
  return (
    <main>
      <h1>홈</h1>
      <Link to="/examples">예제 보기</Link>
    </main>
  );
}

function ExamplesPage() {
  return (
    <main>
      <h1>React 예제</h1>
      <Link to="/">홈으로</Link>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/examples" element={<ExamplesPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

일반적인 화면 이동에는 `<a>` 대신 React Router의 `Link`를 사용한다. 이를 통해 전체 문서를 다시 내려받지 않고 화면을 전환할 수 있다.

## 제9장. 서버 데이터 요청

브라우저에서 서버 API를 호출할 때는 `fetch`와 `async/await`를 사용할 수 있다. 로딩, 성공과 오류 상태를 구분하여 사용자에게 현재 상태를 안내해야 한다.

```tsx
interface MessageResponse {
  message: string;
}

async function loadMessage(): Promise<MessageResponse> {
  const response = await fetch('/api/message');

  if (!response.ok) {
    throw new Error('데이터를 불러오지 못했습니다.');
  }

  return response.json() as Promise<MessageResponse>;
}
```

API 주소와 통신 코드는 컴포넌트 안에 반복해서 작성하지 않고 `src/services` 폴더에 분리하는 방식이 적절하다.

## 제10장. 환경변수 관리

개발 환경별 API 주소는 `.env.local`에 작성한다.

```text
VITE_API_BASE_URL=http://localhost:3000
```

React 코드에서는 다음과 같이 읽는다.

```ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
```

Vite에서 브라우저에 제공되는 변수는 `VITE_`로 시작해야 한다. 해당 값은 최종 JavaScript 파일에 포함될 수 있으므로 비밀 API 키, 관리자 키와 비밀번호를 입력하면 안 된다. `.env.local`은 `.gitignore`에 포함하고, 공개 저장소에는 값이 없는 `.env.example`만 등록한다.

## 제11장. CSS와 접근성

기본 스타일은 `src/index.css`에서 관리한다.

```css
:root {
  font-family: Arial, "Noto Sans KR", sans-serif;
  color: #172033;
  background: #f4f7fb;
  line-height: 1.6;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button,
input {
  font: inherit;
}

button {
  min-height: 48px;
  padding: 12px 20px;
}

:focus-visible {
  outline: 3px solid #005fcc;
  outline-offset: 3px;
}
```

버튼은 목적을 알 수 있는 글자를 포함해야 한다. 이미지에는 내용과 목적에 맞는 대체 텍스트를 제공하고, 장식용 이미지는 빈 `alt` 속성을 사용한다. 오류는 색상만으로 표현하지 않고 `role="alert"`와 쉬운 안내 문장을 함께 제공한다.

## 제12장. 코드 검사와 테스트

ESLint는 코드 작성 규칙과 잠재적인 오류를 검사한다.

```powershell
npm run lint
```

TypeScript 자료형은 다음 명령으로 별도 검사할 수 있다.

```powershell
npx tsc --noEmit
```

컴포넌트 테스트에는 Vitest와 React Testing Library를 사용할 수 있다.

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

테스트는 내부 구현보다 사용자가 보는 글자와 조작하는 버튼을 기준으로 작성한다.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import Counter from './Counter';

test('증가 버튼을 누르면 값이 증가한다', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  await user.click(screen.getByRole('button', { name: '1 증가' }));

  expect(screen.getByText('현재 값은 1입니다.')).toBeDefined();
});
```

## 제13장. 운영용 빌드

다음 명령은 TypeScript를 검사하고 최적화된 운영 파일을 생성한다.

```powershell
npm run build
```

정상적으로 완료되면 `dist` 폴더가 생성된다. 빌드 결과는 다음 명령으로 확인한다.

```powershell
npm run preview
```

`preview`는 빌드 결과 확인용이며 실제 운영 서버로 사용하지 않는다.

## 제14장. GitHub 작업 절차

작업 전 최신 기본 브랜치에서 별도 기능 브랜치를 생성한다.

```powershell
git switch main
git pull --ff-only origin main
git switch -c codex/react-feature
```

코드 작성 후 변경 내용과 민감정보 포함 여부를 확인한다.

```powershell
git status
git diff
npm run lint
npm run build
```

검사가 완료되면 작업 파일만 등록하고 커밋한 후 원격 브랜치로 푸시한다.

```powershell
git add src package.json package-lock.json
git commit -m "React 예제 기능 구현"
git push -u origin codex/react-feature
```

## 제15장. 전체 적용 순서

React 개발은 개발 환경 확인, 프로젝트 생성, 개발 서버 실행, 컴포넌트 작성, 상태와 입력 처리, 화면 이동 구현, CSS와 접근성 적용, 테스트, 운영 빌드, GitHub 푸시 순서로 진행한다.

```text
Node.js·npm·Git 확인
        ↓
Vite React TypeScript 프로젝트 생성
        ↓
개발 서버 실행
        ↓
컴포넌트와 상태 구현
        ↓
사용자 입력과 화면 이동 구현
        ↓
CSS와 접근성 적용
        ↓
코드 검사와 테스트
        ↓
운영용 빌드 검증
        ↓
작업 브랜치 GitHub 푸시
```

각 단계가 끝날 때마다 브라우저에서 동작을 확인하고 `npm run lint`와 `npm run build`를 실행해야 한다. 외부 API를 사용하는 기능은 먼저 모의 데이터로 화면과 사용자 흐름을 완성한 후 실제 서비스에 연결하는 방식이 적절하다.
