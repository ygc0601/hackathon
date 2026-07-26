import { Link } from 'react-router-dom'
import '../App.css'

function LandingPage() {
  return (
    <main className="app">
      <section className="hero-card">
        <p className="eyebrow">React Router Step</p>
        <h1>같이읽기 웹앱 시작하기</h1>
        <p className="description">
          이제 한 화면 안에서만 바꾸는 것이 아니라, 실제 웹페이지처럼 주소를
          나눠서 이동할 수 있어.
        </p>

        <div className="button-row">
          <Link to="/login" className="primary-button link-button">
            로그인 시작하기
          </Link>
          <Link to="/participant" className="secondary-button link-button">
            데모 화면 보기
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
