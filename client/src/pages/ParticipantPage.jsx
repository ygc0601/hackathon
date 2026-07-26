import { Link } from 'react-router-dom'
import ParticipantView from '../components/ParticipantView.jsx'
import '../App.css'
import { useAuth } from '../contexts/AuthContext.jsx'

function ParticipantPage() {
  const { user, logout } = useAuth()

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Participant Page</p>
        <h1>당사자 화면</h1>
        <p className="description">
          이 페이지는 나중에 문서 업로드, OCR 결과, 쉬운말 번역 결과가 들어갈
          자리야.
        </p>

        {user ? <p className="session-text">로그인 계정: {user.email}</p> : null}

        <div className="button-row">
          <Link to="/" className="secondary-button link-button">
            처음으로
          </Link>
          <Link to="/guardian" className="primary-button link-button">
            보호자 화면 보기
          </Link>
          <button type="button" className="secondary-button" onClick={logout}>
            로그아웃
          </button>
        </div>

        <ParticipantView />
      </section>
    </main>
  )
}

export default ParticipantPage
