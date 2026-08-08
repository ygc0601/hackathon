const AUTH_MESSAGES = {
  'auth/admin-restricted-operation': 'Firebase 콘솔에서 익명 로그인을 먼저 켜 주세요.',
  'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 주세요.',
  'auth/invalid-credential': '이메일이나 비밀번호가 맞지 않아요.',
  'auth/invalid-email': '이메일 주소를 다시 확인해 주세요.',
  'auth/missing-password': '비밀번호를 입력해 주세요.',
  'auth/network-request-failed': '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  'auth/operation-not-allowed': 'Firebase 콘솔에서 이 로그인 방법을 먼저 켜 주세요.',
  'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.',
  'auth/user-disabled': '사용할 수 없는 계정이에요. 관리자에게 문의해 주세요.',
  'auth/user-token-expired': '로그인 상태가 끝났어요. 다시 로그인해 주세요.',
  'auth/weak-password': '비밀번호는 6자 이상 입력해 주세요.',
}

function getAuthErrorMessage(error) {
  return AUTH_MESSAGES[error?.code]
    ?? '로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

function getSessionErrorMessage(error, fallback) {
  if (error?.code === 'unavailable' || error?.code === 'auth/network-request-failed') {
    return '인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
  }

  if (error?.code === 'permission-denied') {
    return '이 기기의 연결 권한을 확인하지 못했어요. 다시 로그인해 주세요.'
  }

  return fallback
}

export { getAuthErrorMessage, getSessionErrorMessage }
