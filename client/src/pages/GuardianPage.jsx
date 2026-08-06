import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import DevicePairingPanel from '../components/DevicePairingPanel.jsx'
import GuardianView from '../components/GuardianView.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function GuardianPage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <main className="guardian-page">
      <header className="guardian-header">
        <div className="guardian-header-inner">
          <Link to="/guardian" className="brand-link" aria-label="같이읽기 보호자 화면">
            <BrandMark />
          </Link>
          <div className="guardian-account">
            {user ? (
              <span className="account-email">
                <i aria-hidden="true">보</i>
                <span><small>보호자</small>{user.email}</span>
              </span>
            ) : null}
            <button type="button" className="header-logout-button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <section className="guardian-shell">
        <header className="guardian-welcome">
          <div>
            <p className="section-tag"><span />보호자 화면</p>
            <h1>읽기 환경을 함께 맞춰요.</h1>
            <p>바꾼 설정은 연결된 당사자 기기에 바로 반영돼요.</p>
          </div>
          <div className="guardian-sync-card">
            <span className="sync-pulse" aria-hidden="true" />
            <div><strong>실시간 설정 동기화</strong><small>Firebase로 안전하게 연결 중</small></div>
          </div>
        </header>

        <div className="guardian-dashboard">
          <aside className="guardian-sidebar">
            <DevicePairingPanel />
          </aside>
          <div className="guardian-main">
            <GuardianView />
          </div>
        </div>
      </section>
    </main>
  )
}

export default GuardianPage
