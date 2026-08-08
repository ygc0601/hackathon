import { useEffect, useRef, useState } from 'react'
import useAccessibility from '../hooks/useAccessibility.js'
import { simplifyDocumentText } from '../services/easyLanguage.js'
import { extractDocumentText } from '../services/ocr.js'

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

function getKoreanVoice(synthesis) {
  return synthesis.getVoices().find((voice) => voice.lang.toLowerCase().startsWith('ko'))
}

function getSpeechRate(value) {
  const rate = Number(value)
  return Number.isFinite(rate) ? Math.min(1, Math.max(0.5, rate)) : 0.8
}

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
  const speechRunRef = useRef(0)
  const { settings, loading, error: settingsError } = useAccessibility()
  const [imageFile, setImageFile] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageName, setImageName] = useState('')
  const [message, setMessage] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ocrText, setOcrText] = useState('')
  const [ocrConfidence, setOcrConfidence] = useState(null)
  const [needsReview, setNeedsReview] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [easySummary, setEasySummary] = useState('')
  const [easySentences, setEasySentences] = useState([])
  const [criticalPoints, setCriticalPoints] = useState([])
  const [uncertainParts, setUncertainParts] = useState([])
  const [missingCriticalFacts, setMissingCriticalFacts] = useState([])
  const [speechStatus, setSpeechStatus] = useState('idle')
  const [activeSentenceIndex, setActiveSentenceIndex] = useState(-1)
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

  useEffect(() => {
    return () => {
      speechRunRef.current += 1
      window.speechSynthesis?.cancel()
    }
  }, [])

  const stopSpeech = () => {
    speechRunRef.current += 1
    window.speechSynthesis?.cancel()
    setSpeechStatus('idle')
    setActiveSentenceIndex(-1)
  }

  const startSpeech = (startIndex = 0) => {
    const synthesis = window.speechSynthesis

    if (!synthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
      setMessage('이 브라우저에서는 음성 읽기를 사용할 수 없어요.')
      return
    }

    const runId = speechRunRef.current + 1
    speechRunRef.current = runId
    synthesis.cancel()
    setMessage('')
    setSpeechStatus('speaking')

    const speakNext = (index) => {
      if (speechRunRef.current !== runId) return

      if (index >= easySentences.length) {
        setSpeechStatus('idle')
        setActiveSentenceIndex(-1)
        return
      }

      const utterance = new window.SpeechSynthesisUtterance(easySentences[index])
      const voice = getKoreanVoice(synthesis)

      utterance.lang = 'ko-KR'
      utterance.rate = getSpeechRate(settings.speechRate)
      if (voice) utterance.voice = voice

      utterance.onstart = () => {
        if (speechRunRef.current === runId) setActiveSentenceIndex(index)
      }
      utterance.onend = () => speakNext(index + 1)
      utterance.onerror = (event) => {
        if (speechRunRef.current !== runId) return
        if (event.error === 'canceled' || event.error === 'interrupted') return

        setMessage('음성을 읽지 못했어요. 다시 눌러 주세요.')
        setSpeechStatus('idle')
        setActiveSentenceIndex(-1)
      }

      synthesis.speak(utterance)
    }

    speakNext(startIndex)
  }

  const toggleSpeech = () => {
    const synthesis = window.speechSynthesis

    if (speechStatus === 'speaking') {
      synthesis.pause()
      setSpeechStatus('paused')
      return
    }

    if (speechStatus === 'paused') {
      synthesis.resume()
      setSpeechStatus('speaking')
      return
    }

    startSpeech()
  }

  const openCamera = () => inputRef.current?.click()

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    stopSpeech()
    setMessage('')
    setOcrText('')
    setOcrConfidence(null)
    setNeedsReview(false)
    setEasySummary('')
    setEasySentences([])
    setCriticalPoints([])
    setUncertainParts([])
    setMissingCriticalFacts([])

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

    void handleDocument(file)
  }

  const resetImage = () => {
    stopSpeech()
    setImageFile(null)
    setImageUrl('')
    setImageName('')
    setMessage('')
    setOcrText('')
    setOcrConfidence(null)
    setNeedsReview(false)
    setProcessing(false)
    setTranslating(false)
    setEasySummary('')
    setEasySentences([])
    setCriticalPoints([])
    setUncertainParts([])
    setMissingCriticalFacts([])
  }

  const handleDocument = async (selectedFile = imageFile) => {
    if (!selectedFile) return

    stopSpeech()
    setProcessing(true)
    setTranslating(false)
    setMessage('')
    setOcrProgress({ percent: 1, label: '사진을 준비하고 있어요' })

    try {
      const ocrResult = await extractDocumentText(selectedFile, setOcrProgress)

      if (!ocrResult.text) {
        setMessage('사진에서 글자를 찾지 못했어요. 더 밝은 곳에서 다시 찍어 주세요.')
        return
      }

      setOcrText(ocrResult.text)
      setOcrConfidence(ocrResult.confidence)
      setNeedsReview(ocrResult.needsReview)
      setProcessing(false)
      setTranslating(true)

      const translationResult = await simplifyDocumentText(ocrResult.text, settings)

      setEasySummary(translationResult.summary)
      setEasySentences(translationResult.sentences)
      setCriticalPoints(translationResult.criticalPoints)
      setUncertainParts(translationResult.uncertainParts)
      setMissingCriticalFacts(translationResult.missingCriticalFacts)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setProcessing(false)
      setTranslating(false)
    }
  }

  const handleSimplify = async () => {
    if (!ocrText) return

    stopSpeech()
    setTranslating(true)
    setMessage('')

    try {
      const result = await simplifyDocumentText(ocrText, settings)
      setEasySummary(result.summary)
      setEasySentences(result.sentences)
      setCriticalPoints(result.criticalPoints)
      setUncertainParts(result.uncertainParts)
      setMissingCriticalFacts(result.missingCriticalFacts)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setTranslating(false)
    }
  }

  const textSizeClass =
    settings.fontSize === 'extraLarge' ? 'participant-text-xl' : 'participant-text-large'

  if (loading) {
    return (
      <section className="participant-stage" aria-live="polite">
        <p className="participant-loading">화면을 준비하고 있어요.</p>
      </section>
    )
  }

  return (
    <section className={`participant-stage ${textSizeClass}`}>
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
      ) : translating ? (
        <div className="ocr-loading" aria-live="polite">
          <span className="ocr-spinner" aria-hidden="true" />
          <p className="participant-kicker">쉬운 낱말을 고르고 있어요</p>
          <h1>쉬운말로 바꾸고 있어요</h1>
          <p className="ocr-progress-label">중요한 숫자와 날짜를 그대로 확인하고 있어요.</p>
        </div>
      ) : easySentences.length > 0 ? (
        <div className="easy-language-result">
          <div className="photo-heading">
            <p className="participant-kicker">쉬운말 결과</p>
            <h1>이렇게 읽어 보세요</h1>
          </div>
          <p className="easy-language-caution">
            AI가 쉽게 바꾼 글이에요. 중요한 날짜와 숫자는 원문과 함께 확인해 주세요.
          </p>
          {easySummary ? (
            <section className="easy-summary" aria-labelledby="easy-summary-title">
              <h2 id="easy-summary-title">무슨 내용인가요?</h2>
              <p>{easySummary}</p>
            </section>
          ) : null}
          <section className="speech-panel" aria-label="음성으로 듣기">
            <div>
              <strong>소리로 들어 보세요</strong>
              <output aria-live="polite">
                {speechStatus === 'speaking'
                  ? `${activeSentenceIndex + 1}번 문장을 읽고 있어요.`
                  : speechStatus === 'paused'
                    ? '잠시 멈췄어요.'
                    : `보호자가 정한 속도 ${Math.round(getSpeechRate(settings.speechRate) * 100)}%로 읽어요.`}
              </output>
            </div>
            <div className="speech-actions">
              <button
                type="button"
                className="speech-primary-action"
                aria-pressed={speechStatus === 'paused'}
                onClick={toggleSpeech}
              >
                {speechStatus === 'speaking'
                  ? '잠시 멈추기'
                  : speechStatus === 'paused'
                    ? '계속 듣기'
                    : '소리로 듣기'}
              </button>
              {speechStatus !== 'idle' ? (
                <button
                  type="button"
                  className="speech-secondary-action"
                  onClick={() => startSpeech()}
                >
                  처음부터 듣기
                </button>
              ) : null}
            </div>
          </section>
          <h2 className="easy-section-title">쉬운 설명</h2>
          <ol className="easy-sentence-list">
            {easySentences.map((sentence, index) => {
              const isCritical = criticalPoints.includes(sentence)
              const isReading = activeSentenceIndex === index
              const itemClassName = [
                isCritical ? 'is-critical' : '',
                isReading ? 'is-reading' : '',
              ].filter(Boolean).join(' ') || undefined

              return (
                <li
                  key={`${index}-${sentence}`}
                  className={itemClassName}
                  aria-current={isReading ? 'true' : undefined}
                >
                  <span aria-hidden="true">{index + 1}</span>
                  <div className="easy-sentence-copy">
                    {isCritical ? <strong>꼭 확인</strong> : null}
                    <p>{sentence}</p>
                  </div>
                </li>
              )
            })}
          </ol>
          {missingCriticalFacts.length > 0 ? (
            <section className="fact-warning" aria-labelledby="fact-warning-title">
              <h2 id="fact-warning-title">원문을 확인해 주세요</h2>
              <p>쉬운 글에서 빠졌을 수 있는 중요한 정보예요.</p>
              <ul>
                {missingCriticalFacts.map(({ kind, value }) => (
                  <li key={`${kind}-${value}`}><strong>{kind}</strong> {value}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {uncertainParts.length > 0 ? (
            <section className="uncertain-parts" aria-labelledby="uncertain-title">
              <h2 id="uncertain-title">확인이 필요한 글</h2>
              <ul>
                {uncertainParts.map((part, index) => <li key={`${index}-${part}`}>{part}</li>)}
              </ul>
            </section>
          ) : null}
          <details className="source-text-details">
            <summary>사진에서 읽은 원문 보기</summary>
            <pre>{ocrText}</pre>
          </details>
          <button type="button" className="participant-primary-action result-action" onClick={resetImage}>
            다른 사진 찍기
          </button>
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
          <div className="participant-actions">
            <button type="button" className="participant-secondary-action" onClick={resetImage}>
              다른 사진 찍기
            </button>
            <button type="button" className="participant-primary-action" onClick={handleSimplify}>
              다시 쉬운말로 바꾸기
            </button>
          </div>
        </div>
      ) : !imageUrl ? (
        <div className="camera-start">
          <div className="participant-ready-badge">
            <span aria-hidden="true" />
            쉬운말 준비가 되었어요
          </div>
          <p className="participant-kicker">어려운 글이 있나요?</p>
          <h1>사진을 찍으면 쉽게 읽어드려요</h1>
          <button type="button" className="camera-button" onClick={openCamera}>
            <span className="camera-icon"><CameraIcon /></span>
            <span>카메라로 쉬운 말 보기</span>
          </button>
          <p className="camera-help">우편물이나 안내문을 화면에 맞춰 찍어 주세요.</p>
          <div className="camera-tips" aria-label="사진 찍는 방법">
            <span><strong>1</strong>글이 잘 보이게</span>
            <span><strong>2</strong>밝은 곳에서</span>
          </div>
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
            <button
              type="button"
              className="participant-primary-action"
              onClick={() => handleDocument()}
            >
              쉬운말로 바꾸기
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
