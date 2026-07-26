import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { useAuth } from '../contexts/AuthContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login, signup, isFirebaseConfigured } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!isFirebaseConfigured) {
      navigate('/role-select')
      return
    }

    try {
      setSubmitting(true)

      if (mode === 'signup') {
        const result = await signup(email, password)
        navigate(result.nextPath)
      } else {
        const result = await login(email, password)
        navigate(result.nextPath)
      }
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
          하나의 계정으로 당사자 화면과 보호자 화면을 모두 사용할 수 있어요.
          로그인한 뒤 지금 사용할 화면을 선택해 주세요.
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
                  ? '계정 만들고 화면 선택하기'
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
