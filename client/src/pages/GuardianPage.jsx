import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import GuardianView from '../components/GuardianView.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function GuardianPage() {
  const { user, logout, activeMode, setActiveMode } = useAuth()

  useEffect(() => {
    if (activeMode !== 'guardian') {
      setActiveMode('guardian')
    }
  }, [activeMode, setActiveMode])

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Guardian Page</p>
        <h1>읽기 환경 설정</h1>
        <p className="description">
          당사자가 문서를 더 편하게 이해할 수 있도록 표시 방법을 정해 주세요.
          저장한 설정은 같은 계정의 당사자 화면에 적용돼요.
        </p>

        {user ? (
          <div className="session-group">
            <p className="session-text">로그인 계정: {user.email}</p>
            <p className="session-text">현재 화면: 보호자</p>
          </div>
        ) : null}

        <div className="button-row">
          <Link to="/" className="secondary-button link-button">
            처음으로
          </Link>
          <Link to="/participant" className="primary-button link-button">
            당사자 화면 보기
          </Link>
          <Link to="/role-select" className="secondary-button link-button">
            화면 다시 선택
          </Link>
          <button type="button" className="secondary-button" onClick={logout}>
            로그아웃
          </button>
        </div>

        <GuardianView />
      </section>
    </main>
  )
}

export default GuardianPage
