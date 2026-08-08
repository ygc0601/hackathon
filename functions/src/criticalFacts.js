const FACT_PATTERNS = [
  {
    kind: '전화번호',
    pattern: /(?<!\d)0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}(?!\d)/g,
  },
  {
    kind: '날짜',
    pattern: /\d{2,4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일/g,
  },
  {
    kind: '날짜',
    pattern: /(?<!\d)\d{4}[-./]\d{1,2}[-./]\d{1,2}(?!\d)/g,
  },
  {
    kind: '시간',
    pattern: /(?:오전|오후)?\s*\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?/g,
  },
  {
    kind: '시간',
    pattern: /(?<!\d)\d{1,2}:\d{2}(?!\d)/g,
  },
  {
    kind: '금액',
    pattern: /(?<!\d)\d[\d,]*(?:억|만|천)?\s*원/g,
  },
  {
    kind: '비율',
    pattern: /(?<!\d)\d+(?:\.\d+)?\s*%/g,
  },
]

function normalizeFact(value) {
  return value.toLowerCase().replace(/[\s,.]/g, '')
}

function extractCriticalFacts(text) {
  const facts = []
  const seen = new Set()

  for (const { kind, pattern } of FACT_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0].trim()
      const key = `${kind}:${normalizeFact(value)}`

      if (!seen.has(key)) {
        seen.add(key)
        facts.push({ kind, value })
      }
    }
  }

  return facts
}

function findMissingCriticalFacts(sourceText, translatedText) {
  const normalizedTranslation = normalizeFact(translatedText)

  return extractCriticalFacts(sourceText).filter(
    ({ value }) => !normalizedTranslation.includes(normalizeFact(value)),
  )
}

export { extractCriticalFacts, findMissingCriticalFacts }
