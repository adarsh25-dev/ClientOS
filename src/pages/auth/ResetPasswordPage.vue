<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const toast = useToast()

// Refs
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)
const isLoaded = ref(false)

const handleReset = async () => {
  error.value = ''
  
  if (!password.value || password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }
  
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    const { error: resetErr } = await supabase.auth.updateUser({
      password: password.value
    })
    
    if (resetErr) throw resetErr
    
    success.value = true
    toast.success('Password reset successfully')
    
    // Sign out to clean up recovery session and force fresh login
    await supabase.auth.signOut()
  } catch (err) {
    error.value = err.message || 'Failed to reset password. Please try again.'
    toast.error('Reset failed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div :class="['min-h-screen bg-[#0A0A0F] text-[#F0EDE6] antialiased flex items-center justify-center p-6 selection:bg-[#C9A84C]/20 selection:text-[#C9A84C]', { 'is-loaded': isLoaded }]">
    
    <!-- Background subtle lights -->
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="w-full max-w-[420px] bg-[#0D0D14] border border-[#1E2030] rounded-sm p-8 md:p-10 relative overflow-hidden anim-fade-up shadow-2xl">
      <!-- Logo header -->
      <div class="flex items-center gap-2 text-[#C9A84C] mb-8 justify-center">
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">widgets</span>
        <span class="font-display text-lg font-bold tracking-tight">ClientOS</span>
      </div>

      <!-- Header title -->
      <div class="text-center mb-8">
        <h2 class="font-display text-xl text-[#F0EDE6] font-bold mb-1.5">
          {{ success ? 'Credentials Updated' : 'Reset Password' }}
        </h2>
        <p class="font-body text-xs text-[#A0A0B0]">
          {{ success ? 'Your new password is now active.' : 'Enter your new credentials below to secure your account.' }}
        </p>
      </div>

      <!-- Error Notice -->
      <div v-if="error" class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-sm text-xs text-left mb-6">
        {{ error }}
      </div>

      <!-- Success State -->
      <div v-if="success" class="flex flex-col gap-6 w-full text-center">
        <p class="font-body text-xs text-[#A0A0B0] leading-relaxed">
          Your password has been changed successfully. You can now log back into your ClientOS workspace with your new credentials.
        </p>
        <button
          type="button"
          @click="router.push('/login')"
          class="w-full bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-4 rounded-sm transition-colors flex items-center justify-center gap-2 group font-semibold"
        >
          Go to Login
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      <!-- Reset Form -->
      <form v-else class="flex flex-col gap-6" @submit.prevent="handleReset">
        <!-- New Password -->
        <div class="input-focus-border relative">
          <input
            v-model="password"
            type="password"
            placeholder="New password"
            class="w-full bg-transparent border-0 border-b border-[#1E2030] pb-3 font-body text-sm text-[#F0EDE6] placeholder-[#5A5A6A] focus:ring-0 px-0 transition-colors input-minimal"
            required
          />
        </div>

        <!-- Confirm Password -->
        <div class="input-focus-border relative mb-2">
          <input
            v-model="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            class="w-full bg-transparent border-0 border-b border-[#1E2030] pb-3 font-body text-sm text-[#F0EDE6] placeholder-[#5A5A6A] focus:ring-0 px-0 transition-colors input-minimal"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-4 rounded-sm transition-all flex items-center justify-center gap-2 group disabled:opacity-50 font-semibold"
        >
          <template v-if="loading">
            <span class="flex gap-1">
              <span class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce"></span>
              <span class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span class="w-1.5 h-1.5 bg-[#0A0A0F] rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </span>
          </template>
          <template v-else>
            Update Password
            <span class="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">lock_open</span>
          </template>
        </button>

        <button
          type="button"
          @click="router.push('/login')"
          class="w-full border border-[#1E2030] hover:bg-custom-hover text-[#F0EDE6] font-button text-xs uppercase tracking-widest py-4 rounded-sm transition-colors flex items-center justify-center gap-2"
        >
          Cancel
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.anim-fade-up { 
  transform: translateY(20px); 
  opacity: 0; 
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); 
}
.is-loaded .anim-fade-up { 
  transform: translateY(0); 
  opacity: 1; 
}

.input-focus-border::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 1px;
  background-color: #C9A84C;
  transition: width 0.4s ease;
}
.input-focus-border:focus-within::after {
  width: 100%;
}

.input-minimal {
  background: transparent;
  border: none;
  border-bottom: 1px solid #1E2030;
  border-radius: 0;
  transition: border-color 0.3s ease;
}
.input-minimal:focus {
  outline: none;
  border-bottom-color: #C9A84C;
  box-shadow: none;
}
</style>
