import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getCallableErrorCode,
  getCallableErrorMessage,
} from '../src/services/callableErrors.js'

test('normalizes Firebase callable error codes', () => {
  assert.equal(getCallableErrorCode({ code: 'functions/unavailable' }), 'unavailable')
  assert.equal(getCallableErrorCode({ code: 'invalid-argument' }), 'invalid-argument')
  assert.equal(getCallableErrorCode(null), '')
})

test('returns recovery guidance for network and authentication failures', () => {
  assert.match(
    getCallableErrorMessage({ code: 'functions/unavailable' }),
    /인터넷 연결/,
  )
  assert.match(
    getCallableErrorMessage({ code: 'functions/unauthenticated' }),
    /다시 로그인/,
  )
})

test('keeps safe server messages but hides unknown technical errors', () => {
  assert.equal(
    getCallableErrorMessage({
      code: 'functions/invalid-argument',
      message: '사진 데이터가 올바르지 않아요.',
    }),
    '사진 데이터가 올바르지 않아요.',
  )
  assert.equal(
    getCallableErrorMessage({ code: 'functions/internal', message: 'stack trace' }, {
      fallback: '다시 시도해 주세요.',
    }),
    '다시 시도해 주세요.',
  )
})
