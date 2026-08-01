import { Link, Navigate } from 'react-router-dom'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function LandingPage() {
  const { user, loading, isFirebaseConfigured } = useAuth()

  if (isFirebaseConfigured && loading) {
    return (
      <main className="app">
        <section className="hero-card">
          <p className="eyebrow">Loading</p>
          <h1>로그인 상태를 확인하고 있어요</h1>
        </section>
      </main>
    )
  }

  if (user) {
    return <Navigate to="/role-select" replace />
  }

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">React Router Step</p>
        <h1>같이읽기 웹앱 시작하기</h1>
        <p className="description">
          하나의 계정으로 당사자 화면과 보호자 화면을 함께 사용해요. 로그인
          후 이 기기에서 사용할 화면을 선택할 수 있어요.
        </p>

        <div className="button-row">
          <Link to="/login" className="primary-button link-button">
            로그인 시작하기
          </Link>
          <Link to="/participant" className="secondary-button link-button">
            데모 화면 보기
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
