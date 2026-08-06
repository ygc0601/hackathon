import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'
import useAuth from '../hooks/useAuth.js'
import DEFAULT_SETTINGS from './accessibilityDefaults.js'
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
      const savedSettings = window.localStorage.getItem(STORAGE_KEY)

      if (savedSettings) {
        try {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) })
        } catch {
          window.localStorage.removeItem(STORAGE_KEY)
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
          setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
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
    const normalizedSettings = {
      ...DEFAULT_SETTINGS,
      ...nextSettings,
      speechRate: Number(nextSettings.speechRate),
    }

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
          { merge: true },
        )
      } else if (!isFirebaseConfigured) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings))
      } else {
        throw new Error('보호자 로그인이 필요해요.')
      }

      setSettings(normalizedSettings)
    } catch {
      setError('설정을 저장하지 못했어요. 인터넷 연결을 확인해 주세요.')
      throw new Error('설정 저장 실패')
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
