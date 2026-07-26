import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [activeMode, setActiveMode] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser)

        if (!nextUser) {
          setActiveMode(null)
        }

        setLoading(false)
      },
      () => {
        setUser(null)
        setActiveMode(null)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      activeMode,
      loading,
      isFirebaseConfigured,
      setActiveMode,
      login: async (email, password) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        const credential = await signInWithEmailAndPassword(auth, email, password)
        setActiveMode(null)
        return { credential, nextPath: '/role-select' }
      },
      signup: async (email, password) => {
        if (!auth || !db) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const profileData = {
          email,
          createdAt: new Date().toISOString(),
        }

        await setDoc(doc(db, 'userProfiles', credential.user.uid), profileData)
        setActiveMode(null)

        return { credential, nextPath: '/role-select' }
      },
      logout: async () => {
        if (!auth) {
          return
        }

        await signOut(auth)
      },
    }),
    [activeMode, loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 해요.')
  }

  return context
}

export { AuthProvider, useAuth }
