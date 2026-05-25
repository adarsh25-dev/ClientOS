<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { usePortalStore } from '../../stores/portal'
import { useToast } from '../../composables/useToast'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'

const portalStore = usePortalStore()
const toast = useToast()

const client = computed(() => portalStore.client)
const projects = computed(() => portalStore.projects)
const activeProject = computed(() => portalStore.activeProject)
const milestones = computed(() => portalStore.milestones)
const updates = computed(() => portalStore.updates)
const files = computed(() => portalStore.files)
const invoices = computed(() => portalStore.invoices)

const latestUpdate = computed(() => updates.value[0])
const pendingFiles = computed(() => files.value.filter(f => f.status === 'pending'))

const latestInvoice = computed(() => {
  if (invoices.value.length === 0) return null
  return invoices.value[0]
})

// Progress percentage computed
const progressPercentage = computed(() => {
  if (milestones.value.length === 0) return 0
  const completed = milestones.value.filter(m => m.status === 'completed').length
  return Math.round((completed / milestones.value.length) * 100)
})

// Status actions: mark update read, mark invoice viewed
const checkAndMarkRead = async () => {
  if (latestUpdate.value && !latestUpdate.value.read_by_client) {
    await portalStore.markUpdateRead(latestUpdate.value.id)
  }

  if (latestInvoice.value && latestInvoice.value.status === 'sent') {
    await portalStore.markInvoiceViewed(latestInvoice.value.id)
  }
}

watch(() => activeProject.value, () => {
  checkAndMarkRead()
})

const handlePayNow = async () => {
  if (!latestInvoice.value) return
  try {
    await portalStore.markInvoicePaid(latestInvoice.value.id)
    toast.success('Invoice payment simulated successfully!')
  } catch (err) {
    toast.error('Simulation failed')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'active': return 'In Progress'
    case 'completed': return 'Completed'
    case 'paused': return 'Paused'
    default: return 'Cancelled'
  }
}

onMounted(() => {
  checkAndMarkRead()
})
</script>

<template>
  <div class="flex flex-col gap-10 text-left">
    <!-- Project Selector Tab (Visible if client has multiple projects) -->
    <div v-if="projects.length > 1" class="flex border-b border-[#1E2030]/60 gap-4 mb-2">
      <button
        v-for="p in projects"
        :key="p.id"
        @click="portalStore.setActiveProject(p.id)"
        class="py-2.5 text-xs font-button uppercase tracking-wider border-b-2 transition-all"
        :class="activeProject?.id === p.id ? 'border-[#C9A84C] text-[#C9A84C]' : 'border-transparent text-[#A0A0B0] hover:text-[#F0EDE6]'"
      >
        {{ p.name }}
      </button>
    </div>

    <!-- Main Overview layout splits -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <!-- Left column: Timeline status & updates (60%) -->
      <div class="lg:col-span-8 flex flex-col gap-8">
        
        <!-- Project Status timeline -->
        <div class="bg-[#16161F] border border-[#1E2030] p-6 rounded-sm">
          <div class="flex justify-between items-start mb-6">
            <div>
              <span class="font-label-caps text-[9px] text-[#5A5A70] uppercase tracking-widest block font-bold mb-1 font-sans">Active Project</span>
              <h3 class="font-display text-xl text-[#F0EDE6]">{{ activeProject?.name }}</h3>
            </div>
            <span class="px-2.5 py-1 text-[9px] uppercase tracking-widest font-bold border border-warning/20 bg-warning/10 text-warning rounded-sm">
              {{ getStatusLabel(activeProject?.status) }}
            </span>
          </div>

          <!-- Progress Bar -->
          <div class="flex flex-col gap-2.5 mb-8">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-[#A0A0B0]">Milestone Completion</span>
              <span class="text-[#C9A84C] font-semibold">{{ progressPercentage }}%</span>
            </div>
            <div class="w-full bg-[#1A1A25] h-1.5 rounded-full overflow-hidden">
              <div 
                class="bg-[#C9A84C] h-full transition-all duration-500" 
                :style="{ width: `${progressPercentage}%` }"
              ></div>
            </div>
          </div>

          <!-- Timeline horizontal milestones list -->
          <div class="flex items-center gap-4 py-4 overflow-x-auto min-h-[100px] relative border-t border-[#1E2030]/30 pt-6">
            <div class="absolute left-6 right-6 top-[39px] h-[1px] bg-[#1E2030] z-0"></div>

            <div
              v-for="m in milestones"
              :key="m.id"
              class="flex flex-col items-center shrink-0 w-28 z-10 relative group"
            >
              <!-- animated circle node -->
              <div
                class="w-5 h-5 rounded-full border-[2px] bg-[#16161F] flex items-center justify-center relative"
                :class="m.status === 'completed'
                  ? 'border-[#C9A84C] bg-[#C9A84C]'
                  : m.status === 'in_progress'
                    ? 'border-[#C9A84C] scale-110 shadow-[0_0_0_4px_rgba(201,168,76,0.15)]'
                    : 'border-[#1E2030]'"
              >
                <span v-if="m.status === 'completed'" class="material-symbols-outlined text-[10px] text-[#0A0A0F] font-bold">check</span>
                <span v-else-if="m.status === 'in_progress'" class="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse"></span>
              </div>
              <span class="text-[11px] font-medium text-[#E9E1D7] truncate max-w-[90px] mt-2.5">{{ m.title }}</span>
              <span class="text-[9px] text-[#5A5A70] mt-0.5">{{ formatDate(m.due_date) || 'TBD' }}</span>
            </div>
          </div>
        </div>

        <!-- Latest update summary card -->
        <div class="bg-[#16161F] border border-[#1E2030] p-6 rounded-sm">
          <h4 class="font-headline-sm text-sm uppercase tracking-widest text-[#F0EDE6] mb-4">Latest Project Update</h4>
          
          <div v-if="latestUpdate" class="flex flex-col gap-3">
            <div class="bg-[#0D0D14]/30 border border-[#1E2030] p-4 rounded-sm text-sm text-[#F0EDE6] leading-relaxed whitespace-pre-wrap">
              {{ latestUpdate.content }}
            </div>
            <span class="text-[10px] text-[#5A5A70] self-end">Updated {{ formatDate(latestUpdate.created_at) }}</span>
          </div>
          <div v-else class="text-center text-xs text-[#5A5A6A] py-4">
            No updates posted yet.
          </div>
        </div>

      </div>

      <!-- Right column: Action prompts (40%) -->
      <div class="lg:col-span-4 flex flex-col gap-6">
        
        <!-- File Approvals Prompt -->
        <div 
          v-if="pendingFiles.length > 0"
          class="bg-[#16161F] border border-warning/20 border-l-[3px] border-l-[#C9A84C] p-6 rounded-sm flex flex-col gap-4 text-left"
        >
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-[#C9A84C]">rate_review</span>
            <div class="flex flex-col">
              <h4 class="text-sm font-semibold text-[#F0EDE6] font-button uppercase tracking-widest">Deliverables Awaiting Review</h4>
              <p class="text-xs text-[#A0A0B0] mt-1">You have <strong class="text-[#F0EDE6] font-semibold">{{ pendingFiles.length }} file(s)</strong> awaiting your approval.</p>
            </div>
          </div>
          <router-link
            :to="`/portal/${portalStore.freelancerProfile?.portal_slug}/files`"
            class="w-full bg-[#1A1A25] hover:bg-[#1E2030] border border-[#1E2030] text-[#E9E1D7] font-button text-xs uppercase tracking-widest py-2.5 rounded-sm transition-colors text-center block"
          >
            Go to deliverables
          </router-link>
        </div>

        <div 
          v-else
          class="bg-[#16161F] border border-[#1E2030] border-l-[3px] border-l-emerald-500 p-6 rounded-sm flex items-center gap-3 text-left"
        >
          <span class="material-symbols-outlined text-emerald-500">task_alt</span>
          <div class="flex flex-col">
            <h4 class="text-xs font-semibold text-[#F0EDE6] uppercase tracking-widest font-button">All deliverables reviewed</h4>
            <p class="text-[10px] text-[#A0A0B0] mt-0.5">Nothing is currently awaiting your signature.</p>
          </div>
        </div>

        <!-- Invoice summary card -->
        <div v-if="latestInvoice" class="bg-[#16161F] border border-[#1E2030] p-6 rounded-sm flex flex-col gap-4">
          <h4 class="font-headline-sm text-sm uppercase tracking-widest text-[#F0EDE6] border-b border-[#1E2030] pb-3">Latest Invoice</h4>

          <div class="flex justify-between items-center text-xs text-left">
            <div class="flex flex-col">
              <span class="text-[#5A5A70]">Reference</span>
              <span class="text-[#F0EDE6] font-semibold font-mono">{{ latestInvoice.invoice_number }}</span>
            </div>
            <div class="flex flex-col text-right">
              <span class="text-[#5A5A70]">Amount Due</span>
              <span class="text-[#C9A84C] font-bold font-mono">${{ latestInvoice.total }}</span>
            </div>
          </div>

          <div class="flex items-center justify-between border-t border-[#1E2030]/40 pt-4 mt-1">
            <span class="text-[10px] text-[#5A5A70] uppercase tracking-wider font-semibold">Status:</span>
            <span 
              class="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border"
              :class="latestInvoice.status === 'paid' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-warning/10 text-warning border-warning/20'"
            >
              {{ latestInvoice.status }}
            </span>
          </div>

          <!-- Simulate Payment -->
          <button
            v-if="latestInvoice.status !== 'paid'"
            @click="handlePayNow"
            class="w-full bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors mt-2"
          >
            Pay Invoice
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
