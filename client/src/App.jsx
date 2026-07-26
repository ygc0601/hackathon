import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import ParticipantPage from './pages/ParticipantPage.jsx'
import GuardianPage from './pages/GuardianPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/participant"
        element={
          <ProtectedRoute>
            <ParticipantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guardian"
        element={
          <ProtectedRoute>
            <GuardianPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
