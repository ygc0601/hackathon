import assert from 'node:assert/strict'
import test from 'node:test'
import { extractCriticalFacts, findMissingCriticalFacts } from '../src/criticalFacts.js'

test('extracts dates, times, money, phone numbers, and percentages', () => {
  const facts = extractCriticalFacts(
    '2026년 8월 20일 오전 9시까지 12,000원을 내세요. 02-1234-5678, 할인 10%',
  )

  assert.deepEqual(facts, [
    { kind: '전화번호', value: '02-1234-5678' },
    { kind: '날짜', value: '2026년 8월 20일' },
    { kind: '시간', value: '오전 9시' },
    { kind: '금액', value: '12,000원' },
    { kind: '비율', value: '10%' },
  ])
})

test('accepts harmless spacing differences', () => {
  assert.deepEqual(
    findMissingCriticalFacts('오후 10시, 5,000원', '오후 10시에 5,000 원을 내세요.'),
    [],
  )
})

test('reports critical facts omitted by translation', () => {
  assert.deepEqual(
    findMissingCriticalFacts(
      '2026년 8월 20일까지 02-1234-5678로 전화하세요.',
      '2026년 8월 20일까지 전화하세요.',
    ),
    [{ kind: '전화번호', value: '02-1234-5678' }],
  )
})
