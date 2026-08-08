import { HttpsError } from 'firebase-functions/v2/https'

const MAX_IMAGE_BYTES = 7 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4
const MAX_SOURCE_TEXT_LENGTH = 12_000

function decodeJpeg(imageBase64, mimeType) {
  if (mimeType !== 'image/jpeg') {
    throw new HttpsError('invalid-argument', 'JPEG 사진만 처리할 수 있어요.')
  }

  if (
    typeof imageBase64 !== 'string'
    || imageBase64.length === 0
    || imageBase64.length > MAX_BASE64_LENGTH
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)
  ) {
    throw new HttpsError('invalid-argument', '사진 데이터가 올바르지 않아요.')
  }

  const image = Buffer.from(imageBase64, 'base64')

  if (
    image.length === 0
    || image.length > MAX_IMAGE_BYTES
    || image[0] !== 0xff
    || image[1] !== 0xd8
    || image[2] !== 0xff
  ) {
    throw new HttpsError('invalid-argument', 'JPEG 사진을 다시 선택해 주세요.')
  }

  return image
}

function validateTranslationRequest(data) {
  const sourceText = typeof data?.sourceText === 'string'
    ? data.sourceText
        .trim()
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
    : ''
  const easyLanguageLevel = data?.easyLanguageLevel === 'standard' ? 'standard' : 'basic'
  const sentenceLength = data?.sentenceLength === 'medium' ? 'medium' : 'short'

  if (!sourceText) {
    throw new HttpsError('invalid-argument', '번역할 글이 비어 있어요.')
  }

  if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
    throw new HttpsError(
      'invalid-argument',
      '글이 너무 길어요. 12,000자보다 짧은 문서를 사용해 주세요.',
    )
  }

  return { sourceText, easyLanguageLevel, sentenceLength }
}

function calculateConfidence(annotation) {
  const words = annotation?.pages
    ?.flatMap((page) => page.blocks ?? [])
    .flatMap((block) => block.paragraphs ?? [])
    .flatMap((paragraph) => paragraph.words ?? []) ?? []
  const confidenceValues = words
    .map((word) => word.confidence)
    .filter((confidence) => Number.isFinite(confidence) && confidence > 0)

  if (confidenceValues.length === 0) return null

  const average = confidenceValues.reduce((sum, value) => sum + value, 0)
    / confidenceValues.length
  return Math.round(average * 100)
}

export { calculateConfidence, decodeJpeg, validateTranslationRequest }
