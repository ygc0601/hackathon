import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import ParticipantView from '../components/ParticipantView.jsx'
import '../App.css'
import useAccessibility from '../hooks/useAccessibility.js'
import useAuth from '../hooks/useAuth.js'

function ParticipantPage() {
  const navigate = useNavigate()
  const { disconnectParticipant } = useAuth()
  const { settings } = useAccessibility()
  const [disconnecting, setDisconnecting] = useState(false)
  const [disconnectError, setDisconnectError] = useState('')

  const handleDisconnect = async () => {
    if (!window.confirm('이 휴대폰의 연결을 해제할까요?')) return

    setDisconnecting(true)
    setDisconnectError('')

    try {
      await disconnectParticipant()
      navigate('/login')
    } catch (error) {
      setDisconnectError(error.message)
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <main
      className={`participant-page${settings.highContrast ? ' participant-high-contrast' : ''}`}
    >
      <header className="participant-header">
        <Link to="/participant" className="participant-brand">
          <BrandMark compact />
        </Link>
        <nav className="participant-nav" aria-label="당사자 화면 메뉴">
          <button type="button" onClick={handleDisconnect} disabled={disconnecting}>
            {disconnecting ? '해제 중...' : '기기 연결 해제'}
          </button>
        </nav>
      </header>
      {disconnectError ? (
        <p className="participant-session-error" role="alert">{disconnectError}</p>
      ) : null}
      <ParticipantView />
    </main>
  )
}

export default ParticipantPage
