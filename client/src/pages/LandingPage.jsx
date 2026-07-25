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
          <Link to="/participant" className="primary-button link-button">
            당사자 화면으로 이동
          </Link>
          <Link to="/guardian" className="secondary-button link-button">
            보호자 화면으로 이동
          </Link>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
