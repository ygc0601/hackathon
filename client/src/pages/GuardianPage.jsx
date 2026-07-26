import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import GuardianView from '../components/GuardianView.jsx'
import '../App.css'
import { useAuth } from '../contexts/AuthContext.jsx'

function GuardianPage() {
  const { user, logout, profile, activeRole, setActiveRole } = useAuth()

  useEffect(() => {
    if (activeRole !== 'guardian') {
      setActiveRole('guardian')
    }
  }, [activeRole, setActiveRole])

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Guardian Page</p>
        <h1>보호자 화면</h1>
        <p className="description">
          이 페이지는 나중에 당사자 난이도 설정, 음성 속도 조절, 픽토그램 사용
          여부를 관리하는 화면이 될 거야.
        </p>

        {user ? (
          <div className="session-group">
            <p className="session-text">로그인 계정: {user.email}</p>
            <p className="session-text">보유 역할: {profile?.roles?.join(', ')}</p>
          </div>
        ) : null}

        <div className="button-row">
          <Link to="/" className="secondary-button link-button">
            처음으로
          </Link>
          <Link to="/participant" className="primary-button link-button">
            당사자 화면 보기
          </Link>
          {profile?.roles?.length > 1 ? (
            <Link to="/role-select" className="secondary-button link-button">
              역할 다시 선택
            </Link>
          ) : null}
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
