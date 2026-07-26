import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../firebase/config.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser)

      if (!nextUser || !db) {
        setProfile(null)
        setActiveRole(null)
        setLoading(false)
        return
      }

      const profileRef = doc(db, 'userProfiles', nextUser.uid)
      const snapshot = await getDoc(profileRef)
      const nextProfile = snapshot.exists() ? snapshot.data() : null

      setProfile(nextProfile)

      if (!nextProfile?.roles?.length) {
        setActiveRole(null)
      } else if (nextProfile.roles.length === 1) {
        setActiveRole(nextProfile.roles[0])
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const getNextPath = (roles) => {
    if (!roles?.length) {
      return '/login'
    }

    if (roles.length > 1) {
      return '/role-select'
    }

    return roles[0] === 'guardian' ? '/guardian' : '/participant'
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      activeRole,
      loading,
      isFirebaseConfigured,
      setActiveRole,
      getNextPath,
      login: async (email, password) => {
        if (!auth) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        const credential = await signInWithEmailAndPassword(auth, email, password)
        const profileRef = doc(db, 'userProfiles', credential.user.uid)
        const snapshot = await getDoc(profileRef)
        const roles = snapshot.exists() ? snapshot.data().roles ?? [] : []

        return { credential, roles, nextPath: getNextPath(roles) }
      },
      signup: async (email, password, roles) => {
        if (!auth || !db) {
          throw new Error('Firebase 설정이 아직 연결되지 않았어요.')
        }

        const cleanRoles = Array.from(new Set(roles))

        if (!cleanRoles.length) {
          throw new Error('최소 한 개의 역할을 선택해 주세요.')
        }

        const credential = await createUserWithEmailAndPassword(auth, email, password)
        const profileData = {
          email,
          roles: cleanRoles,
          linkedGuardianIds: [],
          linkedParticipantIds: [],
          createdAt: new Date().toISOString(),
        }

        await setDoc(doc(db, 'userProfiles', credential.user.uid), profileData)
        setProfile(profileData)
        setActiveRole(cleanRoles.length === 1 ? cleanRoles[0] : null)

        return { credential, roles: cleanRoles, nextPath: getNextPath(cleanRoles) }
      },
      logout: async () => {
        if (!auth) {
          return
        }

        await signOut(auth)
      },
    }),
    [activeRole, loading, profile, user],
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
