import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import ParticipantView from '../components/ParticipantView.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function ParticipantPage() {
  const { logout, activeMode, setActiveMode } = useAuth()

  useEffect(() => {
    if (activeMode !== 'participant') {
      setActiveMode('participant')
    }
  }, [activeMode, setActiveMode])

  return (
    <main className="participant-page">
      <header className="participant-header">
        <Link to="/participant" className="participant-brand">
          같이읽기
        </Link>
        <nav className="participant-nav" aria-label="당사자 화면 메뉴">
          <Link to="/role-select">화면 바꾸기</Link>
          <button type="button" onClick={logout}>로그아웃</button>
        </nav>
      </header>
      <ParticipantView />
    </main>
  )
}

export default ParticipantPage
