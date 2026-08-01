import { useContext } from 'react'
import AuthState from '../contexts/authState.js'

function useAuth() {
  const context = useContext(AuthState)

  if (!context) {
    throw new Error('useAuth는 AuthProvider 안에서 사용해야 해요.')
  }

  return context
}

export default useAuth
