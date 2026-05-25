<script setup>
import { computed } from 'vue'
import { usePortalStore } from '../../stores/portal'
import { useRouter } from 'vue-router'

const portalStore = usePortalStore()
const router = useRouter()

const profile = computed(() => portalStore.freelancerProfile)
const client = computed(() => portalStore.client)
const activeProject = computed(() => portalStore.activeProject)

const brandColor = computed(() => profile.value?.brand_color || '#C9A84C')

const handleSignOut = () => {
  // Clear token and redirect
  const slug = profile.value?.portal_slug
  if (slug) {
    localStorage.removeItem(`portal_token_${slug}`)
  }
  router.push(`/portal/${slug}`)
}
</script>

<template>
  <div 
    class="min-h-screen bg-[#0F0F18] text-[#F0EDE6] flex flex-col font-body-md"
    :style="{ '--color-accent': brandColor }"
  >
    <!-- Top Nav Bar -->
    <header class="flex justify-between items-center px-6 md:px-10 py-6 bg-[#0D0D14] border-b border-[#1E2030] sticky top-0 z-40">
      <!-- Left side: Agency branding -->
      <div class="flex items-center gap-3">
        <div v-if="profile?.logo_url" class="w-8 h-8 rounded-full overflow-hidden border border-[#1E2030]">
          <img :src="profile.logo_url" :alt="profile.agency_name" class="w-full h-full object-cover" />
        </div>
        <div v-else class="w-8 h-8 rounded-full bg-[#1A1A25] border border-[#1E2030] flex items-center justify-center text-xs text-[#C9A84C] font-semibold">
          {{ (profile?.agency_name || 'OS')[0] }}
        </div>
        <div class="flex flex-col">
          <span class="font-button text-sm tracking-tight text-[#F0EDE6]">{{ profile?.agency_name || 'Creative Studio' }}</span>
          <span v-if="activeProject" class="text-[10px] text-[#A0A0B0] font-medium tracking-wider uppercase mt-0.5">Portal — {{ activeProject.name }}</span>
        </div>
      </div>

      <!-- Right side: Client details & Portal nav -->
      <div class="flex items-center gap-4">
        <div class="hidden sm:flex flex-col text-right">
          <span class="text-xs text-[#F0EDE6] font-medium">{{ client?.name }}</span>
          <span class="text-[10px] text-[#5A5A6A]">{{ client?.company }}</span>
        </div>
        <button 
          @click="handleSignOut"
          class="flex items-center gap-1.5 px-3 py-1.5 border border-[#1E2030] hover:border-[#C9A84C]/30 text-xs text-[#A0A0B0] hover:text-[#C9A84C] font-button uppercase tracking-wider rounded-sm transition-all"
        >
          <span class="material-symbols-outlined text-xs">logout</span>
          Exit Portal
        </button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="bg-[#0D0D14] border-b border-[#1E2030] px-6 md:px-10 py-1">
      <div class="flex gap-6 max-w-7xl mx-auto w-full">
        <router-link 
          v-if="profile?.portal_settings?.tabs?.overview !== false"
          :to="`/portal/${profile?.portal_slug}/overview`" 
          class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-[#F0EDE6]"
          active-class="border-active text-[#C9A84C]"
        >
          Overview
        </router-link>
        <router-link 
          v-if="profile?.portal_settings?.tabs?.files !== false"
          :to="`/portal/${profile?.portal_slug}/files`" 
          class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-[#F0EDE6]"
          active-class="border-active text-[#C9A84C]"
        >
          Files
        </router-link>
        <router-link 
          v-if="profile?.portal_settings?.tabs?.invoices !== false"
          :to="`/portal/${profile?.portal_slug}/invoices`" 
          class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-[#F0EDE6]"
          active-class="border-active text-[#C9A84C]"
        >
          Invoices
        </router-link>
        <router-link 
          v-if="profile?.portal_settings?.tabs?.feedback !== false"
          :to="`/portal/${profile?.portal_slug}/feedback`" 
          class="py-3 text-xs uppercase tracking-widest font-button border-b-2 border-transparent transition-all hover:text-[#F0EDE6]"
          active-class="border-active text-[#C9A84C]"
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
  </div>
</template>

<style scoped>
.border-active {
  border-bottom-color: var(--color-accent, #C9A84C);
  color: var(--color-accent, #C9A84C) !important;
}

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
