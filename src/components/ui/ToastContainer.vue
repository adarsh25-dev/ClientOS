<script setup>
import { useToast } from '../../composables/useToast'

const { toasts, dismiss } = useToast()

const getBorderColor = (type) => {
  switch (type) {
    case 'success':
      return 'border-l-[#C9A84C]'
    case 'warning':
      return 'border-l-warning'
    case 'error':
      return 'border-l-red-500'
    default:
      return 'border-l-[#A0A0B0]'
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 flex flex-col gap-3 z-[9999] max-w-sm w-full pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto bg-[#1A1A25] border border-[#1E2030] border-l-[4px] p-4 rounded-sm flex items-start justify-between shadow-lg text-sm text-[#F0EDE6]"
          :class="getBorderColor(toast.type)"
        >
          <div class="flex-1 pr-4">
            {{ toast.message }}
          </div>
          <button
            @click="dismiss(toast.id)"
            class="text-[#5A5A6A] hover:text-[#F0EDE6] transition-colors"
          >
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
