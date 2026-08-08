import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeEasyLanguageResponse,
  normalizeOcrResponse,
} from '../src/services/responseValidation.js'

test('normalizes OCR text and marks unreliable confidence for review', () => {
  assert.deepEqual(normalizeOcrResponse({
    text: '  안내\u200B문  ',
    confidence: 79.6,
    needsReview: false,
    remaining: 12,
  }), {
    text: '안내문',
    confidence: 80,
    needsReview: false,
    remaining: 12,
  })

  assert.equal(normalizeOcrResponse({ text: '글', confidence: null }).needsReview, true)
})

test('rejects malformed OCR responses', () => {
  assert.throws(() => normalizeOcrResponse(null), /사진 분석 결과/)
  assert.throws(() => normalizeOcrResponse({ text: 123 }), /사진 분석 결과/)
})

test('normalizes easy-language response lists and critical facts', () => {
  assert.deepEqual(normalizeEasyLanguageResponse({
    summary: '  병원 안내예요. ',
    sentences: [' 9시에 가요. ', '', 123],
    criticalPoints: [' 9시에 가요. '],
    uncertainParts: [' '],
    missingCriticalFacts: [
      { kind: '날짜', value: ' 8월 20일 ' },
      { kind: '금액', value: 1000 },
    ],
    remaining: -1,
  }), {
    summary: '병원 안내예요.',
    sentences: ['9시에 가요.'],
    criticalPoints: ['9시에 가요.'],
    uncertainParts: [],
    missingCriticalFacts: [{ kind: '날짜', value: '8월 20일' }],
    remaining: null,
  })
})

test('rejects empty easy-language results', () => {
  assert.throws(() => normalizeEasyLanguageResponse({ summary: '', sentences: [] }), /비어/)
})
