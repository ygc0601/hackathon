import { useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config.js'
import useAuth from '../hooks/useAuth.js'
import DEFAULT_SETTINGS from './accessibilityDefaults.js'
import AccessibilityState from './accessibilityState.js'

const STORAGE_KEY = 'together-reading-accessibility-settings'
function AccessibilityProvider({ children }) {
  const { user } = useAuth()
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

    if (!user || !db) {
      setSettings(DEFAULT_SETTINGS)
      setLoading(false)
      return undefined
    }

    setLoading(true)
    const settingsRef = doc(db, 'accessibilityProfiles', user.uid)

    return onSnapshot(
      settingsRef,
      (snapshot) => {
        const savedSettings = snapshot.exists() ? snapshot.data() : {}
        setSettings({ ...DEFAULT_SETTINGS, ...savedSettings })
        setLoading(false)
      },
      () => {
        setError('설정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
      },
    )
  }, [user])

  const saveSettings = async (nextSettings) => {
    const normalizedSettings = {
      ...DEFAULT_SETTINGS,
      ...nextSettings,
      speechRate: Number(nextSettings.speechRate),
    }

    setSaving(true)
    setError('')

    try {
      if (isFirebaseConfigured && user && db) {
        await setDoc(
          doc(db, 'accessibilityProfiles', user.uid),
          { ...normalizedSettings, updatedAt: serverTimestamp() },
          { merge: true },
        )
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedSettings))
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
