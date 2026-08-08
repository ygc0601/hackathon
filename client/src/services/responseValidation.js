function normalizeRemaining(value) {
  return Number.isInteger(value) && value >= 0 ? value : null
}

function normalizeStringList(value, limit) {
  if (!Array.isArray(value)) return []

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit)
}

function normalizeOcrResponse(data) {
  if (!data || typeof data !== 'object' || typeof data.text !== 'string') {
    throw new Error('사진 분석 결과를 확인하지 못했어요. 다시 시도해 주세요.')
  }

  const confidence = Number.isFinite(data.confidence)
    && data.confidence >= 0
    && data.confidence <= 100
    ? Math.round(data.confidence)
    : null

  return {
    text: data.text.replace(/\u200B/g, '').trim(),
    confidence,
    needsReview: data.needsReview === true || confidence === null || confidence < 80,
    remaining: normalizeRemaining(data.remaining),
  }
}

function normalizeEasyLanguageResponse(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('쉬운말 결과를 확인하지 못했어요. 다시 시도해 주세요.')
  }

  const summary = typeof data.summary === 'string' ? data.summary.trim() : ''
  const sentences = normalizeStringList(data.sentences, 60)

  if (!summary || sentences.length === 0) {
    throw new Error('쉬운말 결과가 비어 있어요. 다시 시도해 주세요.')
  }

  const missingCriticalFacts = Array.isArray(data.missingCriticalFacts)
    ? data.missingCriticalFacts
        .filter((fact) => fact && typeof fact.kind === 'string' && typeof fact.value === 'string')
        .map((fact) => ({ kind: fact.kind.trim(), value: fact.value.trim() }))
        .filter((fact) => fact.kind && fact.value)
        .slice(0, 20)
    : []

  return {
    summary,
    sentences,
    criticalPoints: normalizeStringList(data.criticalPoints, 20),
    uncertainParts: normalizeStringList(data.uncertainParts, 20),
    missingCriticalFacts,
    remaining: normalizeRemaining(data.remaining),
  }
}

export { normalizeEasyLanguageResponse, normalizeOcrResponse }
