import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getAuthErrorMessage,
  getSessionErrorMessage,
} from '../src/services/authErrors.js'

test('maps common authentication failures to clear Korean guidance', () => {
  assert.match(getAuthErrorMessage({ code: 'auth/invalid-credential' }), /맞지 않아요/)
  assert.match(getAuthErrorMessage({ code: 'auth/too-many-requests' }), /잠시 후/)
  assert.match(getAuthErrorMessage({ code: 'auth/user-token-expired' }), /다시 로그인/)
})

test('maps session network and permission failures', () => {
  assert.match(getSessionErrorMessage({ code: 'unavailable' }, '기본 오류'), /인터넷/)
  assert.match(getSessionErrorMessage({ code: 'permission-denied' }, '기본 오류'), /권한/)
  assert.equal(getSessionErrorMessage({ code: 'unknown' }, '기본 오류'), '기본 오류')
})
