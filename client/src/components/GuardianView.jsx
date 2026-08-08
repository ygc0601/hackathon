import { useEffect, useState } from 'react'
import DEFAULT_SETTINGS from '../contexts/accessibilityDefaults.js'
import useAccessibility from '../hooks/useAccessibility.js'

const OPTIONS = {
  easyLanguageLevel: [
    { value: 'basic', label: '아주 쉽게', description: '익숙한 낱말과 아주 짧은 문장' },
    { value: 'standard', label: '쉽게', description: '일상 낱말과 간단한 설명' },
  ],
  sentenceLength: [
    { value: 'short', label: '짧게', description: '한 문장에 한 가지 정보' },
    { value: 'medium', label: '조금 길게', description: '관련된 정보를 함께 설명' },
  ],
  fontSize: [
    { value: 'large', label: '크게', description: '휴대폰에서 편하게 읽는 크기' },
    { value: 'extraLarge', label: '아주 크게', description: '한 번에 적은 글자를 표시' },
  ],
}

function ChoiceGroup({ legend, name, value, options, onChange }) {
  return (
    <fieldset className="settings-group">
      <legend>{legend}</legend>
      <div className="choice-grid">
        {options.map((option) => (
          <label
            key={option.value}
            className={value === option.value ? 'choice-card selected' : 'choice-card'}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(event) => onChange(event.target.value)}
            />
            <span className="choice-copy">
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function GuardianView() {
  const { settings, loading, saving, error, saveSettings } = useAccessibility()
  const [draft, setDraft] = useState(DEFAULT_SETTINGS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(settings)
  }, [settings])

  const updateSetting = (key, value) => {
    setSaved(false)
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      await saveSettings(draft)
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }

  if (loading) {
    return (
      <section className="info-panel settings-panel">
        <p className="panel-label">접근성 설정</p>
        <h2>설정을 불러오고 있어요</h2>
      </section>
    )
  }

  return (
    <section className="info-panel settings-panel">
      <div className="settings-heading">
        <div className="panel-title-group">
          <span className="panel-number" aria-hidden="true">02</span>
          <div>
            <p className="panel-label">접근성 설정</p>
            <h2>읽기 편한 방법을 정해요</h2>
          </div>
        </div>
        <span className="sync-badge">연결 기기에 적용</span>
      </div>

      <form className="settings-form" onSubmit={handleSubmit}>
        <ChoiceGroup
          legend="쉬운 말 난이도"
          name="easyLanguageLevel"
          value={draft.easyLanguageLevel}
          options={OPTIONS.easyLanguageLevel}
          onChange={(value) => updateSetting('easyLanguageLevel', value)}
        />
        <ChoiceGroup
          legend="문장 길이"
          name="sentenceLength"
          value={draft.sentenceLength}
          options={OPTIONS.sentenceLength}
          onChange={(value) => updateSetting('sentenceLength', value)}
        />
        <ChoiceGroup
          legend="글자 크기"
          name="fontSize"
          value={draft.fontSize}
          options={OPTIONS.fontSize}
          onChange={(value) => updateSetting('fontSize', value)}
        />

        <fieldset className="settings-group">
          <legend>보기와 듣기</legend>
          <label className="switch-row">
            <span>
              <strong>고대비 화면</strong>
              <small>글자와 배경의 차이를 더 크게 만들어요.</small>
            </span>
            <input
              type="checkbox"
              checked={draft.highContrast}
              onChange={(event) => updateSetting('highContrast', event.target.checked)}
            />
          </label>
          <label className="range-row">
            <span className="range-heading">
              <strong>음성 안내 속도</strong>
              <output>{Math.round(draft.speechRate * 100)}%</output>
            </span>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.1"
              value={draft.speechRate}
              onChange={(event) => updateSetting('speechRate', Number(event.target.value))}
            />
            <span className="range-labels" aria-hidden="true">
              <small>천천히</small>
              <small>보통</small>
            </span>
          </label>
        </fieldset>

        {error ? <p className="settings-message error" role="alert">{error}</p> : null}
        {saved && !error ? (
          <p className="settings-message success" role="status">
            저장했어요. 당사자 화면에도 적용돼요.
          </p>
        ) : null}

        <button type="submit" className="save-settings-button" disabled={saving}>
          {saving ? '저장하고 있어요...' : '이 설정 저장하기'}
        </button>
      </form>
    </section>
  )
}

export default GuardianView
