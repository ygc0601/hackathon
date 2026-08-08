import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config.js'

function getFriendlyError(error) {
  const code = error?.code?.replace('functions/', '')

  if (code === 'unauthenticated') return '로그인한 뒤 다시 시도해 주세요.'
  if (code === 'permission-denied') return '보호자와 연결된 기기에서 이용해 주세요.'
  if (code === 'resource-exhausted') {
    return error.message || '번역 사용량을 모두 사용했어요.'
  }
  if (code === 'invalid-argument' || code === 'failed-precondition') {
    return error.message
  }

  return '쉬운말로 바꾸는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

async function simplifyDocumentText(sourceText, settings) {
  if (!functions) {
    throw new Error('Firebase 연결 정보를 확인해 주세요.')
  }

  const callSimplify = httpsCallable(functions, 'simplifyDocumentText')

  try {
    const result = await callSimplify({
      sourceText,
      easyLanguageLevel: settings.easyLanguageLevel,
      sentenceLength: settings.sentenceLength,
    })
    const sentences = Array.isArray(result.data?.sentences) ? result.data.sentences : []

    if (sentences.length === 0) {
      throw new Error('쉬운말 결과가 비어 있어요. 다시 시도해 주세요.')
    }

    return {
      summary: typeof result.data?.summary === 'string' ? result.data.summary : '',
      sentences,
      criticalPoints: Array.isArray(result.data?.criticalPoints)
        ? result.data.criticalPoints
        : [],
      uncertainParts: Array.isArray(result.data?.uncertainParts)
        ? result.data.uncertainParts
        : [],
      missingCriticalFacts: Array.isArray(result.data?.missingCriticalFacts)
        ? result.data.missingCriticalFacts
        : [],
      remaining: result.data?.remaining ?? null,
    }
  } catch (error) {
    if (!error.code && error.message) throw error
    throw new Error(getFriendlyError(error))
  }
}

export { simplifyDocumentText }
