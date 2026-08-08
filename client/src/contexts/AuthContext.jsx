import { useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config.js'
import { getAuthErrorMessage, getSessionErrorMessage } from '../services/authErrors.js'
import { claimPairingCode, normalizePairingCode } from '../services/pairing.js'
import AuthState from './authState.js'

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [deviceLink, setDeviceLink] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [linkLoading, setLinkLoading] = useState(false)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setAuthLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)
        setAuthLoading(false)
      },
      () => {
        setUser(null)
        setAuthLoading(false)
      },
    )

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!user?.isAnonymous || !db) {
      setDeviceLink(null)
      setLinkLoading(false)
      return undefined
    }

    setLinkLoading(true)

    return onSnapshot(
      doc(db, 'deviceLinks', user.uid),
      (snapshot) => {
        setDeviceLink(snapshot.exists() ? snapshot.data() : null)
        setLinkLoading(false)
      },
      () => {
        setDeviceLink(null)
        setLinkLoading(false)
      },
    )
  }, [user])

  const accountType = user
    ? user.isAnonymous
      ? deviceLink
        ? 'participant'
        : 'unpaired'
      : 'guardian'
    : null
  const loading = authLoading || Boolean(user?.isAnonymous && linkLoading)
  const settingsOwnerId = accountType === 'guardian' ? user.uid : deviceLink?.guardianUid ?? null

  const value = useMemo(
    () => ({
      user,
      accountType,
      deviceLink,
      loading,
      settingsOwnerId,
      isFirebaseConfigured,
      login: async (email, password) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        try {
          const credential = await signInWithEmailAndPassword(auth, email, password)
          return { credential, nextPath: '/guardian' }
        } catch (error) {
          throw new Error(getAuthErrorMessage(error))
        }
      },
      signup: async (email, password) => {
        if (!auth || !db) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        try {
          const credential = await createUserWithEmailAndPassword(auth, email, password)
          const profileData = {
            email,
            accountType: 'guardian',
            createdAt: new Date().toISOString(),
          }

          try {
            await setDoc(doc(db, 'userProfiles', credential.user.uid), profileData)
          } catch {
            // The profile is optional for sign-in and can be recreated later.
          }

          try {
            await sendEmailVerification(credential.user)
          } catch {
            // Email verification can be retried later without blocking account creation.
          }

          return { credential, nextPath: '/guardian' }
        } catch (error) {
          throw new Error(getAuthErrorMessage(error))
        }
      },
      connectParticipant: async (code) => {
        if (!auth || !db) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        const normalizedCode = normalizePairingCode(code)

        if (normalizedCode.length !== 8) {
          throw new Error('연결 코드 8자리를 확인해 주세요.')
        }

        try {
          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            await signOut(auth)
          }

          const credential = auth.currentUser?.isAnonymous
            ? { user: auth.currentUser }
            : await signInAnonymously(auth)

          const link = await claimPairingCode(db, credential.user.uid, normalizedCode)
          setDeviceLink(link)
          return { nextPath: '/participant' }
        } catch (error) {
          if (error.message?.startsWith('연결 코드')) {
            throw error
          }

          if (error.message?.startsWith('이미 사용한')) {
            throw error
          }

          throw new Error(getSessionErrorMessage(error, getAuthErrorMessage(error)))
        }
      },
      resetPassword: async (email) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        try {
          await sendPasswordResetEmail(auth, email)
        } catch (error) {
          throw new Error(getAuthErrorMessage(error))
        }
      },
      disconnectParticipant: async () => {
        if (!auth?.currentUser || !db) {
          return
        }

        try {
          if (auth.currentUser.isAnonymous) {
            await deleteDoc(doc(db, 'deviceLinks', auth.currentUser.uid))
          }

          await signOut(auth)
        } catch (error) {
          throw new Error(getSessionErrorMessage(
            error,
            '기기 연결을 해제하지 못했어요. 잠시 후 다시 시도해 주세요.',
          ))
        }
      },
      logout: async () => {
        if (!auth) {
          return
        }

        try {
          await signOut(auth)
        } catch (error) {
          throw new Error(getSessionErrorMessage(
            error,
            '로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.',
          ))
        }
      },
    }),
    [accountType, deviceLink, loading, settingsOwnerId, user],
  )

  return <AuthState.Provider value={value}>{children}</AuthState.Provider>
}

export { AuthProvider }
