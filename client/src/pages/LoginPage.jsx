import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { useAuth } from '../contexts/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login, signup, isFirebaseConfigured } = useAuth()
  const [role, setRole] = useState('participant')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nextPath = role === 'guardian' ? '/guardian' : '/participant'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isFirebaseConfigured) {
      navigate(nextPath)
      return
    }

    try {
      setSubmitting(true)

      if (mode === 'signup') {
        await signup(email, password)
      } else {
        await login(email, password)
      }

      navigate(nextPath)
    } catch (caughtError) {
      setError(caughtError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">Login Step</p>
        <h1>로그인</h1>
        <p className="description">
          Firebase 이메일 로그인 기준으로 먼저 연결했어. 지금은 역할 선택과
          로그인/회원가입 흐름을 같이 잡아두는 단계야.
        </p>

        {!isFirebaseConfigured ? (
          <div className="setup-warning">
            <strong>Firebase 설정이 아직 비어 있어요.</strong>
            <span>
              `client/.env` 파일에 Firebase Web 앱 설정값을 넣으면 실제 로그인으로
              바뀌어요. 지금은 데모 이동만 가능하게 열어두었어.
            </span>
          </div>
        ) : null}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="role-toggle" aria-label="로그인 모드 선택">
            <button
              type="button"
              className={mode === 'login' ? 'role-chip active' : 'role-chip'}
              onClick={() => setMode('login')}
            >
              로그인
            </button>
            <button
              type="button"
              className={mode === 'signup' ? 'role-chip active' : 'role-chip'}
              onClick={() => setMode('signup')}
            >
              회원가입
            </button>
          </div>

          <div className="role-toggle" aria-label="로그인 역할 선택">
            <button
              type="button"
              className={role === 'participant' ? 'role-chip active' : 'role-chip'}
              onClick={() => setRole('participant')}
            >
              당사자 로그인
            </button>
            <button
              type="button"
              className={role === 'guardian' ? 'role-chip active' : 'role-chip'}
              onClick={() => setRole('guardian')}
            >
              보호자 로그인
            </button>
          </div>

          <label className="form-field">
            <span>이메일</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label className="form-field">
            <span>비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호를 입력해 주세요"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="button-row login-actions">
            <button type="submit" className="primary-button">
              {submitting
                ? '처리 중...'
                : mode === 'signup'
                  ? '회원가입하고 계속하기'
                  : '로그인하고 계속하기'}
            </button>
            <Link to="/" className="secondary-button link-button">
              처음으로
            </Link>
          </div>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
