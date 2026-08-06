import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import '../App.css'

function RoleSelectPage() {
  const { accountType, loading } = useAuth()

  if (loading) {
    return (
      <main className="app">
        <section className="hero-card">
          <p className="eyebrow">Loading</p>
          <h1>연결 상태를 확인하고 있어요</h1>
        </section>
      </main>
    )
  }

  if (accountType === 'guardian') return <Navigate to="/guardian" replace />
  if (accountType === 'participant') return <Navigate to="/participant" replace />

  return <Navigate to="/login" replace />
}

export default RoleSelectPage
