<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortalStore } from '../../stores/portal'
import { useToast } from '../../composables/useToast'

const route = useRoute()
const router = useRouter()
const portalStore = usePortalStore()
const toast = useToast()

const verifying = ref(true)
const verificationError = ref('')

onMounted(async () => {
  const slug = route.params.slug
  const queryToken = route.query.token
  const localToken = localStorage.getItem(`portal_token_${slug}`)
  
  const token = queryToken || localToken

  if (!token) {
    verifying.value = false
    verificationError.value = 'A secure access token is required to enter this workspace. Please click the link provided by your project team.'
    return
  }

  try {
    await portalStore.initPortal(slug, token)
    // Successful login redirect
    router.push(`/portal/${slug}/overview`)
  } catch (err) {
    console.error('Portal access verification failed:', err)
    verifying.value = false
    verificationError.value = 'Invalid or expired portal link. Please check your URL parameters or contact support.'
    // Clean up localToken if it was invalid
    localStorage.removeItem(`portal_token_${slug}`)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#0A0A0F] text-[#E9E1D7] antialiased flex flex-col justify-center items-center p-6 relative overflow-hidden">
    <div class="w-full max-w-md bg-[#0D0D14] border border-[#1E2030] p-8 md:p-12 rounded-sm shadow-2xl relative z-10 text-center">
      <div class="flex items-center gap-2.5 text-primary mb-8 justify-center">
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">widgets</span>
        <span class="font-display text-xl font-bold tracking-tight text-white">ClientOS Portal</span>
      </div>

      <!-- Verifying state -->
      <div v-if="verifying" class="flex flex-col items-center justify-center gap-4 py-8">
        <div class="w-10 h-10 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
        <div class="flex flex-col gap-1">
          <span class="text-sm font-medium text-[#F0EDE6]">Verifying Secure Credentials</span>
          <span class="text-[10px] uppercase tracking-wider text-[#5A5A70]">Decrypting access tokens...</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else class="flex flex-col items-center gap-4 py-4">
        <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <span class="material-symbols-outlined">lock_open</span>
        </div>
        <div>
          <h3 class="font-headline-sm text-sm uppercase tracking-widest text-[#F0EDE6] mb-2">Access Restriced</h3>
          <p class="font-body text-xs text-[#A0A0B0] leading-relaxed">
            {{ verificationError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
