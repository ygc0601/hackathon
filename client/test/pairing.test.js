import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatPairingCode,
  normalizePairingCode,
} from '../src/services/pairing.js'

test('normalizes pairing codes and removes ambiguous characters', () => {
  assert.equal(normalizePairingCode('abcd-2345'), 'ABCD2345')
  assert.equal(normalizePairingCode('a0b1i-o2'), 'AB2')
  assert.equal(normalizePairingCode(null), '')
})

test('formats only the first eight valid pairing characters', () => {
  assert.equal(formatPairingCode('ABCD'), 'ABCD')
  assert.equal(formatPairingCode('ABCD2345EXTRA'), 'ABCD-2345')
})
