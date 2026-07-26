import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import '../App.css'

function RoleSelectPage() {
  const navigate = useNavigate()
  const { profile, setActiveRole } = useAuth()

  const roles = profile?.roles ?? []

  const handleSelect = (role) => {
    setActiveRole(role)
    navigate(role === 'guardian' ? '/guardian' : '/participant')
  }

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Role Select</p>
        <h1>어떤 역할로 들어갈까요?</h1>
        <p className="description">
          같은 이메일 계정으로 보호자와 당사자 역할을 함께 사용할 수 있게
          만들었어. 지금 사용할 역할을 선택해줘.
        </p>

        <div className="button-row">
          {roles.includes('participant') ? (
            <button
              type="button"
              className="primary-button"
              onClick={() => handleSelect('participant')}
            >
              당사자 모드
            </button>
          ) : null}

          {roles.includes('guardian') ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => handleSelect('guardian')}
            >
              보호자 모드
            </button>
          ) : null}
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
