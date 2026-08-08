const DEFAULT_SETTINGS = {
  easyLanguageLevel: 'basic',
  sentenceLength: 'short',
  fontSize: 'large',
  speechRate: 0.8,
  highContrast: false,
}

function normalizeAccessibilitySettings(value = {}) {
  const candidate = value && typeof value === 'object' ? value : {}
  const rawSpeechRate = Number(candidate.speechRate)
  const speechRate = Number.isFinite(rawSpeechRate)
    ? Math.round(Math.min(1, Math.max(0.5, rawSpeechRate)) * 10) / 10
    : DEFAULT_SETTINGS.speechRate

  return {
    easyLanguageLevel: candidate.easyLanguageLevel === 'standard' ? 'standard' : 'basic',
    sentenceLength: candidate.sentenceLength === 'medium' ? 'medium' : 'short',
    fontSize: candidate.fontSize === 'extraLarge' ? 'extraLarge' : 'large',
    speechRate,
    highContrast: candidate.highContrast === true,
  }
}

export { normalizeAccessibilitySettings }
export default DEFAULT_SETTINGS
