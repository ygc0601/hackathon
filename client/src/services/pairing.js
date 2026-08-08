import {
  Timestamp,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
const CODE_LENGTH = 8
const PAIRING_DURATION_MS = 10 * 60 * 1000

function createRandomCode() {
  const values = new Uint32Array(CODE_LENGTH)
  crypto.getRandomValues(values)

  return Array.from(values, (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join('')
}

export function normalizePairingCode(value) {
  return String(value ?? '').toUpperCase().replace(/[^2-9A-HJ-NP-Z]/g, '')
}

export function formatPairingCode(value) {
  const normalized = normalizePairingCode(value)
  return normalized.length > 4
    ? `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`
    : normalized
}

export async function createPairingCode(db, guardianUid) {
  const code = createRandomCode()
  const expiresAt = Timestamp.fromMillis(Date.now() + PAIRING_DURATION_MS)

  await setDoc(doc(db, 'pairingCodes', code), {
    guardianUid,
    status: 'active',
    createdAt: serverTimestamp(),
    expiresAt,
  })

  return { code, expiresAt: expiresAt.toDate() }
}

export async function claimPairingCode(db, participantUid, rawCode) {
  const code = normalizePairingCode(rawCode)

  if (code.length !== CODE_LENGTH) {
    throw new Error('연결 코드 8자리를 확인해 주세요.')
  }

  const pairingRef = doc(db, 'pairingCodes', code)

  return runTransaction(db, async (transaction) => {
    const pairingSnapshot = await transaction.get(pairingRef)

    if (!pairingSnapshot.exists()) {
      throw new Error('연결 코드를 찾지 못했어요. 보호자에게 새 코드를 받아 주세요.')
    }

    const pairing = pairingSnapshot.data()

    if (pairing.status !== 'active' || pairing.claimedBy) {
      throw new Error('이미 사용한 연결 코드예요. 보호자에게 새 코드를 받아 주세요.')
    }

    if (!pairing.expiresAt || pairing.expiresAt.toMillis() <= Date.now()) {
      throw new Error('연결 코드의 시간이 지났어요. 보호자에게 새 코드를 받아 주세요.')
    }

    transaction.update(pairingRef, {
      status: 'used',
      claimedBy: participantUid,
      claimedAt: serverTimestamp(),
    })
    transaction.set(doc(db, 'deviceLinks', participantUid), {
      guardianUid: pairing.guardianUid,
      pairingCode: code,
      connectedAt: serverTimestamp(),
    })

    return { guardianUid: pairing.guardianUid }
  })
}
