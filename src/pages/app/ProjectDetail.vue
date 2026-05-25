<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectsStore } from '../../stores/projects'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import EmptyState from '../../components/ui/EmptyState.vue'
import AIUpdateModal from '../../components/dashboard/AIUpdateModal.vue'
import FeedbackThread from '../../components/FeedbackThread.vue'
import ProjectFiles from './ProjectFiles.vue' // Sub-component we will create

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const { profile } = useAuth()
const toast = useToast()

const projectId = route.params.id

// Refs
const loading = ref(true)
const activeTab = ref('overview') // 'overview' | 'files' | 'invoices' | 'feedback'
const isAIModalOpen = ref(false)

// Milestone editing
const editingMilestoneId = ref(null)
const editingMilestoneStatus = ref('pending')
const editingMilestoneDueDate = ref('')

// Add milestone popover
const isAddMilestoneOpen = ref(false)
const newMilestoneTitle = ref('')
const newMilestoneDueDate = ref('')

// Invoices list for this project
const invoices = ref([])
const loadingInvoices = ref(false)

const project = computed(() => projectsStore.currentProject)
const client = computed(() => projectsStore.currentClient)
const milestones = computed(() => projectsStore.milestones)
const recentUpdate = computed(() => projectsStore.updates[0])

const portalUrl = computed(() => {
  const slug = profile.value?.portal_slug
  const token = client.value?.portal_access_token
  if (!slug || !token) return ''
  return `${window.location.origin}/portal/${slug}?token=${token}`
})

const fetchProjectDetails = async () => {
  loading.value = true
  try {
    await Promise.all([
      projectsStore.fetchProjectDetail(projectId),
      fetchProjectInvoices()
    ])
  } catch (err) {
    toast.error('Failed to load project details: ' + err.message)
    router.push('/app/projects')
  } finally {
    loading.value = false
  }
}

const fetchProjectInvoices = async () => {
  loadingInvoices.value = true
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    invoices.value = data || []
  } catch (err) {
    console.error('Error fetching project invoices:', err)
  } finally {
    loadingInvoices.value = false
  }
}

// Milestone timeline reordering
const dragStartIdx = ref(null)

const handleDragStart = (index) => {
  dragStartIdx.value = index
}

const handleDragOver = (e) => {
  e.preventDefault()
}

const handleDrop = async (index) => {
  if (dragStartIdx.value === null || dragStartIdx.value === index) return

  const reordered = [...milestones.value]
  const [removed] = reordered.splice(dragStartIdx.value, 1)
  reordered.splice(index, 0, removed)
  
  dragStartIdx.value = null
  try {
    await projectsStore.reorderMilestones(reordered)
    toast.success('Milestones reordered')
  } catch (err) {
    toast.error('Failed to save order: ' + err.message)
  }
}

// Milestone actions
const handleMilestoneClick = (m) => {
  editingMilestoneId.value = m.id
  editingMilestoneStatus.value = m.status
  editingMilestoneDueDate.value = m.due_date || ''
}

const saveMilestoneEdits = async () => {
  if (!editingMilestoneId.value) return
  try {
    await projectsStore.updateMilestone(editingMilestoneId.value, {
      status: editingMilestoneStatus.value,
      due_date: editingMilestoneDueDate.value || null
    })
    toast.success('Milestone updated')
    editingMilestoneId.value = null
  } catch (err) {
    toast.error('Failed to update milestone')
  }
}

const handleDeleteMilestone = async (id) => {
  if (!confirm('Are you sure you want to delete this milestone?')) return
  try {
    await projectsStore.deleteMilestone(id)
    toast.success('Milestone deleted')
    editingMilestoneId.value = null
  } catch (err) {
    toast.error('Failed to delete milestone')
  }
}

const handleAddMilestone = async () => {
  if (!newMilestoneTitle.value) return
  try {
    await projectsStore.addMilestone({
      title: newMilestoneTitle.value,
      dueDate: newMilestoneDueDate.value || null
    })
    toast.success('Milestone added')
    newMilestoneTitle.value = ''
    newMilestoneDueDate.value = ''
    isAddMilestoneOpen.value = false
  } catch (err) {
    toast.error('Failed to add milestone')
  }
}

// Project status updates
const handleStatusChange = async (e) => {
  const newStatus = e.target.value
  try {
    await projectsStore.updateProjectStatus(projectId, newStatus)
    toast.success(`Project marked as ${newStatus}`)
  } catch (err) {
    toast.error('Failed to update status')
  }
}

// Helpers
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

const copyLink = () => {
  navigator.clipboard.writeText(portalUrl.value)
  toast.success('Client portal URL copied!')
}

const getMailtoLink = () => {
  if (!client.value) return '#'
  const subject = encodeURIComponent(`Project Update: ${project.value?.name}`)
  const body = encodeURIComponent(`Hi ${client.value.name},\n\nYou can access your live project dashboard here: ${portalUrl.value}\n\nBest regards,\n${profile.value?.full_name}`)
  return `mailto:${client.value.email}?subject=${subject}&body=${body}`
}

onMounted(() => {
  fetchProjectDetails()
})
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    <!-- Header -->
    <div v-if="loading" class="flex flex-col gap-3 py-6 border-b border-custom-border">
      <div class="h-6 w-48 bg-custom-hover rounded animate-pulse"></div>
      <div class="h-4 w-96 bg-custom-hover rounded animate-pulse mt-1"></div>
    </div>

    <div v-else class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-custom-border pb-6">
      <div>
        <h2 class="font-display text-2xl text-on-surface mb-1.5">{{ project?.name }}</h2>
        <p class="font-body text-xs text-on-surface-variant flex items-center gap-2">
          <span>Client: <strong class="text-on-surface">{{ client?.name }}</strong></span>
          <span class="text-custom-muted">•</span>
          <span>Company: <strong class="text-on-surface">{{ client?.company || 'None' }}</strong></span>
        </p>
      </div>

      <!-- Project actions (Status & AI Update) -->
      <div class="flex items-center gap-3">
        <!-- Status Select -->
        <select
          :value="project?.status"
          @change="handleStatusChange"
          class="bg-custom-bg-card border border-custom-border rounded-sm py-2 px-3 text-xs text-on-surface-variant focus:ring-0 focus:border-primary font-button uppercase tracking-wider transition-colors cursor-pointer"
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="paused">Paused</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <!-- Generate Update -->
        <button
          @click="isAIModalOpen = true"
          class="bg-primary hover:bg-primary-container text-on-primary font-button text-xs uppercase tracking-widest py-2.5 px-4 rounded-sm transition-colors flex items-center gap-1.5"
        >
          <span class="material-symbols-outlined text-sm">auto_awesome</span>
          Generate AI Update
        </button>
      </div>
    </div>

    <!-- Tabs Menu -->
    <div class="flex border-b border-custom-border/60 gap-6">
      <button
        v-for="t in ['overview', 'files', 'invoices', 'feedback']"
        :key="t"
        @click="activeTab = t"
        class="py-3 text-xs uppercase tracking-widest font-button border-b-2 transition-all"
        :class="activeTab === t 
          ? 'border-primary text-primary' 
          : 'border-transparent text-on-surface-variant hover:text-on-surface'"
      >
        {{ t }}
      </button>
    </div>

    <!-- Main Workspace Section -->
    <div v-if="loading" class="py-12">
      <SkeletonLoader type="text" :count="2" />
    </div>

    <div v-else class="flex-grow">
      <!-- TAB 1: Overview -->
      <div v-if="activeTab === 'overview'" class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <!-- Left panel: Milestones timeline & Portal link -->
        <div class="lg:col-span-8 flex flex-col gap-8">
          
          <!-- Milestone timeline -->
          <div class="bg-custom-bg-card border border-custom-border p-6 rounded-sm">
            <div class="flex justify-between items-center mb-6">
              <h4 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface">Project Milestones</h4>
              <span class="text-[10px] text-custom-muted uppercase tracking-wider font-semibold">Drag to Reorder</span>
            </div>

            <!-- Horizontal line container -->
            <div class="flex items-center gap-4 py-8 overflow-x-auto min-h-[140px] relative">
              <!-- Background gray timeline path line -->
              <div class="absolute left-6 right-6 top-[55px] h-[1px] bg-custom-border z-0"></div>

              <!-- Milestone Nodes -->
              <div
                v-for="(m, idx) in milestones"
                :key="m.id"
                draggable="true"
                @dragstart="handleDragStart(idx)"
                @dragover="handleDragOver"
                @drop="handleDrop(idx)"
                @click="handleMilestoneClick(m)"
                class="flex flex-col items-center shrink-0 w-32 cursor-pointer z-10 select-none relative group"
              >
                <!-- Title tooltip on hover -->
                <div class="absolute bottom-16 bg-custom-hover border border-custom-border text-[10px] text-on-surface px-2.5 py-1.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg pointer-events-none">
                  {{ m.title }}
                </div>

                <!-- Animated node indicator -->
                <div
                  class="w-6 h-6 rounded-full border-[2px] bg-custom-bg-card flex items-center justify-center transition-all duration-300 relative"
                  :class="m.status === 'completed'
                    ? 'border-primary bg-primary'
                    : m.status === 'in_progress'
                      ? 'border-primary scale-110 shadow-[0_0_0_4px_rgba(201,168,76,0.15)]'
                      : 'border-custom-border'"
                >
                  <!-- Inner checkmark or dot -->
                  <span v-if="m.status === 'completed'" class="material-symbols-outlined text-xs text-on-primary font-bold">check</span>
                  <span v-else-if="m.status === 'in_progress'" class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </div>

                <!-- Label Title -->
                <span class="text-xs font-button text-on-surface truncate max-w-[110px] mt-3 font-semibold">{{ m.title }}</span>
                <!-- Due date -->
                <span class="text-[10px] text-custom-muted mt-1">{{ formatDate(m.due_date) || 'TBD' }}</span>
              </div>

              <!-- Inline "+ Add milestone" trigger -->
              <div class="relative shrink-0 w-32 flex flex-col items-center justify-center">
                <button
                  @click="isAddMilestoneOpen = !isAddMilestoneOpen"
                  class="w-6 h-6 rounded-full border border-dashed border-custom-muted hover:border-primary flex items-center justify-center text-custom-muted hover:text-primary transition-colors"
                >
                  <span class="material-symbols-outlined text-sm">add</span>
                </button>
                <span class="text-[10px] text-custom-muted mt-3 uppercase tracking-wider font-semibold">New</span>

                <!-- Add popover -->
                <div
                  v-if="isAddMilestoneOpen"
                  class="absolute top-16 bg-custom-hover border border-custom-border p-4 rounded-sm shadow-xl w-48 z-30 flex flex-col gap-3"
                >
                  <input
                    v-model="newMilestoneTitle"
                    type="text"
                    placeholder="Milestone Title"
                    class="bg-custom-bg-card border border-custom-border rounded-sm p-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <input
                    v-model="newMilestoneDueDate"
                    type="date"
                    class="bg-custom-bg-card border border-custom-border rounded-sm p-2 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <div class="flex gap-2">
                    <button @click="isAddMilestoneOpen = false" class="flex-1 py-1 text-[10px] border border-custom-border text-on-surface-variant rounded-sm font-button uppercase">Cancel</button>
                    <button @click="handleAddMilestone" class="flex-1 py-1 text-[10px] bg-primary text-on-primary rounded-sm font-button uppercase">Save</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Milestone Inline Editor Details panel -->
            <div v-if="editingMilestoneId" class="mt-4 p-4 border border-custom-border bg-custom-bg-sidebar/40 rounded-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div class="flex flex-col text-left">
                  <span class="text-[9px] uppercase tracking-widest text-custom-muted font-bold">Edit Milestone</span>
                  <span class="text-xs font-semibold text-on-surface mt-0.5">{{ milestones.find(m => m.id === editingMilestoneId)?.title }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <select v-model="editingMilestoneStatus" class="bg-custom-bg-card border border-custom-border rounded-sm py-1.5 px-2.5 text-xs text-on-surface-variant focus:outline-none">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input v-model="editingMilestoneDueDate" type="date" class="bg-custom-bg-card border border-custom-border rounded-sm py-1 px-2 text-xs text-on-surface-variant focus:outline-none" />
                </div>
              </div>
              <div class="flex gap-2 w-full md:w-auto">
                <button @click="handleDeleteMilestone(editingMilestoneId)" class="px-3 py-1.5 border border-red-500/20 text-red-400 text-xs font-button rounded-sm uppercase hover:bg-red-500/5 transition-colors">Delete</button>
                <button @click="editingMilestoneId = null" class="px-3 py-1.5 border border-custom-border text-on-surface-variant text-xs font-button rounded-sm uppercase hover:bg-custom-hover">Cancel</button>
                <button @click="saveMilestoneEdits" class="px-4 py-1.5 bg-primary text-on-primary text-xs font-button rounded-sm uppercase hover:bg-primary-container transition-colors">Save</button>
              </div>
            </div>
          </div>

          <!-- Recent Update summary card -->
          <div class="bg-custom-bg-card border border-custom-border p-6 rounded-sm">
            <h4 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface mb-4">Latest Client update</h4>
            <div v-if="recentUpdate" class="text-left flex flex-col gap-3">
              <div class="bg-custom-bg-sidebar/30 border border-custom-border p-4 rounded-sm text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {{ recentUpdate.content }}
              </div>
              <span class="text-[10px] text-custom-muted self-end">Generated {{ formatDate(recentUpdate.created_at) }} • Status: {{ recentUpdate.read_by_client ? 'Read by Client' : 'Unread' }}</span>
            </div>
            <div v-else class="text-center text-xs text-custom-muted py-4">
              No project summaries generated yet. Click "Generate AI Update" to send your first report.
            </div>
          </div>
        </div>

        <!-- Right panel: Portal Access details -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="bg-custom-bg-card border border-custom-border p-6 rounded-sm flex flex-col gap-5">
            <h4 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface border-b border-custom-border pb-3 text-left">Client Portal Room</h4>
            
            <p class="font-body text-xs text-on-surface-variant leading-relaxed text-left">
              This client has private access to a secure, passwordless dashboard to download assets, approve files, view invoices, and discuss deliverables.
            </p>

            <div class="flex flex-col gap-2 text-left">
              <span class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest font-bold">Portal URL Link</span>
              <div class="bg-custom-hover border border-custom-border rounded-sm p-3 truncate text-xs text-primary font-mono select-all">
                {{ portalUrl }}
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <button @click="copyLink" class="w-full bg-custom-hover hover:bg-custom-border/50 border border-custom-border text-on-surface font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-sm">content_copy</span>
                Copy portal URL
              </button>
              <a :href="portalUrl" target="_blank" class="w-full bg-custom-hover hover:bg-custom-border/50 border border-custom-border text-on-surface font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-sm">open_in_new</span>
                Preview Portal
              </a>
              <a :href="getMailtoLink()" class="w-full bg-custom-hover hover:bg-custom-border/50 border border-custom-border text-on-surface font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-sm">mail</span>
                Send via Email
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: Files -->
      <div v-else-if="activeTab === 'files'">
        <ProjectFiles :projectId="projectId" />
      </div>

      <!-- TAB 3: Invoices -->
      <div v-else-if="activeTab === 'invoices'">
        <div v-if="loadingInvoices" class="py-12">
          <SkeletonLoader type="list-item" :count="2" />
        </div>
        <div v-else-if="invoices.length === 0" class="py-6 text-center">
          <EmptyState
            title="No Invoices generated"
            description="Create project invoices to track billings directly inside your clients portal."
            action-label="Build Invoice"
            :action-route="`/app/invoices/new?clientId=${client?.id}&projectId=${projectId}`"
          />
        </div>
        <div v-else class="flex flex-col gap-3">
          <div
            v-for="invoice in invoices"
            :key="invoice.id"
            @click="router.push(`/app/invoices/${invoice.id}`)"
            class="bg-custom-bg-card border border-custom-border p-4 rounded-sm flex items-center justify-between hover:bg-custom-hover transition-colors cursor-pointer"
          >
            <div class="flex items-center gap-4 text-left">
              <div class="w-10 h-10 rounded-full bg-custom-hover border border-custom-border flex items-center justify-center">
                <span class="material-symbols-outlined text-on-surface-variant">receipt_long</span>
              </div>
              <div>
                <h4 class="font-button text-sm font-semibold text-on-surface">{{ invoice.invoice_number }}</h4>
                <p class="text-xs text-custom-muted mt-0.5">Due: {{ formatDate(invoice.due_date) }} • Total: ${{ invoice.total }}</p>
              </div>
            </div>
            <div>
              <span 
                class="px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded border"
                :class="invoice.status === 'paid' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-warning/10 text-warning border-warning/20'"
              >
                {{ invoice.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 4: Discussion -->
      <div v-else-if="activeTab === 'feedback'">
        <FeedbackThread 
          :projectId="projectId" 
          :currentUser="{ name: profile?.full_name || 'Freelancer', type: 'freelancer' }" 
        />
      </div>
    </div>

    <!-- AI UPDATE MODAL POPUP -->
    <AIUpdateModal
      v-if="isAIModalOpen"
      :projectId="projectId"
      :projectName="project?.name"
      :clientName="client?.name"
      @close="isAIModalOpen = false"
      @update-saved="fetchProjectDetails"
    />
  </div>
</template>
