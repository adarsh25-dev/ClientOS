<script setup>
import { useOnline } from '@vueuse/core'
import ToastContainer from './components/ui/ToastContainer.vue'

const isOnline = useOnline()
</script>

<template>
  <div class="min-h-screen flex flex-col w-full bg-[#0A0A0F]">
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
