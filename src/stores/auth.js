import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    profile: null,
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isOnboarded: (state) => !!state.profile?.portal_slug,
    displayName: (state) => state.profile?.full_name || state.user?.email
  },

  actions: {
    async initialize() {
      this.loading = true
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        if (session) {
          this.user = session.user
          await this.fetchProfile(session.user.id)
        }

        // Setup auth state change listener
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session) {
            this.user = session.user
            await this.fetchProfile(session.user.id)
            if (event === 'PASSWORD_RECOVERY') {
              window.location.href = `${window.location.origin}/app/settings?tab=account`
            }
          } else {
            this.user = null
            this.profile = null
          }
        })
      } catch (err) {
        console.error('Auth initialization error:', err)
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async signUp({ email, password, fullName }) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        })
        if (error) throw error

        if (data.user) {
          this.user = data.user
          // Create profile record
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              plan: 'free',
              brand_color: '#C9A84C'
            })
          if (profileError) throw profileError
          await this.fetchProfile(data.user.id)
        }
      } catch (err) {
        this.error = this.mapErrorMessage(err)
        throw this.error
      } finally {
        this.loading = false
      }
    },

    async signIn({ email, password }) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error

        if (data.user) {
          this.user = data.user
          await this.fetchProfile(data.user.id)
        }
      } catch (err) {
        this.error = this.mapErrorMessage(err)
        throw this.error
      } finally {
        this.loading = false
      }
    },

    async signInWithGoogle() {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/app/dashboard`
          }
        })
        if (error) throw error
      } catch (err) {
        this.error = this.mapErrorMessage(err)
        throw this.error
      } finally {
        this.loading = false
      }
    },

    async sendPasswordResetEmail(email) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`
        })
        if (error) throw error
      } catch (err) {
        this.error = this.mapErrorMessage(err)
        throw this.error
      } finally {
        this.loading = false
      }
    },

    async signOut() {
      this.loading = true
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        this.user = null
        this.profile = null
      } catch (err) {
        console.error('Signout error:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchProfile(userId) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle()
          
        if (error) throw error
        
        if (!data) {
          // Profile doesn't exist (First time OAuth login)
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              full_name: this.user?.user_metadata?.full_name || '',
              plan: 'free',
              brand_color: '#C9A84C'
            })
            .select()
            .single()
            
          if (insertError) throw insertError
          this.profile = newProfile
        } else {
          this.profile = data
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    },

    mapErrorMessage(err) {
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        return 'Incorrect email or password. Please try again.'
      }
      if (msg.includes('Email not confirmed')) {
        return 'Please check your inbox and confirm your email first.'
      }
      if (msg.includes('network') || msg.includes('Failed to fetch')) {
        return 'Something went wrong. Please check your connection.'
      }
      return msg || 'An unexpected error occurred.'
    }
  }
})
