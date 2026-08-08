import { Link, Navigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark.jsx'
import '../App.css'
import useAuth from '../hooks/useAuth.js'

function LandingPage() {
  const { accountType, user, loading, isFirebaseConfigured } = useAuth()

  if (isFirebaseConfigured && loading) {
    return (
      <main className="app">
        <section className="hero-card">
          <p className="eyebrow">Loading</p>
          <h1>로그인 상태를 확인하고 있어요</h1>
        </section>
      </main>
    )
  }

  if (user) {
    if (accountType === 'guardian') return <Navigate to="/guardian" replace />
    if (accountType === 'participant') return <Navigate to="/participant" replace />
    return <Navigate to="/login" replace />
  }

  return (
    <main className="landing-page">
      <header className="site-header">
        <Link to="/" className="brand-link" aria-label="같이읽기 처음 화면">
          <BrandMark />
        </Link>
        <Link to="/login" className="header-login-link">
          로그인
        </Link>
      </header>

      <section className="landing-hero">
        <div className="landing-copy">
          <p className="section-tag"><span />함께 이해하는 쉬운 정보</p>
          <h1>
            어려운 글,
            <br />
            <em>같이 읽으면</em>
            <br />
            쉬워져요.
          </h1>
          <p className="landing-description">
            우편물과 안내문을 찍어 보세요.
            <br />
            쉬운 글과 그림, 음성으로 차근차근 알려드려요.
          </p>

          <div className="landing-actions">
            <Link to="/login" className="primary-button landing-primary link-button">
              같이읽기 시작하기
              <span aria-hidden="true">→</span>
            </Link>
            <p>보호자 로그인 또는 당사자 기기 연결</p>
          </div>

          <ul className="landing-principles" aria-label="같이읽기 원칙">
            <li><span>가</span>쉬운 낱말</li>
            <li><span>✓</span>중요 정보 확인</li>
            <li><span>♪</span>천천히 듣기</li>
          </ul>
        </div>

        <div className="translation-visual" aria-label="어려운 안내문이 쉬운말로 바뀌는 예시">
          <span className="visual-shape visual-shape-one" aria-hidden="true" />
          <span className="visual-shape visual-shape-two" aria-hidden="true" />

          <article className="original-paper">
            <div className="paper-topline">
              <span>납부 안내문</span>
              <i />
            </div>
            <div className="paper-seal" aria-hidden="true">안내</div>
            <p>귀하께서는 아래의 납부기한까지 해당 금액을 납부하여 주시기 바랍니다.</p>
            <span className="paper-line long" />
            <span className="paper-line" />
            <span className="paper-line short" />
            <div className="paper-date">2026. 08. 15</div>
          </article>

          <div className="translation-arrow" aria-hidden="true">
            <span>쉬운말로</span>
            <i>→</i>
          </div>

          <article className="easy-paper">
            <div className="easy-label"><span />쉬운말</div>
            <h2>8월 15일까지</h2>
            <p>돈을 내야 해요.</p>
            <div className="speech-preview">
              <button type="button" tabIndex="-1" aria-hidden="true">▶</button>
              <span><i /><i /><i /><i /><i /></span>
              <small>천천히 읽기</small>
            </div>
          </article>
        </div>
      </section>

      <section className="how-it-works" aria-label="같이읽기 사용 방법">
        <p>사용 방법</p>
        <ol>
          <li><strong>01</strong><span>문서를 찍어요</span></li>
          <li><strong>02</strong><span>쉬운말로 바꿔요</span></li>
          <li><strong>03</strong><span>그림과 음성으로 확인해요</span></li>
        </ol>
      </section>
    </main>
  )
}

export default LandingPage
