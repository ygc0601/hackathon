import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isFirebaseConfigured,
      login: async (email, password) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        return signInWithEmailAndPassword(auth, email, password)
      },
      signup: async (email, password) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        return createUserWithEmailAndPassword(auth, email, password)
      },
      logout: async () => {
        if (!auth) {
          return
        }

        await signOut(auth)
      },
    }),
    [loading, user],
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
