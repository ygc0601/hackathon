import { useContext } from 'react'
import AccessibilityState from '../contexts/accessibilityState.js'

function useAccessibility() {
  const context = useContext(AccessibilityState)

  if (!context) {
    throw new Error('useAccessibility는 AccessibilityProvider 안에서 사용해야 해요.')
  }

  return context
}

export default useAccessibility
