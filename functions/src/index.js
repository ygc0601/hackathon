import vision from '@google-cloud/vision'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const db = getFirestore()
const visionClient = new vision.ImageAnnotatorClient()

const MONTHLY_OCR_LIMIT = 900
const MAX_IMAGE_BYTES = 7 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

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

async function reserveMonthlyUsage() {
  const month = getCurrentMonth()
  const usageRef = db.collection('visionOcrUsage').doc(month)

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(usageRef)
    const currentCount = snapshot.exists ? snapshot.data().count ?? 0 : 0

    if (currentCount >= MONTHLY_OCR_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        '이번 달 무료 OCR 사용량을 모두 사용했어요.',
      )
    }

    const nextCount = currentCount + 1
    transaction.set(
      usageRef,
      {
        count: nextCount,
        limit: MONTHLY_OCR_LIMIT,
        updatedAt: new Date(),
      },
      { merge: true },
    )

    return MONTHLY_OCR_LIMIT - nextCount
  })
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

export const extractDocumentText = onCall(
  {
    region: 'asia-northeast3',
    memory: '512MiB',
    timeoutSeconds: 120,
    minInstances: 0,
    maxInstances: 2,
    concurrency: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', '로그인한 사용자만 이용할 수 있어요.')
    }

    const image = decodeJpeg(request.data?.imageBase64, request.data?.mimeType)
    const remaining = await reserveMonthlyUsage()

    try {
      const [result] = await visionClient.documentTextDetection({
        image: { content: image },
        imageContext: { languageHints: ['ko', 'en'] },
      })
      const annotation = result.fullTextAnnotation
      const text = annotation?.text?.replace(/\u200B/g, '').trim() ?? ''
      const confidence = calculateConfidence(annotation)

      return {
        text,
        confidence,
        needsReview: confidence === null || confidence < 80,
        remaining,
      }
    } catch (error) {
      logger.error('Vision OCR request failed', {
        code: error?.code ?? 'unknown',
      })
      throw new HttpsError(
        'internal',
        '사진을 읽는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  },
)
