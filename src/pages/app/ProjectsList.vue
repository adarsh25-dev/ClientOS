<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../../stores/projects'
import { useClientsStore } from '../../stores/clients'
import { useToast } from '../../composables/useToast'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import EmptyState from '../../components/ui/EmptyState.vue'

const projectsStore = useProjectsStore()
const clientsStore = useClientsStore()
const toast = useToast()
const router = useRouter()

// Refs
const searchQuery = ref('')
const isAddModalOpen = ref(false)
const isSubmitting = ref(false)

// Form fields
const newProjectName = ref('')
const newProjectDesc = ref('')
const newProjectClientId = ref('')
const newProjectDueDate = ref('')

const handleAddProject = async () => {
  if (!newProjectName.value || !newProjectClientId.value) {
    toast.error('Project Name and Client are required')
    return
  }

  isSubmitting.value = true
  try {
    const data = await projectsStore.createProject({
      name: newProjectName.value,
      description: newProjectDesc.value,
      clientId: newProjectClientId.value,
      dueDate: newProjectDueDate.value || null
    })

    toast.success('Project created successfully')
    closeAddModal()
    router.push(`/app/projects/${data.id}`)
  } catch (err) {
    toast.error('Failed to create project: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const closeAddModal = () => {
  isAddModalOpen.value = false
  newProjectName.value = ''
  newProjectDesc.value = ''
  newProjectClientId.value = ''
  newProjectDueDate.value = ''
}

// Filter projects
const filteredProjects = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return projectsStore.projects

  return projectsStore.projects.filter(p => 
    p.name.toLowerCase().includes(q) ||
    p.clients?.name?.toLowerCase().includes(q)
  )
})

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-warning/10 text-warning border-warning/20'
    case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'paused': return 'bg-gray-500/10 text-on-surface-variant border-gray-500/20'
    default: return 'bg-red-500/10 text-red-400 border-red-500/20'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

onMounted(() => {
  projectsStore.fetchProjects()
  clientsStore.fetchClients()
})
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-custom-border pb-6">
      <div>
        <h2 class="font-display text-2xl text-on-surface mb-1">Projects</h2>
        <p class="font-body text-xs text-on-surface-variant">Track development pipelines, milestones, and client portals.</p>
      </div>
      <button
        @click="isAddModalOpen = true"
        class="btn-accent text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-sm">add</span>
        New Project
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 max-w-md w-full relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-custom-muted text-sm">search</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter projects by title or client..."
        class="w-full bg-custom-bg-card border border-custom-border rounded-sm py-2 pl-10 pr-4 text-sm text-on-surface placeholder-custom-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>

    <!-- Skeletons -->
    <div v-if="projectsStore.loading && projectsStore.projects.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" :count="3" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredProjects.length === 0" class="py-12">
      <EmptyState
        title="No projects found"
        description="Add a project to configure milestones, deliver assets, and review feedback."
        action-label="New Project"
        @click="isAddModalOpen = true"
      />
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        @click="router.push(`/app/projects/${project.id}`)"
        class="bg-custom-bg-card border border-custom-border rounded-sm p-6 flex flex-col gap-6 relative group transition-all hover:translate-y-[-2px] hover:shadow-lg cursor-pointer hover:border-primary/20"
      >
        <div class="flex justify-between items-start">
          <div class="text-left">
            <h4 class="font-button text-sm font-semibold text-on-surface truncate max-w-[180px]">{{ project.name }}</h4>
            <p class="text-xs text-custom-muted mt-1">Client: <strong class="text-on-surface-variant">{{ project.clients?.name }}</strong></p>
          </div>
          <span class="px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border" :class="getStatusColor(project.status)">
            {{ project.status }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs border-t border-custom-border pt-4 mt-auto">
          <span class="text-custom-muted">Due Date</span>
          <span class="text-on-surface-variant font-medium">{{ formatDate(project.due_date) || 'TBD' }}</span>
        </div>
      </div>
    </div>

    <!-- ADD PROJECT MODAL -->
    <Teleport to="body">
      <div
        v-if="isAddModalOpen"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        @click.self="closeAddModal"
      >
        <div class="bg-custom-bg-card border border-custom-border rounded-sm max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-left">
          <div class="px-6 py-4 bg-custom-bg-sidebar border-b border-custom-border flex justify-between items-center">
            <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface">Create New Project</h3>
            <button @click="closeAddModal" class="text-custom-muted hover:text-on-surface">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div class="p-6 flex flex-col gap-5">
            <!-- Name -->
            <div class="border-b border-custom-border pb-2">
              <input
                v-model="newProjectName"
                type="text"
                placeholder="Project Title *"
                class="w-full bg-transparent border-none p-0 pb-1 text-sm text-on-surface placeholder-custom-muted/50 focus:ring-0 focus:outline-none"
              />
            </div>

            <!-- Client Select -->
            <div class="flex flex-col">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Select Client *</label>
              <select
                v-model="newProjectClientId"
                class="bg-custom-hover border border-custom-border rounded-sm py-2 px-3 text-xs text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="" disabled>Choose client...</option>
                <option v-for="c in clientsStore.clients" :key="c.id" :value="c.id">{{ c.name }} ({{ c.company }})</option>
              </select>
            </div>

            <!-- Description -->
            <div class="flex flex-col text-left">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Description</label>
              <textarea
                v-model="newProjectDesc"
                class="w-full h-20 bg-custom-hover border border-custom-border rounded-sm p-3 text-xs text-on-surface placeholder-custom-muted focus:outline-none resize-none"
                placeholder="Short description of project scope..."
              ></textarea>
            </div>

            <!-- Due Date -->
            <div class="flex flex-col">
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Target Due Date</label>
              <input v-model="newProjectDueDate" type="date" class="bg-custom-hover border border-custom-border rounded-sm p-2 text-xs text-on-surface focus:outline-none focus:border-primary" />
            </div>

            <!-- Action buttons -->
            <div class="flex gap-3 mt-2">
              <button
                @click="closeAddModal"
                class="flex-1 border border-custom-border hover:bg-custom-hover text-xs font-button uppercase tracking-widest py-3 rounded-sm transition-colors text-center text-on-surface"
              >
                Cancel
              </button>
              <button
                @click="handleAddProject"
                :disabled="isSubmitting"
                class="flex-1 btn-accent text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <template v-if="isSubmitting">
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </template>
                <template v-else>
                  Build Project
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
