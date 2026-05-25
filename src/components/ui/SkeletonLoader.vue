<script setup>
defineProps({
  type: {
    type: String,
    default: 'text',
    validator: (value) => ['card', 'list-item', 'stat', 'text', 'avatar'].includes(value)
  },
  count: {
    type: Number,
    default: 1
  }
})
</script>

<template>
  <div class="flex flex-col gap-4 w-full">
    <div v-for="i in count" :key="i" class="w-full">
      <!-- Stat Skeleton -->
      <div v-if="type === 'stat'" class="bg-[#1A1A25] border border-[#1E2030] p-6 rounded-sm flex flex-col gap-2 relative overflow-hidden">
        <div class="h-3 w-20 bg-[#252535] rounded animate-pulse"></div>
        <div class="h-10 w-12 bg-[#252535] rounded animate-pulse mt-1"></div>
        <div class="shimmer"></div>
      </div>

      <!-- Card Skeleton -->
      <div v-else-if="type === 'card'" class="bg-[#16161F] border border-[#1E2030] p-6 rounded-sm flex flex-col gap-4 relative overflow-hidden">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-[#252535] animate-pulse"></div>
          <div class="flex flex-col gap-2 flex-grow">
            <div class="h-4 w-1/3 bg-[#252535] rounded animate-pulse"></div>
            <div class="h-3 w-1/2 bg-[#252535] rounded animate-pulse"></div>
          </div>
        </div>
        <div class="h-3 w-full bg-[#252535] rounded animate-pulse"></div>
        <div class="h-3 w-4/5 bg-[#252535] rounded animate-pulse"></div>
        <div class="shimmer"></div>
      </div>

      <!-- List Item Skeleton -->
      <div v-else-if="type === 'list-item'" class="bg-[#16161F] border border-[#1E2030] p-4 rounded-sm flex items-center justify-between relative overflow-hidden">
        <div class="flex items-center gap-4 w-full">
          <div class="w-10 h-10 rounded-full bg-[#252535] animate-pulse"></div>
          <div class="flex flex-col gap-2 flex-grow">
            <div class="h-4 w-1/4 bg-[#252535] rounded animate-pulse"></div>
            <div class="h-3 w-1/3 bg-[#252535] rounded animate-pulse"></div>
          </div>
        </div>
        <div class="h-6 w-16 bg-[#252535] rounded animate-pulse"></div>
        <div class="shimmer"></div>
      </div>

      <!-- Avatar Skeleton -->
      <div v-else-if="type === 'avatar'" class="w-10 h-10 rounded-full bg-[#252535] animate-pulse relative overflow-hidden">
        <div class="shimmer"></div>
      </div>

      <!-- Text Line Skeleton -->
      <div v-else class="flex flex-col gap-2 relative overflow-hidden w-full">
        <div class="h-4 bg-[#252535] rounded animate-pulse w-full"></div>
        <div class="h-4 bg-[#252535] rounded animate-pulse w-5/6"></div>
        <div class="h-4 bg-[#252535] rounded animate-pulse w-2/3"></div>
        <div class="shimmer"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.03) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  animation: shimmer-anim 1.5s infinite;
  pointer-events: none;
}

@keyframes shimmer-anim {
  100% {
    transform: translateX(100%);
  }
}
</style>
