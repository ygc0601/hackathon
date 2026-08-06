import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import ParticipantView from '../components/ParticipantView.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function ParticipantPage() {
  const navigate = useNavigate()
  const { disconnectParticipant } = useAuth()

  const handleDisconnect = async () => {
    if (!window.confirm('이 휴대폰의 연결을 해제할까요?')) return

    await disconnectParticipant()
    navigate('/login')
  }

  return (
    <main className="participant-page">
      <header className="participant-header">
        <Link to="/participant" className="participant-brand">
          <BrandMark compact />
        </Link>
        <nav className="participant-nav" aria-label="당사자 화면 메뉴">
          <button type="button" onClick={handleDisconnect}>기기 연결 해제</button>
        </nav>
      </header>
      <ParticipantView />
    </main>
  )
}

export default ParticipantPage
