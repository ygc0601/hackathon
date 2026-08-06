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
import { claimPairingCode } from '../services/pairing.js'
import AuthState from './authState.js'

function getAuthErrorMessage(error) {
  const messages = {
    'auth/admin-restricted-operation': 'Firebase 콘솔에서 익명 로그인을 먼저 켜 주세요.',
    'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 주세요.',
    'auth/invalid-credential': '이메일이나 비밀번호가 맞지 않아요.',
    'auth/invalid-email': '이메일 주소를 다시 확인해 주세요.',
    'auth/network-request-failed': '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
    'auth/operation-not-allowed': 'Firebase 콘솔에서 이 로그인 방법을 먼저 켜 주세요.',
    'auth/too-many-requests': '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.',
    'auth/weak-password': '비밀번호는 6자 이상 입력해 주세요.',
  }

  return messages[error.code] ?? '로그인 처리 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.'
}

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

        try {
          if (auth.currentUser && !auth.currentUser.isAnonymous) {
            await signOut(auth)
          }

          const credential = auth.currentUser?.isAnonymous
            ? { user: auth.currentUser }
            : await signInAnonymously(auth)

          const link = await claimPairingCode(db, credential.user.uid, code)
          setDeviceLink(link)
          return { nextPath: '/participant' }
        } catch (error) {
          if (error.message?.startsWith('연결 코드')) {
            throw error
          }

          if (error.message?.startsWith('이미 사용한')) {
            throw error
          }

          throw new Error(getAuthErrorMessage(error))
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

        if (auth.currentUser.isAnonymous) {
          await deleteDoc(doc(db, 'deviceLinks', auth.currentUser.uid))
        }

        await signOut(auth)
      },
      logout: async () => {
        if (!auth) {
          return
        }

        await signOut(auth)
      },
    }),
    [accountType, deviceLink, loading, settingsOwnerId, user],
  )

  return <AuthState.Provider value={value}>{children}</AuthState.Provider>
}

export { AuthProvider }
