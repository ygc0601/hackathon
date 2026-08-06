import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'

function ProtectedRoute({ children, allowedAccountType }) {
  const { accountType, user, loading, isFirebaseConfigured } = useAuth()

  if (!isFirebaseConfigured) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <main className="app">
        <section className="hero-card">
          <p className="eyebrow">Loading</p>
          <h1>로그인 상태를 확인하고 있어요</h1>
        </section>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedAccountType && accountType !== allowedAccountType) {
    if (accountType === 'guardian') {
      return <Navigate to="/guardian" replace />
    }

    if (accountType === 'participant') {
      return <Navigate to="/participant" replace />
    }

    return <Navigate to="/login" replace />
  }

  return children
}

export default ProtectedRoute
