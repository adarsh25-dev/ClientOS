<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePortalStore } from '../../stores/portal'
import { useRouter, useRoute } from 'vue-router'
import { hexToRgb } from '../../utils/color'
import { useTheme } from '../../composables/useTheme'

const portalStore = usePortalStore()
const router = useRouter()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const profile = computed(() => portalStore.freelancerProfile)
const client = computed(() => portalStore.client)
const activeProject = computed(() => portalStore.activeProject)

const brandColor = computed(() => profile.value?.brand_color || '#C9A84C')

// Sync portal brand color to document root imperatively so all
// var(--color-primary) usages across child components pick it up
watch(brandColor, (color) => {
  document.documentElement.style.setProperty('--color-primary', color)
  document.documentElement.style.setProperty('--color-primary-rgb', hexToRgb(color))
}, { immediate: true })

// Tracks whether we're still bootstrapping the portal state
const initializing = ref(false)
const initError = ref('')

const handleSignOut = () => {
  const slug = profile.value?.portal_slug
  if (slug) {
    localStorage.removeItem(`portal_token_${slug}`)
  }
  portalStore.$reset()
  router.push(`/portal/${slug}`)
}

onMounted(async () => {
  // If the store is already populated (navigated here from PortalAccess), do nothing
  if (portalStore.freelancerProfile) return

  // Store is empty — this happens on page refresh or direct URL navigation to a sub-page.
  // Re-initialize using the slug from the route and the saved token from localStorage or query.
  const slug = route.params.slug
  const queryToken = route.query.token
  const localToken = localStorage.getItem(`portal_token_${slug}`)
  const token = queryToken || localToken

  if (!token) {
    // No token available at all — send back to the portal access gate
    router.replace({ name: 'portal-access', params: { slug } })
    return
  }

  initializing.value = true
  initError.value = ''

  try {
    await portalStore.initPortal(slug, token)
  } catch (err) {
    console.error('PortalLayout: failed to re-initialize portal:', err)
    initError.value = 'Your session has expired or the portal link is invalid.'
    // Clear stale token and redirect to portal access
    localStorage.removeItem(`portal_token_${slug}`)
    setTimeout(() => {
      router.replace({ name: 'portal-access', params: { slug } })
    }, 2000)
  } finally {
    initializing.value = false
  }
})
</script>

<template>
  <div 
    class="min-h-screen bg-custom-bg-main text-on-surface flex flex-col font-body-md"
    :style="{ '--color-primary': brandColor }"
  >

    <!-- Initializing / Loading Overlay -->
    <div 
      v-if="initializing || initError"
      class="min-h-screen flex flex-col items-center justify-center gap-6"
    >
      <!-- Brand mark -->
      <div class="flex items-center gap-2.5 text-primary">
        <span class="material-symbols-outlined text-2xl" style="font-variation-settings: 'FILL' 1;">widgets</span>
        <span class="font-display text-xl font-bold tracking-tight text-white">ClientOS Portal</span>
      </div>

      <!-- Loading spinner -->
      <div v-if="initializing" class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
        <div class="flex flex-col items-center gap-1">
          <span class="text-sm font-medium text-[#F0EDE6]">Loading your portal</span>
          <span class="text-[10px] uppercase tracking-wider text-[#5A5A70]">Restoring secure session...</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="initError" class="flex flex-col items-center gap-3 text-center max-w-sm">
        <div class="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center">
          <span class="material-symbols-outlined">lock_open</span>
        </div>
        <div>
          <h3 class="font-headline-sm text-sm uppercase tracking-widest text-[#F0EDE6] mb-2">Session Expired</h3>
          <p class="font-body text-xs text-[#A0A0B0] leading-relaxed">{{ initError }}</p>
          <p class="text-[10px] text-[#5A5A70] mt-2">Redirecting you back to the portal access page...</p>
        </div>
      </div>
    </div>

    <!-- Full portal UI — only shown when store is populated -->
    <template v-else>
      <!-- Top Nav Bar -->
      <header class="flex justify-between items-center px-6 md:px-10 py-6 bg-custom-bg-sidebar border-b border-custom-border sticky top-0 z-40">
        <!-- Left side: Agency branding -->
        <div class="flex items-center gap-3">
          <div v-if="profile?.logo_url" class="w-8 h-8 rounded-full overflow-hidden border border-custom-border">
            <img :src="profile.logo_url" :alt="profile.agency_name" class="w-full h-full object-cover" />
          </div>
          <div v-else class="w-8 h-8 rounded-full bg-custom-hover border border-custom-border flex items-center justify-center text-xs text-primary font-semibold">
            {{ (profile?.agency_name || 'OS')[0] }}
          </div>
          <div class="flex flex-col">
            <span class="font-button text-sm tracking-tight text-on-surface">{{ profile?.agency_name || 'Creative Studio' }}</span>
            <span v-if="activeProject" class="text-[10px] text-custom-muted font-medium tracking-wider uppercase mt-0.5">Portal — {{ activeProject.name }}</span>
          </div>
        </div>

        <!-- Right side: Client details & Portal nav -->
        <div class="flex items-center gap-4">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-xs text-on-surface font-medium">{{ client?.name }}</span>
            <span class="text-[10px] text-custom-muted">{{ client?.company }}</span>
          </div>
          <button 
            @click="handleSignOut"
            class="flex items-center gap-1.5 px-3 py-1.5 border border-custom-border hover:border-primary/30 text-xs text-on-surface-variant hover:text-primary font-button uppercase tracking-wider rounded-sm transition-all"
          >
            <span class="material-symbols-outlined text-xs">logout</span>
            Exit Portal
          </button>

          <!-- Theme Toggle Button -->
          <button 
            @click="toggleTheme" 
            class="flex items-center justify-center p-1.5 border border-[#1E2030] hover:border-primary/30 text-[#A0A0B0] hover:text-primary rounded-sm transition-all"
            title="Toggle theme"
          >
            <span class="material-symbols-outlined text-xs">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
          </button>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <div class="bg-custom-bg-sidebar border-b border-custom-border px-6 md:px-10 py-1">
        <div class="flex overflow-x-auto whitespace-nowrap gap-6 max-w-7xl mx-auto w-full custom-scrollbar pb-1">
          <router-link 
            v-if="profile?.portal_settings?.tabs?.overview !== false"
            :to="`/portal/${profile?.portal_slug}/overview`" 
            class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-on-surface"
            active-class="!border-b-primary !text-primary"
          >
            Overview
          </router-link>
          <router-link 
            v-if="profile?.portal_settings?.tabs?.files !== false"
            :to="`/portal/${profile?.portal_slug}/files`" 
            class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-on-surface"
            active-class="!border-b-primary !text-primary"
          >
            Files
          </router-link>
          <router-link 
            v-if="profile?.portal_settings?.tabs?.invoices !== false"
            :to="`/portal/${profile?.portal_slug}/invoices`" 
            class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-on-surface"
            active-class="!border-b-primary !text-primary"
          >
            Invoices
          </router-link>
          <router-link 
            v-if="profile?.portal_settings?.tabs?.feedback !== false"
            :to="`/portal/${profile?.portal_slug}/feedback`" 
            class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-on-surface"
            active-class="!border-b-primary !text-primary"
          >
            Feedback
          </router-link>
        </div>
      </div>

      <!-- Main Workspace -->
      <main class="flex-1 flex flex-col p-6 md:p-10 max-w-7xl mx-auto w-full">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </template>
  </div>
</template>

<style scoped>


.page-enter-active {
  transition: all 350ms cubic-bezier(0.16, 1, 0.3, 1);
}
.page-leave-active {
  transition: all 250ms ease-in;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
