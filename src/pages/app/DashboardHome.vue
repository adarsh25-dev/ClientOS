<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useScrollAnimations } from '../../composables/useScrollAnimations'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import EmptyState from '../../components/ui/EmptyState.vue'

// Refs
const loading = ref(true)
const clientsCount = ref(0)
const projectsCount = ref(0)
const invoicesCount = ref(0)
const approvalsCount = ref(0)
const recentProjects = ref([])
const deadlines = ref([])

const router = useRouter()

const fetchDashboardData = async () => {
  loading.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Fetch Active Clients Count
    const { count: cCount, error: cErr } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', user.id)
    if (!cErr) clientsCount.value = cCount || 0

    // 2. Fetch Active Projects Count
    const { count: pCount, error: pErr } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', user.id)
      .eq('status', 'active')
    if (!pErr) projectsCount.value = pCount || 0

    // 3. Fetch Invoices Count
    const { count: iCount, error: iErr } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('freelancer_id', user.id)
      .in('status', ['sent', 'viewed', 'paid'])
    if (!iErr) invoicesCount.value = iCount || 0

    // 4. Fetch Pending Approvals Count
    const { count: fCount, error: fErr } = await supabase
      .from('files')
      .select('*, projects!inner(*)')
      .eq('projects.freelancer_id', user.id)
      .eq('status', 'pending', { count: 'exact', head: true })
    if (!fErr) approvalsCount.value = fCount || 0

    // 5. Fetch Recent Projects (Last 5)
    const { data: pList, error: plErr } = await supabase
      .from('projects')
      .select('*, clients(name)')
      .eq('freelancer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    if (!plErr) recentProjects.value = pList || []

    // 6. Fetch Upcoming Deadlines
    const { data: dList, error: dErr } = await supabase
      .from('projects')
      .select('id, name, due_date, status, clients(name)')
      .eq('freelancer_id', user.id)
      .not('due_date', 'is', null)
      .order('due_date', { ascending: true })
      .limit(5)
    if (!dErr) deadlines.value = dList || []
  } catch (err) {
    console.error('Error loading dashboard:', err)
  } finally {
    loading.value = false
  }
}

// Format deadlines: overdue (red), today (amber), upcoming (muted)
const getDeadlineStyle = (dueDate) => {
  const today = new Date().setHours(0, 0, 0, 0)
  const due = new Date(dueDate).setHours(0, 0, 0, 0)

  if (due < today) return { label: 'Overdue', class: 'text-red-500 bg-red-500/5 border-red-500/10' }
  if (due === today) return { label: 'Today', class: 'text-warning bg-warning/5 border-warning/10' }
  return { label: 'Upcoming', class: 'text-on-surface-variant bg-custom-border/20 border-custom-border/30' }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

const getStatusBadgeColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'in progress':
    case 'active':
      return 'bg-primary/10 text-primary border-primary/20'
    case 'planning':
      return 'bg-surface-variant text-on-surface-variant border-outline-variant'
    case 'completed':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'paused':
      return 'bg-gray-500/10 text-on-surface-variant border-gray-500/20'
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-custom-border/20 text-on-surface-variant border-custom-border/30'
  }
}

// Mount GSAP scroll animations
useScrollAnimations()

onMounted(() => {
  fetchDashboardData()
})
</script>

<template>
  <div class="flex flex-col gap-10 text-left">
    <!-- Stat Cards Row -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <SkeletonLoader type="stat" :count="4" />
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-animate="card-grid">
      <!-- Active Clients -->
      <div class="stat-card bg-custom-bg-card border border-custom-border border-l-[3px] border-l-primary-container p-6 rounded-sm relative overflow-hidden group">
        <div class="absolute top-0 right-0 p-4 opacity-5 text-primary group-hover:opacity-10 transition-opacity">
          <span class="material-symbols-outlined text-5xl">group</span>
        </div>
        <p class="font-label-caps text-label-caps text-custom-muted uppercase tracking-widest mb-2">Active Clients</p>
        <div class="font-headline-md text-[40px] leading-none text-on-surface" data-animate="count-up" :data-target="clientsCount">0</div>
      </div>

      <!-- Open Projects -->
      <div class="stat-card bg-custom-bg-card border border-custom-border p-6 rounded-sm relative overflow-hidden group">
        <p class="font-label-caps text-label-caps text-custom-muted uppercase tracking-widest mb-2">Open Projects</p>
        <div class="font-headline-md text-[40px] leading-none text-on-surface" data-animate="count-up" :data-target="projectsCount">0</div>
      </div>

      <!-- Invoices Sent -->
      <div class="stat-card bg-custom-bg-card border border-custom-border p-6 rounded-sm relative overflow-hidden group">
        <p class="font-label-caps text-label-caps text-custom-muted uppercase tracking-widest mb-2">Invoices Sent</p>
        <div class="font-headline-md text-[40px] leading-none text-on-surface" data-animate="count-up" :data-target="invoicesCount">0</div>
      </div>

      <!-- Pending Approvals -->
      <div class="stat-card bg-custom-bg-card border border-custom-border p-6 rounded-sm relative overflow-hidden group">
        <p class="font-label-caps text-label-caps text-custom-muted uppercase tracking-widest mb-2">Pending Approvals</p>
        <div class="font-headline-md text-[40px] leading-none text-on-surface" data-animate="count-up" :data-target="approvalsCount">0</div>
      </div>
    </div>

    <!-- Main Workspace Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <!-- Left: Recent Projects -->
      <div class="lg:col-span-7 flex flex-col gap-4">
        <div class="flex justify-between items-end border-b border-custom-border pb-4 mb-2">
          <h3 class="font-headline-sm text-lg text-on-surface" data-animate="section-header">Recent Projects</h3>
          <router-link to="/app/projects" class="font-label-caps text-label-caps text-primary hover:underline underline-offset-4 transition-all">View All</router-link>
        </div>

        <div v-if="loading" class="flex flex-col gap-3">
          <SkeletonLoader type="list-item" :count="3" />
        </div>

        <div v-else-if="recentProjects.length === 0" class="py-6">
          <EmptyState 
            title="No projects configured" 
            description="Create your first client portal to track project assets, summaries, and milestones."
            action-label="Add project"
            action-route="/app/projects"
          />
        </div>

        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="project in recentProjects" 
            :key="project.id"
            @click="router.push(`/app/projects/${project.id}`)"
            class="bg-custom-bg-card border border-custom-border p-4 rounded-sm flex items-center justify-between hover:bg-custom-hover transition-colors cursor-pointer border-l-[2px] border-l-transparent hover:border-l-primary-container"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full bg-surface flex items-center justify-center border border-outline-variant">
                <span class="material-symbols-outlined text-on-surface-variant text-sm">architecture</span>
              </div>
              <div class="text-left">
                <h4 class="font-button text-on-surface">{{ project.name }}</h4>
                <p class="text-xs text-custom-muted mt-1">{{ project.clients?.name || 'No Client' }} • Due {{ formatDate(project.due_date) || 'No date' }}</p>
              </div>
            </div>
            <div>
              <span class="px-2 py-1 text-[10px] uppercase tracking-wider rounded-sm border" :class="getStatusBadgeColor(project.status)">
                {{ project.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Upcoming Deadlines -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <div class="flex justify-between items-end border-b border-custom-border pb-4 mb-2">
          <h3 class="font-headline-sm text-lg text-on-surface">Upcoming Deadlines</h3>
        </div>

        <div v-if="loading" class="flex flex-col gap-3">
          <SkeletonLoader type="text" :count="1" />
        </div>

        <div v-else-if="deadlines.length === 0" class="bg-custom-bg-card border border-custom-border p-6 rounded-sm text-center text-xs text-custom-muted">
          No upcoming project deadlines.
        </div>

        <div v-else class="bg-custom-bg-card border border-custom-border p-6 rounded-sm relative">
          <!-- Timeline Vertical line -->
          <div class="absolute left-8 top-10 bottom-10 w-[1px] bg-custom-border"></div>

          <div class="flex flex-col gap-6 relative z-10">
            <div 
              v-for="dl in deadlines" 
              :key="dl.id"
              class="flex gap-4 cursor-pointer hover:opacity-80 text-left"
              @click="router.push(`/app/projects/${dl.id}`)"
            >
              <div class="w-4 h-4 rounded-full border-4 mt-1 shrink-0 z-10 shadow-[0_0_0_1px_rgba(201,168,76,0.3)]" :class="dl.due_date && new Date(dl.due_date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) ? 'bg-primary border-[#16161F]' : 'bg-surface-variant border-[#16161F]'"></div>
              <div>
                <p class="font-label-caps text-[10px] text-custom-muted uppercase tracking-widest mb-1">{{ getDeadlineStyle(dl.due_date).label }}</p>
                <h4 class="font-button text-on-surface text-sm">{{ dl.name }}</h4>
                <p class="text-xs text-on-surface-variant mt-1">Client: {{ dl.clients?.name }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
