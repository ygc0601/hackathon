import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'
import { formatPairingCode, normalizePairingCode } from '../services/pairing.js'

function LoginPage() {
  const navigate = useNavigate()
  const {
    accountType,
    connectParticipant,
    login,
    resetPassword,
    signup,
    isFirebaseConfigured,
  } = useAuth()
  const [audience, setAudience] = useState('guardian')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pairingCode, setPairingCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!isFirebaseConfigured) {
      setError('Firebase 설정이 없어 로그인할 수 없어요.')
      return
    }

    try {
      setSubmitting(true)

      if (audience === 'participant') {
        const result = await connectParticipant(pairingCode)
        navigate(result.nextPath)
      } else if (mode === 'signup') {
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

  const handleResetPassword = async () => {
    setError('')
    setNotice('')

    if (!email) {
      setError('비밀번호를 찾을 이메일을 먼저 입력해 주세요.')
      return
    }

    try {
      await resetPassword(email)
      setNotice('비밀번호를 바꾸는 이메일을 보냈어요.')
    } catch (caughtError) {
      setError(caughtError.message)
    }
  }

  const handlePairingCodeChange = (event) => {
    setPairingCode(formatPairingCode(normalizePairingCode(event.target.value).slice(0, 8)))
  }

  if (accountType === 'participant') {
    return <Navigate to="/participant" replace />
  }

  return (
    <main className="auth-page">
      <section className="auth-shell">
        <aside className="auth-intro">
          <Link to="/" className="brand-link" aria-label="같이읽기 처음 화면">
            <BrandMark light />
          </Link>
          <div className="auth-intro-copy">
            <p className="section-tag section-tag-light"><span />어려운 글을 더 가깝게</p>
            <h2>읽기 편한 방법을 함께 찾아요.</h2>
            <p>보호자가 읽기 환경을 정하면 연결된 당사자 기기에 바로 적용돼요.</p>
          </div>
          <div className="auth-mini-preview" aria-hidden="true">
            <div className="mini-document"><i /><i /><i /></div>
            <span>→</span>
            <div className="mini-easy-card"><strong>쉬운말</strong><i /><i /></div>
          </div>
          <p className="auth-safety-note"><span>✓</span>당사자 기기는 설정을 읽기만 해요</p>
        </aside>

        <section className="auth-card">
          <Link to="/" className="auth-back-link">← 처음으로</Link>
          <p className="eyebrow">기기 시작하기</p>
          <h1>{audience === 'guardian' ? '보호자 로그인' : '당사자 기기 연결'}</h1>
          <p className="description">
            {audience === 'guardian'
              ? '이메일로 로그인하고 읽기 환경을 설정해요.'
              : '보호자에게 받은 코드만 입력하면 돼요.'}
          </p>

          {!isFirebaseConfigured ? (
          <div className="setup-warning">
            <strong>Firebase 설정이 아직 비어 있어요.</strong>
            <span>
              `client/.env` 파일에 Firebase Web 앱 설정값을 넣어 주세요.
            </span>
          </div>
          ) : null}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="account-toggle" aria-label="사용할 기기 선택">
            <button
              type="button"
              className={audience === 'guardian' ? 'account-option active' : 'account-option'}
              onClick={() => {
                setAudience('guardian')
                setError('')
              }}
            >
              <span className="account-option-icon guardian-option-icon" aria-hidden="true">◆</span>
              <span><strong>보호자</strong><small>설정을 관리해요</small></span>
            </button>
            <button
              type="button"
              className={audience === 'participant' ? 'account-option active' : 'account-option'}
              onClick={() => {
                setAudience('participant')
                setError('')
              }}
            >
              <span className="account-option-icon participant-option-icon" aria-hidden="true">●</span>
              <span><strong>당사자 기기</strong><small>쉬운말을 읽어요</small></span>
            </button>
          </div>

          {audience === 'guardian' ? (
            <>
              <div className="sub-toggle" aria-label="보호자 로그인 방식 선택">
                <button
                  type="button"
                  className={mode === 'login' ? 'sub-toggle-button active' : 'sub-toggle-button'}
                  onClick={() => setMode('login')}
                >
                  로그인
                </button>
                <button
                  type="button"
                  className={mode === 'signup' ? 'sub-toggle-button active' : 'sub-toggle-button'}
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
                  autoComplete="email"
                  required
                />
              </label>

              <label className="form-field">
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="6자 이상 입력해 주세요"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  minLength="6"
                  required
                />
              </label>

              {mode === 'login' ? (
                <button type="button" className="text-button password-reset" onClick={handleResetPassword}>
                  비밀번호를 잊었어요
                </button>
              ) : null}
            </>
          ) : (
            <>
              {accountType === 'guardian' ? (
                <div className="setup-warning">
                  <strong>현재 창에는 보호자가 로그인되어 있어요.</strong>
                  <span>보호자 로그인을 유지하려면 시크릿 창에서 연결해 주세요.</span>
                </div>
              ) : null}
              <label className="form-field pairing-input-field">
                <span>연결 코드 8자리</span>
                <input
                  type="text"
                  value={pairingCode}
                  onChange={handlePairingCodeChange}
                  placeholder="ABCD-1234"
                  autoComplete="one-time-code"
                  inputMode="text"
                  maxLength="9"
                  required
                />
                <small>보호자 화면에서 새 연결 코드를 만들 수 있어요.</small>
              </label>
            </>
          )}

          {error ? <p className="form-error">{error}</p> : null}
          {notice ? <p className="form-notice" role="status">{notice}</p> : null}

          <div className="login-actions">
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting
                ? '처리 중...'
                : audience === 'participant'
                  ? '이 기기 연결하기'
                  : mode === 'signup'
                  ? '보호자 계정 만들기'
                  : '보호자 화면으로 들어가기'}
            </button>
          </div>
        </form>
        </section>
      </section>
    </main>
  )
}

export default LoginPage
