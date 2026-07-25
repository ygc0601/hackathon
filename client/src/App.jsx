import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage.jsx'
import ParticipantPage from './pages/ParticipantPage.jsx'
import GuardianPage from './pages/GuardianPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/participant" element={<ParticipantPage />} />
      <Route path="/guardian" element={<GuardianPage />} />
    </Routes>
  )
}

export default App
