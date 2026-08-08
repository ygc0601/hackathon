import vision from '@google-cloud/vision'
import OpenAI from 'openai'
import { createHash } from 'node:crypto'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { defineSecret } from 'firebase-functions/params'
import { onInit } from 'firebase-functions/v2/core'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import {
  getTranslationPrompt,
  translationSchema,
} from './easyLanguagePrompt.js'
import { findMissingCriticalFacts } from './criticalFacts.js'

initializeApp()

const db = getFirestore()
let visionClient
const openAiApiKey = defineSecret('OPENAI_API_KEY')

onInit(() => {
  visionClient = new vision.ImageAnnotatorClient()
})

const MONTHLY_OCR_LIMIT = 900
const MONTHLY_TRANSLATION_LIMIT = 300
const DAILY_TRANSLATION_LIMIT = 20
const MAX_IMAGE_BYTES = 7 * 1024 * 1024
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES / 3) * 4
const MAX_SOURCE_TEXT_LENGTH = 12_000
const TRANSLATION_MODEL = 'gpt-5.6-luna'

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

async function reserveTranslationUsage(uid) {
  const month = getCurrentMonth()
  const day = new Date().toISOString().slice(0, 10)
  const monthlyRef = db.collection('openAiUsage').doc(month)
  const dailyRef = monthlyRef.collection('dailyUsers').doc(`${uid}_${day}`)

  return db.runTransaction(async (transaction) => {
    const [monthlySnapshot, dailySnapshot] = await Promise.all([
      transaction.get(monthlyRef),
      transaction.get(dailyRef),
    ])
    const monthlyCount = monthlySnapshot.exists ? monthlySnapshot.data().count ?? 0 : 0
    const dailyCount = dailySnapshot.exists ? dailySnapshot.data().count ?? 0 : 0

    if (monthlyCount >= MONTHLY_TRANSLATION_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        '이번 달 쉬운말 번역 사용량을 모두 사용했어요.',
      )
    }

    if (dailyCount >= DAILY_TRANSLATION_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        '오늘 사용할 수 있는 쉬운말 번역 횟수를 모두 사용했어요.',
      )
    }

    transaction.set(monthlyRef, {
      count: monthlyCount + 1,
      limit: MONTHLY_TRANSLATION_LIMIT,
      updatedAt: new Date(),
    }, { merge: true })
    transaction.set(dailyRef, {
      count: dailyCount + 1,
      limit: DAILY_TRANSLATION_LIMIT,
      updatedAt: new Date(),
    }, { merge: true })

    return MONTHLY_TRANSLATION_LIMIT - monthlyCount - 1
  })
}

function validateTranslationRequest(data) {
  const sourceText = typeof data?.sourceText === 'string'
    ? data.sourceText
        .trim()
        .replace(/\r\n?/g, '\n')
        .replace(/[^\S\n]+/g, ' ')
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

async function requireLinkedUser(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인한 사용자만 이용할 수 있어요.')
  }

  if (request.auth.token.firebase?.sign_in_provider !== 'anonymous') return

  const link = await db.collection('deviceLinks').doc(request.auth.uid).get()

  if (!link.exists) {
    throw new HttpsError('permission-denied', '보호자와 연결된 기기에서 이용해 주세요.')
  }
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

export const simplifyDocumentText = onCall(
  {
    region: 'asia-northeast3',
    memory: '512MiB',
    timeoutSeconds: 120,
    minInstances: 0,
    maxInstances: 2,
    concurrency: 10,
    secrets: [openAiApiKey],
  },
  async (request) => {
    await requireLinkedUser(request)
    const { sourceText, easyLanguageLevel, sentenceLength } = validateTranslationRequest(
      request.data,
    )
    const remaining = process.env.FUNCTIONS_EMULATOR === 'true'
      ? null
      : await reserveTranslationUsage(request.auth.uid)
    const openai = new OpenAI({ apiKey: openAiApiKey.value() })
    const prompt = getTranslationPrompt(sourceText, easyLanguageLevel, sentenceLength)

    try {
      const response = await openai.responses.create({
        model: TRANSLATION_MODEL,
        store: false,
        max_output_tokens: 1200,
        reasoning: { effort: 'none' },
        prompt_cache_options: { mode: 'explicit' },
        safety_identifier: createHash('sha256')
          .update(`easy-language:${request.auth.uid}`)
          .digest('hex'),
        input: [
          {
            role: 'developer',
            content: [{
              type: 'input_text',
              text: prompt.staticInstructions,
            }],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt.requestText }],
          },
        ],
        text: {
          verbosity: 'low',
          format: {
            type: 'json_schema',
            name: 'easy_language_translation',
            strict: true,
            schema: translationSchema,
          },
        },
      })

      if (response.status !== 'completed' || !response.output_text) {
        throw new Error(`OpenAI response status: ${response.status}`)
      }

      const parsed = JSON.parse(response.output_text)
      const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : ''
      const sentences = Array.isArray(parsed.sentences)
        ? parsed.sentences.map((sentence) => String(sentence).trim()).filter(Boolean)
        : []
      const criticalSentenceNumbers = Array.isArray(parsed.criticalSentenceNumbers)
        ? parsed.criticalSentenceNumbers.filter(Number.isInteger)
        : []
      const criticalPoints = [...new Set(criticalSentenceNumbers)]
        .map((number) => sentences[number - 1])
        .filter(Boolean)
      const uncertainParts = Array.isArray(parsed.uncertainParts)
        ? parsed.uncertainParts.map((part) => String(part).trim()).filter(Boolean)
        : []

      if (!summary || sentences.length === 0) {
        throw new Error('OpenAI returned no easy-language sentences')
      }

      const missingCriticalFacts = findMissingCriticalFacts(
        sourceText,
        `${summary}\n${sentences.join('\n')}`,
      )

      logger.info('OpenAI easy-language token usage', {
        inputTokens: response.usage?.input_tokens ?? null,
        cachedTokens: response.usage?.input_tokens_details?.cached_tokens ?? null,
        cacheWriteTokens: response.usage?.input_tokens_details?.cache_write_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        reasoningTokens: response.usage?.output_tokens_details?.reasoning_tokens ?? null,
        missingCriticalFactTypes: missingCriticalFacts.map(({ kind }) => kind),
      })

      return {
        summary,
        sentences: sentences.slice(0, 60),
        criticalPoints: criticalPoints.slice(0, 20),
        uncertainParts: uncertainParts.slice(0, 20),
        missingCriticalFacts: missingCriticalFacts.slice(0, 20),
        remaining,
      }
    } catch (error) {
      logger.error('OpenAI easy-language translation failed', {
        status: error?.status ?? 'unknown',
        type: error?.type ?? 'unknown',
      })

      if (error?.status === 401) {
        throw new HttpsError(
          'failed-precondition',
          '쉬운말 번역 설정을 확인해 주세요.',
        )
      }

      if (error?.status === 429) {
        throw new HttpsError(
          'resource-exhausted',
          '번역 요청이 많아요. 잠시 후 다시 시도해 주세요.',
        )
      }

      throw new HttpsError(
        'internal',
        '쉬운말로 바꾸는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  },
)
