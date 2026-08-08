import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateConfidence,
  decodeJpeg,
  validateTranslationRequest,
} from '../src/requestValidation.js'

test('accepts JPEG bytes and rejects invalid image input', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00])

  assert.deepEqual(decodeJpeg(jpeg.toString('base64'), 'image/jpeg'), jpeg)
  assert.throws(
    () => decodeJpeg(jpeg.toString('base64'), 'image/png'),
    /JPEG 사진만/,
  )
  assert.throws(
    () => decodeJpeg(Buffer.from('not-jpeg').toString('base64'), 'image/jpeg'),
    /JPEG 사진을 다시/,
  )
  assert.throws(() => decodeJpeg('not base64', 'image/jpeg'), /사진 데이터/)
})

test('normalizes translation text and supported profile values', () => {
  assert.deepEqual(validateTranslationRequest({
    sourceText: '  첫 줄  \r\n\r\n\r\n 둘째 줄  ',
    easyLanguageLevel: 'standard',
    sentenceLength: 'medium',
  }), {
    sourceText: '첫 줄\n\n둘째 줄',
    easyLanguageLevel: 'standard',
    sentenceLength: 'medium',
  })

  assert.deepEqual(validateTranslationRequest({ sourceText: '안내문' }), {
    sourceText: '안내문',
    easyLanguageLevel: 'basic',
    sentenceLength: 'short',
  })
})

test('rejects empty and oversized translation text', () => {
  assert.throws(() => validateTranslationRequest({ sourceText: '   ' }), /비어/)
  assert.throws(
    () => validateTranslationRequest({ sourceText: '가'.repeat(12_001) }),
    /12,000자보다 짧은/,
  )
})

test('calculates OCR confidence from valid words only', () => {
  const annotation = {
    pages: [{
      blocks: [{
        paragraphs: [{
          words: [{ confidence: 0.9 }, { confidence: 0.7 }, { confidence: 0 }],
        }],
      }],
    }],
  }

  assert.equal(calculateConfidence(annotation), 80)
  assert.equal(calculateConfidence({ pages: [] }), null)
  assert.equal(calculateConfidence(null), null)
})
