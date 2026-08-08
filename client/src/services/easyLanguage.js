import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config.js'
import { getCallableErrorMessage } from './callableErrors.js'
import { normalizeEasyLanguageResponse } from './responseValidation.js'

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
    return normalizeEasyLanguageResponse(result.data)
  } catch (error) {
    if (!error.code && error.message) throw error

    throw new Error(getCallableErrorMessage(error, {
      fallback: '쉬운말로 바꾸는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
    }))
  }
}

export { simplifyDocumentText }
