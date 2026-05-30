<script setup>
import { watch } from 'vue'
import { useOnline } from '@vueuse/core'
import ToastContainer from './components/ui/ToastContainer.vue'
import { useAuth } from './composables/useAuth'
import { hexToRgb } from './utils/color'

const isOnline = useOnline()
const { profile } = useAuth()

// Reactively sync the brand accent color to the document root so ALL
// CSS classes using var(--color-primary) pick it up everywhere in the DOM.
watch(
  () => profile.value?.brand_color,
  (color) => {
    const accent = color || '#c9a84c'
    document.documentElement.style.setProperty('--color-primary', accent)
    document.documentElement.style.setProperty('--color-primary-rgb', hexToRgb(accent))
  },
  { immediate: true }
)
</script>

<template>
  <div class="min-h-screen flex flex-col w-full bg-custom-bg-main">
    <!-- Offline Banner -->
    <div
      v-if="!isOnline"
      class="bg-amber-500 text-black text-xs font-semibold text-center py-2 relative z-[99999] shadow-md select-none font-sans"
    >
      You're offline. Some features may not work properly.
    </div>

    <!-- Main Router View -->
    <router-view v-slot="{ Component }">
      <transition name="page" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Global Toasts -->
    <ToastContainer />
  </div>
</template>

<style>
/* Global Transition States */
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
