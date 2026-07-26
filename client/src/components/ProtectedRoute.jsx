import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading, isFirebaseConfigured, profile } = useAuth()

  if (!isFirebaseConfigured) {
    return children
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

  if (requiredRole && !profile?.roles?.includes(requiredRole)) {
    return <Navigate to="/role-select" replace />
  }

  return children
}

export default ProtectedRoute
