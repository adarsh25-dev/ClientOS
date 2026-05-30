<script setup>
import { useRouter } from 'vue-router'

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  actionLabel: {
    type: String,
    default: ''
  },
  actionRoute: {
    type: String,
    default: ''
  }
})

const router = useRouter()

const handleAction = (route) => {
  if (route) {
    router.push(route)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center p-12 border border-dashed border-[#1E2030] rounded-sm bg-[#16161F]/30 max-w-xl mx-auto w-full">
    <div class="text-primary mb-4 flex items-center justify-center">
      <slot name="icon">
        <span class="material-symbols-outlined text-4xl">folder_off</span>
      </slot>
    </div>
    <h3 class="font-headline-sm text-lg text-[#F0EDE6] mb-2">{{ title }}</h3>
    <p class="font-body-md text-sm text-[#A0A0B0] max-w-sm mb-6 leading-relaxed">
      {{ description }}
    </p>
    <button
      v-if="actionLabel && actionRoute"
      @click="handleAction(actionRoute)"
      class="bg-[#1A1A25] hover:bg-[#1E2030] border border-[#1E2030] text-[#F0EDE6] hover:text-primary font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-all duration-300 flex items-center gap-2"
    >
      {{ actionLabel }}
      <span class="material-symbols-outlined text-sm">arrow_forward</span>
    </button>
  </div>
</template>
