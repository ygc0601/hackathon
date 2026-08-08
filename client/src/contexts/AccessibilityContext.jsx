import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'
import useAuth from '../hooks/useAuth.js'
import DEFAULT_SETTINGS, {
  normalizeAccessibilitySettings,
} from './accessibilityDefaults.js'
import AccessibilityState from './accessibilityState.js'

const STORAGE_KEY = 'together-reading-accessibility-settings'
const PARTICIPANT_RETRY_DELAYS = [400, 900, 1800]

function AccessibilityProvider({ children }) {
  const { accountType, settingsOwnerId } = useAuth()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')

    if (!isFirebaseConfigured) {
      try {
        const savedSettings = window.localStorage.getItem(STORAGE_KEY)

        if (savedSettings) {
          setSettings(normalizeAccessibilitySettings(JSON.parse(savedSettings)))
        }
      } catch {
        setSettings(DEFAULT_SETTINGS)

        try {
          window.localStorage.removeItem(STORAGE_KEY)
        } catch {
          // Storage can be unavailable in privacy-restricted browsers.
        }
      }

      setLoading(false)
      return undefined
    }

    if (!settingsOwnerId || !db) {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
      return undefined
    }

    const settingsRef = doc(db, 'accessibilityProfiles', settingsOwnerId)
    let unsubscribe
    let retryTimer
    let retryCount = 0
    let cancelled = false

    const subscribe = () => {
      setLoading(true)
      unsubscribe = onSnapshot(
        settingsRef,
        (snapshot) => {
          const savedSettings = snapshot.exists() ? snapshot.data() : {}
          setSettings(normalizeAccessibilitySettings(savedSettings))
          setError('')
          setLoading(false)
        },
        (snapshotError) => {
          const shouldRetry =
            !cancelled
            && accountType === 'participant'
            && snapshotError.code === 'permission-denied'
            && retryCount < PARTICIPANT_RETRY_DELAYS.length

          if (shouldRetry) {
            const delay = PARTICIPANT_RETRY_DELAYS[retryCount]
            retryCount += 1
            retryTimer = window.setTimeout(subscribe, delay)
            return
          }

          setError('설정을 불러오지 못했어요. 연결을 확인한 뒤 다시 시도해 주세요.')
          setLoading(false)
        },
      )
    }

    subscribe()

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      unsubscribe?.()
    }
  }, [accountType, settingsOwnerId])

  const saveSettings = async (nextSettings) => {
    const normalizedSettings = normalizeAccessibilitySettings(nextSettings)

    setSaving(true)
    setError('')

    try {
      if (isFirebaseConfigured && db) {
        if (accountType !== 'guardian' || !settingsOwnerId) {
          throw new Error('당사자 기기에서는 설정을 바꿀 수 없어요.')
        }

        await setDoc(
          doc(db, 'accessibilityProfiles', settingsOwnerId),
          { ...normalizedSettings, updatedAt: serverTimestamp() },
        )
      } else if (!isFirebaseConfigured) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings))
      } else {
        throw new Error('보호자 로그인이 필요해요.')
      }

      setSettings(normalizedSettings)
    } catch (saveError) {
      const message = saveError?.code === 'permission-denied'
        ? '이 계정에서는 설정을 저장할 수 없어요. 다시 로그인해 주세요.'
        : '설정을 저장하지 못했어요. 인터넷 연결을 확인해 주세요.'

      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AccessibilityState.Provider
      value={{ settings, loading, saving, error, saveSettings }}
    >
      {children}
    </AccessibilityState.Provider>
  )
}

export { AccessibilityProvider }
