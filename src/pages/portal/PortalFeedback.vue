<script setup>
import { computed } from 'vue'
import { usePortalStore } from '../../stores/portal'
import FeedbackThread from '../../components/FeedbackThread.vue'

const portalStore = usePortalStore()

const activeProject = computed(() => portalStore.activeProject)
const client = computed(() => portalStore.client)
</script>

<template>
  <div class="flex flex-col gap-6 text-left h-[calc(100vh-220px)]">
    <!-- Header -->
    <div class="border-b border-[#1E2030] pb-6 mb-2 shrink-0">
      <h2 class="font-display text-2xl text-[#F0EDE6] mb-1">Discussion</h2>
      <p class="font-body text-xs text-[#A0A0B0]">Direct messaging pipeline for project discussion, files reviews, and feedback.</p>
    </div>

    <!-- Feedback Thread container -->
    <div class="flex-1 overflow-hidden flex flex-col justify-between">
      <FeedbackThread
        v-if="activeProject"
        :projectId="activeProject.id"
        :currentUser="{ name: client?.name || 'Client', type: 'client' }"
      />
      <div v-else class="text-center text-xs text-[#5A5A6A] py-12">
        No active project found to discuss.
      </div>
    </div>
  </div>
</template>
