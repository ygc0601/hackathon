import { readFileSync } from 'node:fs'
import OpenAI from 'openai'
import {
  getTranslationPrompt,
  translationSchema,
} from '../src/easyLanguagePrompt.js'

const secretLine = readFileSync(new URL('../.secret.local', import.meta.url), 'utf8').trim()
const apiKey = secretLine.startsWith('OPENAI_API_KEY=')
  ? secretLine.slice('OPENAI_API_KEY='.length)
  : ''

if (!apiKey.startsWith('sk-')) {
  throw new Error('Run npm run secret:local before evaluating the prompt.')
}

const evaluationCases = [
  {
    name: '건강검진 안내문',
    source: [
      '건강검진 안내',
      '수검자는 2026년 8월 20일 오전 9시까지 한빛병원 2층으로 오십시오.',
      '검사 전날 오후 10시부터 물을 제외한 음식물을 섭취하지 마십시오.',
      '문의: 02-1234-5678',
    ].join('\n'),
    requiredFacts: [
      '2026년 8월 20일',
      '오전 9시',
      '한빛병원 2층',
      '오후 10시',
      '02-1234-5678',
    ],
    requiredMeanings: [
      ['물을 제외한', '물은 마셔도', '물만 마실 수'],
    ],
    forbiddenWords: ['수검자', '섭취', '않기예요'],
  },
  {
    name: '보험 전문용어 안내문',
    source: '계약자 또는 피보험자는 청약서에서 질문한 사항에 대해 반드시 사실대로 알려야 하며, 이를 위반할 경우 보험회사는 계약해지 또는 보장제한이 가능합니다.',
    requiredFacts: ['보험회사'],
    requiredMeanings: [
      ['진짜 있었던 일', '사실대로'],
      ['계약을 끝낼', '계약이 끝날'],
      [
        '도와주는 것을 줄일',
        '받는 도움을 줄일',
        '보험회사가 주는 도움을 줄일',
        '보험금을 줄일',
      ],
    ],
    forbiddenWords: [
      '계약자',
      '피보험자',
      '청약서',
      '위반',
      '계약해지',
      '보장제한',
      '제한',
      '신청서',
      '이를',
    ],
  },
]

const openai = new OpenAI({ apiKey })
const reports = []

for (const evaluationCase of evaluationCases) {
  const prompt = getTranslationPrompt(evaluationCase.source, 'basic', 'short')
  const response = await openai.responses.create({
    model: 'gpt-5.6-luna',
    store: false,
    max_output_tokens: 1200,
    reasoning: { effort: 'none' },
    prompt_cache_options: { mode: 'explicit' },
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
    throw new Error(`Evaluation failed with response status: ${response.status}`)
  }

  const result = JSON.parse(response.output_text)
  const criticalPoints = [...new Set(result.criticalSentenceNumbers)]
    .map((number) => result.sentences[number - 1])
    .filter(Boolean)
  const translatedText = [
    result.summary,
    ...result.sentences,
    ...criticalPoints,
  ].join(' ')
  const missingFacts = evaluationCase.requiredFacts.filter(
    (fact) => !translatedText.includes(fact),
  )
  const missingMeanings = evaluationCase.requiredMeanings.filter(
    (alternatives) => !alternatives.some((phrase) => translatedText.includes(phrase)),
  )
  const remainingDifficultWords = evaluationCase.forbiddenWords.filter(
    (word) => translatedText.includes(word),
  )
  const longSentences = result.sentences.filter(
    (sentence) => sentence.trim().split(/\s+/).length > 12,
  )
  const joinedSentences = result.sentences.filter(
    (sentence) => /(?:고|하며|하고)(?:\s|,)/.test(sentence),
  )
  const duplicateSentences = result.sentences.filter(
    (sentence, index, sentences) => sentences.indexOf(sentence) !== index,
  )
  const passed = missingFacts.length === 0
    && missingMeanings.length === 0
    && remainingDifficultWords.length === 0
    && longSentences.length === 0
    && joinedSentences.length === 0
    && duplicateSentences.length === 0
    && result.uncertainParts.length === 0

  reports.push({
    case: evaluationCase.name,
    passed,
    usage: response.usage,
    missingFacts,
    missingMeanings,
    remainingDifficultWords,
    longSentences,
    joinedSentences,
    duplicateSentences,
    result,
  })
}

console.log(JSON.stringify(reports, null, 2))

if (reports.some((report) => !report.passed)) process.exitCode = 1
