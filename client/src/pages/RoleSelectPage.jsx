import { Link, useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth.js'
import '../App.css'

function RoleSelectPage() {
  const navigate = useNavigate()
  const { setActiveMode } = useAuth()

  const handleSelect = (mode) => {
    setActiveMode(mode)
    navigate(mode === 'guardian' ? '/guardian' : '/participant')
  }

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Role Select</p>
        <h1>어떤 역할로 들어갈까요?</h1>
        <p className="description">
          같은 계정으로 두 화면을 모두 사용할 수 있어요. 지금 이 기기에서
          사용할 화면을 선택해 주세요.
        </p>

        <div className="button-row">
          <button
            type="button"
            className="primary-button"
            onClick={() => handleSelect('participant')}
          >
            당사자 화면
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => handleSelect('guardian')}
          >
            보호자 화면
          </button>
        </div>

        <div className="button-row login-actions">
          <Link to="/" className="secondary-button link-button">
            처음으로
          </Link>
        </div>
      </section>
    </main>
  )
}

export default RoleSelectPage
