import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const rules = readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8')

test('accessibility rules match the current settings schema', () => {
  assert.doesNotMatch(rules, /showPictograms/)

  for (const field of [
    'easyLanguageLevel',
    'sentenceLength',
    'fontSize',
    'speechRate',
    'highContrast',
  ]) {
    assert.match(rules, new RegExp(`'${field}'`))
  }
})
