const COMMON_MESSAGES = {
  unauthenticated: '로그인 상태가 끝났어요. 다시 로그인해 주세요.',
  'permission-denied': '이 기능을 사용할 수 없는 기기예요. 보호자와 다시 연결해 주세요.',
  'deadline-exceeded': '처리 시간이 오래 걸리고 있어요. 잠시 후 다시 시도해 주세요.',
  unavailable: '서버에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.',
  cancelled: '요청이 중단됐어요. 다시 시도해 주세요.',
}

const SAFE_SERVER_MESSAGE_CODES = new Set([
  'failed-precondition',
  'invalid-argument',
  'resource-exhausted',
])

function getCallableErrorCode(error) {
  return typeof error?.code === 'string'
    ? error.code.replace(/^functions\//, '')
    : ''
}

function getCallableErrorMessage(error, options = {}) {
  const code = getCallableErrorCode(error)
  const customMessage = options.messages?.[code]

  if (customMessage) return customMessage
  if (COMMON_MESSAGES[code]) return COMMON_MESSAGES[code]

  if (
    SAFE_SERVER_MESSAGE_CODES.has(code)
    && typeof error?.message === 'string'
    && error.message.trim()
  ) {
    return error.message.trim()
  }

  return options.fallback ?? '처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

export { getCallableErrorCode, getCallableErrorMessage }
