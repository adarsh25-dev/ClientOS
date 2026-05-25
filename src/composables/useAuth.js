import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const store = useAuthStore()
  const { user, profile, loading, error, isAuthenticated, isOnboarded, displayName } = storeToRefs(store)

  return {
    // State (refs)
    user,
    profile,
    loading,
    error,
    isAuthenticated,
    isOnboarded,
    displayName,

    // Actions
    signIn: store.signIn,
    signUp: store.signUp,
    signOut: store.signOut,
    signInWithGoogle: store.signInWithGoogle,
    sendPasswordResetEmail: store.sendPasswordResetEmail,
    fetchProfile: store.fetchProfile
  }
}
