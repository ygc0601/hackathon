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
import {
  calculateConfidence,
  decodeJpeg,
  validateTranslationRequest,
} from './requestValidation.js'

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
const TRANSLATION_MODEL = 'gpt-5.6-luna'

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
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

async function requireLinkedUser(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', '로그인한 사용자만 이용할 수 있어요.')
  }

  if (request.auth.token?.firebase?.sign_in_provider !== 'anonymous') return

  const link = await db.collection('deviceLinks').doc(request.auth.uid).get()

  if (!link.exists) {
    throw new HttpsError('permission-denied', '보호자와 연결된 기기에서 이용해 주세요.')
  }
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
    await requireLinkedUser(request)
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

      if (error?.code === 8 || error?.code === 'RESOURCE_EXHAUSTED') {
        throw new HttpsError('resource-exhausted', 'OCR 사용량을 모두 사용했어요.')
      }

      if (error?.code === 7 || error?.code === 'PERMISSION_DENIED') {
        throw new HttpsError('failed-precondition', 'OCR 서버 설정을 확인해 주세요.')
      }

      if (error?.code === 14 || error?.code === 'UNAVAILABLE') {
        throw new HttpsError('unavailable', 'OCR 서버에 잠시 연결할 수 없어요.')
      }

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
    const apiKey = openAiApiKey.value()

    if (!apiKey) {
      throw new HttpsError('failed-precondition', '쉬운말 번역 설정을 확인해 주세요.')
    }

    const remaining = process.env.FUNCTIONS_EMULATOR === 'true'
      ? null
      : await reserveTranslationUsage(request.auth.uid)
    const openai = new OpenAI({ apiKey })
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
        if (response.incomplete_details?.reason === 'max_output_tokens') {
          throw new HttpsError(
            'failed-precondition',
            '문서 내용이 너무 길어요. 더 짧은 문서로 다시 시도해 주세요.',
          )
        }

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

      if (error instanceof HttpsError) throw error

      if (error?.status === 401 || error?.status === 403) {
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

      if (
        error?.status === 408
        || error?.status >= 500
        || error?.name === 'APIConnectionError'
      ) {
        throw new HttpsError(
          'unavailable',
          '쉬운말 번역 서버에 잠시 연결할 수 없어요.',
        )
      }

      throw new HttpsError(
        'internal',
        '쉬운말로 바꾸는 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.',
      )
    }
  },
)
