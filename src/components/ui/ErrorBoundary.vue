<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

const emit = defineEmits(['retry'])

onErrorCaptured((err, instance, info) => {
  console.error('ErrorBoundary caught an error:', err, info)
  hasError.value = true
  errorMessage.value = err.message || 'An unexpected error occurred.'
  return false // Prevent error from propagating further
})

const handleRetry = () => {
  hasError.value = false
  errorMessage.value = ''
  emit('retry')
}
</script>

<template>
  <div v-if="hasError" class="p-8 border border-red-500/20 bg-red-500/5 rounded-sm flex flex-col items-center justify-center text-center gap-4 max-w-xl mx-auto w-full">
    <span class="material-symbols-outlined text-red-500 text-3xl">error</span>
    <div>
      <h4 class="font-headline-sm text-base text-[#F0EDE6] mb-1">Something went wrong</h4>
      <p class="font-body-md text-xs text-[#A0A0B0] max-w-xs">{{ errorMessage }}</p>
    </div>
    <button
      @click="handleRetry"
      class="border border-[#1E2030] hover:border-red-500/30 bg-[#16161F] text-xs font-button uppercase tracking-widest text-[#F0EDE6] hover:text-[#C9A84C] py-2 px-5 rounded-sm transition-all"
    >
      Retry
    </button>
  </div>
  <slot v-else></slot>
</template>
