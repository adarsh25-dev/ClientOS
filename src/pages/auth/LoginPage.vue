<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

const { signIn, signInWithGoogle, sendPasswordResetEmail, loading, error } = useAuth()
const router = useRouter()

// Refs
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

const emailError = ref('')
const passwordError = ref('')
const formSubmitted = ref(false)
const isLoaded = ref(false)

// Reset password states
const isResetMode = ref(false)
const resetSent = ref(false)
const resetError = ref('')
const resetLoading = ref(false)

const validateForm = () => {
  let isValid = true
  emailError.value = ''
  passwordError.value = ''

  // Email Validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    emailError.value = 'Email is required'
    isValid = false
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    isValid = false
  }

  // Password Validation
  if (!password.value) {
    passwordError.value = 'Password is required'
    isValid = false
  } else if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  formSubmitted.value = true
  if (!validateForm()) return

  try {
    await signIn({
      email: email.value,
      password: password.value
    })
    router.push('/app/dashboard')
  } catch (err) {
    console.error('Login failed:', err)
  }
}

const handleResetPassword = async () => {
  emailError.value = ''
  resetError.value = ''
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email.value) {
    emailError.value = 'Email is required to reset password'
    return
  } else if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address'
    return
  }

  resetLoading.value = true
  try {
    await sendPasswordResetEmail(email.value)
    resetSent.value = true
  } catch (err) {
    resetError.value = err || 'Failed to send reset email. Please try again.'
  } finally {
    resetLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  try {
    await signInWithGoogle()
  } catch (err) {
    console.error('Google Sign in failed:', err)
  }
}

// Testimonials Rotation Logic
const testimonials = [
  { text: '"ClientOS elevated our pitch process entirely. The cinematic interface speaks for itself."', author: 'Sarah Jenkins — Creative Director' },
  { text: '"The attention to detail in the typography and spacing makes every proposal feel premium."', author: 'Marcus Vance — Managing Partner' },
  { text: '"A flawless intersection of robust functionality and uncompromising editorial design."', author: 'Elena Rostova — Founder' }
]

const currentTestimonialIndex = ref(0)

onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)

  setInterval(() => {
    currentTestimonialIndex.value = (currentTestimonialIndex.value + 1) % testimonials.length
  }, 4000)
})
</script>

<template>
  <div :class="['min-h-screen bg-surface text-on-surface antialiased flex flex-col md:flex-row overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container', { 'is-loaded': isLoaded }]">
    
    <!-- Mobile Header (Visible only on small screens) -->
    <div class="md:hidden w-full flex items-center justify-center py-margin-xs bg-surface-container-lowest border-b border-outline">
      <div class="flex items-center gap-2 text-primary">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">widgets</span>
        <span class="font-headline-sm text-body-lg font-bold tracking-tight">ClientOS</span>
      </div>
    </div>

    <!-- LEFT PANEL (40%) -->
    <div class="hidden md:flex flex-col justify-between w-[40%] h-screen bg-surface-container-lowest p-margin-desktop relative border-r border-outline anim-slide-right" id="left-panel">

      
      <!-- Logo -->
      <div class="flex items-center gap-3 text-primary z-10">
        <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">widgets</span>
        <span class="font-headline-sm text-[28px] font-bold tracking-tight">ClientOS</span>
      </div>

      <!-- Center Quote -->
      <div class="z-10 max-w-md">
        <h1 class="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight">
          Your best work deserves<br/>
          <span class="text-on-surface-variant">the right presentation.</span>
        </h1>
      </div>

      <!-- Rotating Testimonials -->
      <div class="z-10 h-[80px] relative w-full max-w-md overflow-hidden" id="testimonial-container">
        <Transition name="fade" mode="out-in">
          <div :key="currentTestimonialIndex" class="absolute inset-0">
            <p class="font-body-md text-body-md text-on-surface-variant italic mb-2">
              {{ testimonials[currentTestimonialIndex].text }}
            </p>
            <p class="font-label-sm text-label-sm text-primary uppercase">
              {{ testimonials[currentTestimonialIndex].author }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- RIGHT PANEL (60%) -->
    <div class="w-full md:w-[60%] flex-1 flex flex-col justify-center items-center p-margin-mobile md:p-margin-desktop bg-background relative anim-fade-in" id="right-panel" style="transition-delay: 400ms;">
      <div class="w-full max-w-[420px] flex flex-col gap-10">
        
        <!-- Header -->
        <div class="stagger-item anim-fade-up">
          <h2 class="font-headline-lg text-headline-lg text-on-surface mb-2">
            {{ isResetMode ? (resetSent ? 'Check your inbox' : 'Reset Password') : 'Welcome back' }}
          </h2>
          <p class="font-body-md text-body-md text-on-surface-variant">
            {{ isResetMode ? (resetSent ? `We've sent a recovery link to ${email}.` : 'Enter your email to receive a password reset link.') : 'Enter your details to access your workspace.' }}
          </p>
        </div>

        <!-- Custom Error Notification -->
        <div v-if="error || resetError" class="bg-error-container/10 border border-error-container/20 text-error p-4 rounded-sm text-sm text-left stagger-item anim-fade-up" style="transition-delay: 40ms;">
          {{ error || resetError }}
        </div>

        <!-- Success State -->
        <div v-if="isResetMode && resetSent" class="flex flex-col gap-6 w-full stagger-item anim-fade-up">
          <p class="font-body-md text-body-md text-on-surface-variant text-left leading-relaxed">
            Click the link in the email to sign in and choose a new password. If you don't receive it within a few minutes, check your spam folder.
          </p>
          <button
            type="button"
            @click="isResetMode = false; resetSent = false; email = ''"
            class="w-full bg-surface-bright hover:bg-surface-variant text-on-surface font-label-sm text-label-sm uppercase tracking-widest py-4 rounded-[2px] transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            Back to Login
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
        </div>

        <!-- Form -->
        <form v-else class="flex flex-col gap-8 w-full" @submit.prevent="isResetMode ? handleResetPassword() : handleSubmit()">
          <div class="flex flex-col gap-6">
            <!-- Email -->
            <div class="input-focus-border stagger-item anim-fade-up" style="transition-delay: 80ms;">
              <input
                v-model="email"
                type="email"
                placeholder="Email address"
                class="w-full bg-transparent border-0 border-b border-outline pb-3 font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant focus:ring-0 px-0 transition-colors input-minimal"
              />
              <span v-if="emailError && (formSubmitted || isResetMode)" class="text-xs text-error mt-1 block">{{ emailError }}</span>
            </div>

            <!-- Password -->
            <div v-if="!isResetMode" class="input-focus-border stagger-item anim-fade-up" style="transition-delay: 160ms;">
              <div class="relative w-full flex items-center">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Password"
                  class="w-full bg-transparent border-0 border-b border-outline pb-3 pr-10 font-body-lg text-body-lg text-on-surface placeholder-on-surface-variant focus:ring-0 px-0 transition-colors input-minimal"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-0 text-on-surface-variant hover:text-on-surface focus:outline-none pr-1 pb-3"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <span class="material-symbols-outlined text-[20px]">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
              <span v-if="passwordError && formSubmitted" class="text-xs text-error mt-1 block">{{ passwordError }}</span>
            </div>
          </div>

          <!-- Remember me / Forgot -->
          <div v-if="!isResetMode" class="flex items-center justify-between stagger-item anim-fade-up" style="transition-delay: 240ms;">
            <label class="flex items-center gap-3 cursor-pointer group">
              <div class="relative flex items-center justify-center w-5 h-5 border border-outline rounded-[2px] group-hover:border-primary-container transition-colors">
                <input v-model="rememberMe" type="checkbox" class="peer sr-only" />
                <div class="absolute inset-0 bg-primary-container opacity-0 peer-checked:opacity-100 transition-opacity flex items-center justify-center">
                  <span class="material-symbols-outlined text-[14px] text-on-primary-container" style="font-variation-settings: 'wght' 700;">check</span>
                </div>
              </div>
              <span class="font-body-md text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">Remember me</span>
            </label>
            <a href="#" @click.prevent="isResetMode = true; emailError = ''" class="font-label-sm text-label-sm text-primary hover:text-primary-fixed transition-colors uppercase">Reset Password</a>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-4 mt-2">
            <button
              type="submit"
              :disabled="loading || resetLoading"
              class="w-full bg-surface-bright hover:bg-surface-variant text-on-surface font-label-sm text-label-sm uppercase tracking-widest py-4 rounded-[2px] transition-all duration-300 stagger-item anim-fade-up flex items-center justify-center gap-2 group disabled:opacity-50"
              style="transition-delay: 320ms;"
            >
              <template v-if="loading || resetLoading">
                <span class="flex gap-1">
                  <span class="w-1.5 h-1.5 bg-on-surface rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-on-surface rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span class="w-1.5 h-1.5 bg-on-surface rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </span>
              </template>
              <template v-else>
                {{ isResetMode ? 'Send reset link' : 'Continue' }}
                <span class="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </template>
            </button>

            <!-- Back to Login Link for reset mode -->
            <button
              v-if="isResetMode"
              type="button"
              @click="isResetMode = false; resetSent = false; resetError = ''; emailError = ''"
              class="w-full border border-outline hover:border-outline-variant hover:bg-surface-container-lowest text-on-surface font-label-sm text-label-sm uppercase tracking-widest py-4 rounded-[2px] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Back to Login
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            </button>

            <!-- Separator -->
            <div v-if="!isResetMode" class="relative flex items-center py-2 stagger-item anim-fade-up" style="transition-delay: 400ms;">
              <div class="flex-grow border-t border-outline"></div>
              <span class="flex-shrink-0 mx-4 font-body-md text-body-md text-on-surface-variant text-sm">or</span>
              <div class="flex-grow border-t border-outline"></div>
            </div>

            <!-- Google OAuth -->
            <button
              v-if="!isResetMode"
              @click="handleGoogleSignIn"
              type="button"
              class="w-full border border-outline hover:border-outline-variant hover:bg-surface-container-lowest text-on-surface font-label-sm text-label-sm uppercase tracking-widest py-4 rounded-[2px] transition-all duration-300 stagger-item anim-fade-up flex items-center justify-center gap-3"
              style="transition-delay: 480ms;"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </button>
          </div>
        </form>

        <!-- Redirect to Sign up -->
        <div v-if="!isResetMode" class="text-center mt-6 stagger-item anim-fade-up" style="transition-delay: 560ms;">
          <p class="font-body-md text-body-md text-on-surface-variant">
            Don't have an account? 
            <router-link to="/signup" class="text-primary hover:text-primary-container transition-colors ml-1 font-medium border-b border-transparent hover:border-primary pb-0.5">Start free</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom transitions for entrance */
.anim-slide-right { transform: translateX(-30px); opacity: 0; transition: all 1s cubic-bezier(0.16, 1, 0.3, 1); }
.anim-fade-up { transform: translateY(20px); opacity: 0; transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.anim-fade-in { opacity: 0; transition: opacity 1.2s ease-out; }

.is-loaded .anim-slide-right { transform: translateX(0); opacity: 1; }
.is-loaded .anim-fade-up { transform: translateY(0); opacity: 1; }
.is-loaded .anim-fade-in { opacity: 1; }

.input-focus-border {
    position: relative;
}
.input-focus-border::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 1px;
    background-color: #c9a84c; /* primary-container */
    transition: width 0.4s ease;
}
.input-focus-border:focus-within::after {
    width: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
