<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { useClientsStore } from '../../stores/clients'
import { useProjectsStore } from '../../stores/projects'

const { profile, signOut } = useAuth()
const router = useRouter()
const route = useRoute()

const clientsStore = useClientsStore()
const projectsStore = useProjectsStore()

// State
const searchQuery = ref('')
const isSearchOpen = ref(false)
const isUserDropdownOpen = ref(false)

// Navigation items
const navItems = [
  { label: 'Dashboard', icon: 'dashboard', path: '/app/dashboard' },
  { label: 'Clients', icon: 'group', path: '/app/clients' },
  { label: 'Projects', icon: 'account_tree', path: '/app/projects' },
  { label: 'Invoices', icon: 'receipt_long', path: '/app/invoices' },
  { label: 'Settings', icon: 'settings', path: '/app/settings' }
]

// Greeting derived from current hour
const greeting = computed(() => {
  const hr = new Date().getHours()
  const name = profile.value?.full_name?.split(' ')[0] || 'User'
  if (hr < 12) return `Good morning, ${name}.`
  if (hr < 18) return `Good afternoon, ${name}.`
  return `Good evening, ${name}.`
})

// Search matches
const filteredResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []

  const matchedClients = clientsStore.clients
    .filter(c => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q))
    .map(c => ({ id: c.id, type: 'client', title: c.name, subtitle: c.company || 'Client', path: `/app/clients/${c.id}` }))

  const matchedProjects = projectsStore.projects
    .filter(p => p.name.toLowerCase().includes(q))
    .map(p => ({ id: p.id, type: 'project', title: p.name, subtitle: 'Project', path: `/app/projects/${p.id}` }))

  return [...matchedClients, ...matchedProjects].slice(0, 8)
})

// Actions
const handleSearchNavigate = (path) => {
  isSearchOpen.value = false
  searchQuery.value = ''
  router.push(path)
}

const handleSignOut = async () => {
  await signOut()
  router.push('/login')
}

// Load search pool
onMounted(() => {
  clientsStore.fetchClients()
  projectsStore.fetchProjects()

  // Keybindings for command palette (Cmd/Ctrl + K)
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      isSearchOpen.value = !isSearchOpen.value
    }
  })
})
</script>

<template>
  <div class="min-h-screen bg-background text-on-background flex font-body-md overflow-x-hidden selection:bg-primary-container selection:text-on-primary-container">
    <!-- SIDEBAR NAV (Desktop only: hidden on mobile) -->
    <nav class="no-print hidden md:flex w-[240px] h-screen fixed left-0 top-0 bg-custom-bg-sidebar border-r border-custom-border flex-col py-8 z-50">
      <div class="px-6 mb-12">
        <h1 class="font-headline-md text-headline-md text-primary tracking-tighter">ClientOS</h1>
        <p class="font-label-caps text-label-caps text-custom-muted mt-1 uppercase tracking-widest text-[10px]">Elite Management</p>
      </div>

      <ul class="flex-1 flex flex-col gap-2 px-4">
        <li v-for="item in navItems" :key="item.path" class="stagger-item opacity-100 transform-none">
          <router-link
            :to="item.path"
            class="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:text-primary hover:bg-custom-hover transition-colors duration-300 rounded-r-lg border-l-[2px] border-transparent group"
            active-class="bg-custom-hover text-primary border-l-primary-container"
          >
            <span class="material-symbols-outlined" :style="route.path.includes(item.path) ? 'font-variation-settings: \'FILL\' 1;' : ''">{{ item.icon }}</span>
            <span class="font-button text-button">{{ item.label }}</span>
          </router-link>
        </li>
      </ul>

      <!-- User Profile Card -->
      <div class="px-6 mt-auto">
        <div 
          @click="isUserDropdownOpen = !isUserDropdownOpen"
          class="flex items-center gap-3 py-4 border-t border-custom-border cursor-pointer hover:opacity-80 transition-opacity relative"
        >
          <div class="w-10 h-10 rounded-full bg-surface-variant overflow-hidden flex-shrink-0 border border-outline-variant flex items-center justify-center">
            <img v-if="profile?.logo_url" :src="profile.logo_url" alt="Avatar" class="w-full h-full object-cover" />
            <span v-else class="text-sm font-semibold text-primary">{{ profile?.full_name?.charAt(0) || 'U' }}</span>
          </div>
          <div class="flex flex-col text-left">
            <span class="font-button text-button text-on-surface truncate max-w-[120px]">{{ profile?.full_name || 'Freelancer' }}</span>
            <span class="text-[10px] uppercase tracking-widest text-primary-container font-semibold mt-0.5">{{ profile?.plan || 'Free' }} Plan</span>
          </div>

          <!-- Dropdown -->
          <div 
            v-if="isUserDropdownOpen" 
            class="absolute bottom-16 left-0 bg-custom-bg-card border border-custom-border w-full rounded-sm py-2 shadow-xl z-50 flex flex-col text-left text-sm"
          >
            <router-link to="/app/settings" class="px-4 py-2 hover:bg-custom-hover text-on-surface-variant hover:text-primary transition-colors">Settings</router-link>
            <button @click="handleSignOut" class="px-4 py-2 text-left hover:bg-custom-hover text-error hover:text-error-container transition-colors">Sign Out</button>
          </div>
        </div>
      </div>
    </nav>

    <!-- MOBILE BOTTOM BAR (Visible only on screens < 768px) -->
    <nav class="no-print md:hidden fixed bottom-0 left-0 right-0 bg-custom-bg-sidebar border-t border-custom-border flex justify-around py-3 z-50">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-col items-center gap-1 text-on-surface-variant"
        active-class="text-primary"
      >
        <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
        <span class="text-[9px] uppercase tracking-wider font-medium">{{ item.label }}</span>
      </router-link>
    </nav>

    <!-- MAIN WORKSPACE -->
    <div class="flex-1 md:ml-[240px] flex flex-col min-h-screen pb-20 md:pb-0">
      <!-- TOP BAR -->
      <header class="no-print flex justify-between items-center px-6 md:px-10 py-6 md:py-8 bg-background sticky top-0 z-40 border-b border-transparent">
        <h2 class="font-headline-sm text-headline-sm text-on-background text-left">{{ greeting }}</h2>
        
        <div class="flex items-center gap-6">
          <!-- Desktop Search Trigger -->
          <div 
            @click="isSearchOpen = true"
            class="relative hidden md:block cursor-pointer"
          >
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-custom-muted text-sm">search</span>
            <input readonly class="bg-custom-bg-card border border-custom-border rounded-full py-2 pl-10 pr-4 text-sm text-on-surface focus:outline-none focus:border-primary-container transition-colors w-64 placeholder:text-custom-muted pointer-events-none" placeholder="Search..." type="text"/>
          </div>

          <!-- Notification Indicator -->
          <button class="relative text-on-surface-variant hover:text-primary transition-colors">
            <span class="material-symbols-outlined">notifications</span>
            <span class="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background"></span>
          </button>
        </div>
      </header>

      <!-- ROUTER VIEW OUTLET -->
      <main class="p-6 md:p-10 max-w-7xl mx-auto w-full flex-grow flex flex-col">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <keep-alive :include="['DashboardHome', 'ClientsList']">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>

    <!-- COMMAND PALETTE MODAL -->
    <div 
      v-if="isSearchOpen"
      class="fixed inset-0 bg-background/90 backdrop-blur-sm z-[9999] flex items-start justify-center pt-[15vh] px-4"
      @click.self="isSearchOpen = false"
    >
      <div class="bg-custom-bg-card border border-custom-border rounded-sm max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
        <!-- Input Header -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-custom-border">
          <span class="material-symbols-outlined text-custom-muted">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            class="flex-1 bg-transparent border-0 text-sm focus:ring-0 text-on-surface placeholder-custom-muted p-0"
            placeholder="Search projects or clients..."
            ref="searchInput"
            v-focus
            @keydown.esc="isSearchOpen = false"
          />
          <button @click="isSearchOpen = false" class="text-xs uppercase tracking-widest font-button text-custom-muted hover:text-on-surface transition-colors">ESC</button>
        </div>

        <!-- Results List -->
        <div class="max-h-[300px] overflow-y-auto py-2">
          <div v-if="filteredResults.length > 0" class="flex flex-col">
            <div 
              v-for="item in filteredResults" 
              :key="item.id"
              @click="handleSearchNavigate(item.path)"
              class="flex items-center justify-between px-4 py-3 hover:bg-custom-hover cursor-pointer transition-colors border-l-[2px] border-transparent hover:border-l-primary"
            >
              <div class="flex flex-col text-left">
                <span class="text-sm font-medium text-on-surface">{{ item.title }}</span>
                <span class="text-xs text-custom-muted mt-0.5">{{ item.subtitle }}</span>
              </div>
              <span class="text-[10px] uppercase tracking-wider text-primary font-semibold bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{{ item.type }}</span>
            </div>
          </div>
          <div v-else-if="searchQuery.trim()" class="py-8 text-center text-sm text-custom-muted">
            No results found for "{{ searchQuery }}"
          </div>
          <div v-else class="py-8 text-center text-sm text-custom-muted">
            Type a query to search clients and projects
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
