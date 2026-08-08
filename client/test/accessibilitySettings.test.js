import assert from 'node:assert/strict'
import test from 'node:test'
import DEFAULT_SETTINGS, {
  normalizeAccessibilitySettings,
} from '../src/contexts/accessibilityDefaults.js'

test('uses safe defaults for missing or malformed settings', () => {
  assert.deepEqual(normalizeAccessibilitySettings(), DEFAULT_SETTINGS)
  assert.deepEqual(normalizeAccessibilitySettings(null), DEFAULT_SETTINGS)
  assert.deepEqual(normalizeAccessibilitySettings({
    easyLanguageLevel: 'advanced',
    sentenceLength: 'long',
    fontSize: 'small',
    speechRate: 'fast',
    highContrast: 'true',
  }), DEFAULT_SETTINGS)
})

test('keeps supported accessibility settings and drops unknown fields', () => {
  assert.deepEqual(normalizeAccessibilitySettings({
    easyLanguageLevel: 'standard',
    sentenceLength: 'medium',
    fontSize: 'extraLarge',
    speechRate: '0.7',
    highContrast: true,
    removedSetting: true,
  }), {
    easyLanguageLevel: 'standard',
    sentenceLength: 'medium',
    fontSize: 'extraLarge',
    speechRate: 0.7,
    highContrast: true,
  })
})

test('clamps and rounds speech speed to the supported range', () => {
  assert.equal(normalizeAccessibilitySettings({ speechRate: 0.1 }).speechRate, 0.5)
  assert.equal(normalizeAccessibilitySettings({ speechRate: 0.86 }).speechRate, 0.9)
  assert.equal(normalizeAccessibilitySettings({ speechRate: 4 }).speechRate, 1)
})
