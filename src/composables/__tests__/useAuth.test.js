import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../../stores/auth'

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn(),
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: { id: 'user-123', full_name: 'Adarsh Parmar', portal_slug: 'adarsh' }, error: null }))
          }))
        }))
      }))
    }
  }
})

import { supabase } from '../../lib/supabase'

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('isAuthenticated returns false when user is null', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
  })

  it('signIn with valid credentials sets user and profile', async () => {
    const store = useAuthStore()
    
    // Setup mock supabase return values
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@example.com' } },
      error: null
    })

    await store.signIn({ email: 'test@example.com', password: 'password123' })

    expect(store.user).not.toBeNull()
    expect(store.user.id).toBe('user-123')
    expect(store.error).toBeNull()
  })

  it('signIn with invalid credentials sets error message', async () => {
    const store = useAuthStore()
    
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid login credentials')
    })

    try {
      await store.signIn({ email: 'test@example.com', password: 'wrong' })
    } catch (err) {
      // Expected error
    }

    expect(store.user).toBeNull()
    expect(store.error).toBe('Incorrect email or password. Please try again.')
  })

  it('signOut clears user and profile', async () => {
    const store = useAuthStore()
    store.user = { id: 'user-123' }
    store.profile = { id: 'user-123', full_name: 'Adarsh' }

    supabase.auth.signOut.mockResolvedValue({ error: null })

    await store.signOut()

    expect(store.user).toBeNull()
    expect(store.profile).toBeNull()
  })
})
