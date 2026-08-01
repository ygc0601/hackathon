import { useEffect, useRef, useState } from 'react'
import useAccessibility from '../hooks/useAccessibility.js'
import { extractDocumentText } from '../services/ocr.js'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function CameraIcon() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d="M21 15.5 25 9h14l4 6.5h8A7.5 7.5 0 0 1 58.5 23v25A7.5 7.5 0 0 1 51 55.5H13A7.5 7.5 0 0 1 5.5 48V23a7.5 7.5 0 0 1 7.5-7.5h8Z" />
      <circle cx="32" cy="35" r="12" />
      <circle cx="49" cy="25" r="2.5" className="camera-light" />
    </svg>
  )
}

function ParticipantView() {
  const inputRef = useRef(null)
  const { settings, loading, error: settingsError } = useAccessibility()
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [ocrConfidence, setOcrConfidence] = useState(null)
  const [needsReview, setNeedsReview] = useState(false)
  const [ocrProgress, setOcrProgress] = useState({
    percent: 0,
    label: 'OCR을 준비하고 있어요',
  })

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [imageUrl])

  const openCamera = () => inputRef.current?.click()

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    setMessage('')
    setOcrText('')
    setOcrConfidence(null)
    setNeedsReview(false)

    if (!file.type.startsWith('image/')) {
      setMessage('사진 파일을 선택해 주세요.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setMessage('사진이 너무 커요. 10MB보다 작은 사진을 선택해 주세요.')
      event.target.value = ''
      return
    }

    setImageFile(file)
    setImageUrl(URL.createObjectURL(file))
    setImageName(file.name)
    event.target.value = ''
  }

  const resetImage = () => {
    setImageFile(null)
    setImageUrl('')
    setImageName('')
    setMessage('')
    setOcrText('')
    setOcrConfidence(null)
    setNeedsReview(false)
    setProcessing(false)
  }

  const handleOcr = async () => {
    if (!imageFile) return

    setProcessing(true)
    setMessage('')
    setOcrProgress({ percent: 1, label: '사진을 준비하고 있어요' })

    try {
      const result = await extractDocumentText(imageFile, setOcrProgress)

      if (!result.text) {
        setMessage('사진에서 글자를 찾지 못했어요. 더 밝은 곳에서 다시 찍어 주세요.')
        return
      }

      setOcrText(result.text)
      setOcrConfidence(result.confidence)
      setNeedsReview(result.needsReview)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setProcessing(false)
    }
  }

  const textSizeClass =
    settings.fontSize === 'extraLarge' ? 'participant-text-xl' : 'participant-text-large'
  const contrastClass = settings.highContrast ? 'participant-high-contrast' : ''

  if (loading) {
    return (
      <section className="participant-stage" aria-live="polite">
        <p className="participant-loading">화면을 준비하고 있어요.</p>
      </section>
    )
  }

  return (
    <section className={`participant-stage ${textSizeClass} ${contrastClass}`}>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
      />

      {processing ? (
        <div className="ocr-loading" aria-live="polite">
          <span className="ocr-spinner" aria-hidden="true" />
          <p className="participant-kicker">사진을 보고 있어요</p>
          <h1>글자를 읽고 있어요</h1>
          <p className="ocr-progress-label">{ocrProgress.label}</p>
          <div
            className="ocr-progress-track"
            role="progressbar"
            aria-label="글자 인식 진행률"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={ocrProgress.percent}
          >
            <span style={{ width: `${ocrProgress.percent}%` }} />
          </div>
          <output className="ocr-progress-value">{ocrProgress.percent}%</output>
        </div>
      ) : ocrText ? (
        <div className="ocr-result">
          <div className="photo-heading">
            <p className="participant-kicker">사진에서 읽은 글</p>
            <h1>원문을 확인해요</h1>
          </div>
          <p className={needsReview ? 'ocr-check-message needs-review' : 'ocr-check-message'}>
            {needsReview
              ? '글자가 흐릿할 수 있어요. 사진과 아래 글을 꼭 비교해 주세요.'
              : '사진에 있는 날짜와 금액이 아래 글과 같은지 확인해 주세요.'}
          </p>
          {ocrConfidence !== null ? (
            <p className="ocr-confidence">
              인식 상태: {needsReview ? '확인이 필요해요' : '대체로 잘 읽었어요'}
            </p>
          ) : null}
          <div className="ocr-text-card">
            <pre>{ocrText}</pre>
          </div>
          <button type="button" className="participant-primary-action result-action" onClick={resetImage}>
            다른 사진 찍기
          </button>
        </div>
      ) : !imageUrl ? (
        <div className="camera-start">
          {settings.showPictograms ? (
            <div className="document-symbol" aria-hidden="true">
              <span /><span /><span />
            </div>
          ) : null}
          <p className="participant-kicker">어려운 글이 있나요?</p>
          <h1>사진을 찍으면<br />쉽게 읽어드려요</h1>
          <button type="button" className="camera-button" onClick={openCamera}>
            <span className="camera-icon"><CameraIcon /></span>
            <span>카메라로<br />쉬운 말 보기</span>
          </button>
          <p className="camera-help">우편물이나 안내문을 화면에 맞춰 찍어 주세요.</p>
        </div>
      ) : (
        <div className="photo-review">
          <div className="photo-heading">
            <p className="participant-kicker">사진을 확인해요</p>
            <h1>글자가 잘 보이나요?</h1>
          </div>
          <div className="document-preview">
            <img src={imageUrl} alt={`선택한 문서: ${imageName}`} />
          </div>
          <div className="participant-actions">
            <button type="button" className="participant-secondary-action" onClick={resetImage}>
              다시 찍기
            </button>
            <button type="button" className="participant-primary-action" onClick={handleOcr}>
              글자 읽기
            </button>
          </div>
        </div>
      )}

      {message ? <p className="participant-notice error" role="alert">{message}</p> : null}
      {settingsError ? (
        <p className="participant-notice error" role="alert">{settingsError}</p>
      ) : null}
    </section>
  )
}

export default ParticipantView
