<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClientsStore } from '../../stores/clients'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { supabase } from '../../lib/supabase'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import EmptyState from '../../components/ui/EmptyState.vue'

const clientsStore = useClientsStore()
const { profile } = useAuth()
const toast = useToast()

// Refs
const searchQuery = ref('')
const isAddModalOpen = ref(false)
const activeMenuId = ref(null) // tracks active three-dot menu ID
const copiedTokenId = ref(null) // tracks copied client ID for tooltips

// Add form states
const newClientName = ref('')
const newClientCompany = ref('')
const newClientEmail = ref('')
const newClientLogoFile = ref(null)
const newClientLogoPreview = ref(null)
const isSubmitting = ref(false)

const fileInput = ref(null)

const triggerFileSelect = () => fileInput.value?.click()

const handleFileSelect = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Logo file size must be less than 2MB')
    return
  }

  newClientLogoFile.value = file
  newClientLogoPreview.value = URL.createObjectURL(file)
}

const handleAddClient = async () => {
  if (!newClientName.value || !newClientEmail.value) {
    toast.error('Name and Email are required')
    return
  }

  isSubmitting.value = true
  try {
    let logoUrl = null
    // 1. Upload Logo if present
    if (newClientLogoFile.value) {
      const ext = newClientLogoFile.value.name.split('.').pop()
      const storagePath = `${Date.now()}_logo.${ext}`
      
      const { error: uploadError } = await supabase.storage
        .from('clientos-files')
        .upload(storagePath, newClientLogoFile.value)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('clientos-files')
        .getPublicUrl(storagePath)
      logoUrl = publicUrl
    }

    // 2. Insert Client
    await clientsStore.createClient({
      name: newClientName.value,
      company: newClientCompany.value,
      email: newClientEmail.value,
      logoUrl
    })

    toast.success('Client added successfully')
    closeAddModal()
  } catch (err) {
    toast.error('Failed to add client: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const closeAddModal = () => {
  isAddModalOpen.value = false
  newClientName.value = ''
  newClientCompany.value = ''
  newClientEmail.value = ''
  newClientLogoFile.value = null
  newClientLogoPreview.value = null
}

const handleDeleteClient = async (clientId) => {
  const confirmed = confirm('This will also delete all projects, files, and invoices for this client. Are you sure?')
  if (!confirmed) return

  try {
    await clientsStore.deleteClient(clientId)
    toast.success('Client deleted')
  } catch (err) {
    toast.error('Failed to delete client: ' + err.message)
  }
}

const copyPortalLink = (client) => {
  const slug = profile.value?.portal_slug
  if (!slug) {
    toast.warning('Please configure your Portal Slug in Settings first.')
    return
  }

  const link = `${window.location.origin}/portal/${slug}?token=${client.portal_access_token}`
  navigator.clipboard.writeText(link)
  copiedTokenId.value = client.id
  setTimeout(() => {
    copiedTokenId.value = null
  }, 2000)
}

// Client filtering
const filteredClients = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return clientsStore.clients

  return clientsStore.clients.filter(c => 
    c.name.toLowerCase().includes(q) ||
    c.company?.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  )
})

onMounted(() => {
  clientsStore.fetchClients()
})
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-custom-border pb-6">
      <div>
        <h2 class="font-display text-2xl text-on-surface mb-1">Clients</h2>
        <p class="font-body text-xs text-on-surface-variant">Manage client portals, review access, and track pipelines.</p>
      </div>
      <button
        @click="isAddModalOpen = true"
        class="btn-accent text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-sm">person_add</span>
        Add Client
      </button>
    </div>

    <!-- Search / Filter bar -->
    <div class="flex gap-4 max-w-md w-full relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-custom-muted text-sm">search</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter clients by name, company, or email..."
        class="w-full bg-custom-bg-card border border-custom-border rounded-sm py-2 pl-10 pr-4 text-sm text-on-surface placeholder-custom-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>

    <!-- Loading Skeleton Grid -->
    <div v-if="clientsStore.loading && clientsStore.clients.length === 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" :count="3" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredClients.length === 0" class="py-12">
      <EmptyState
        title="No clients found"
        description="Add a client to invite them to their custom-branded portal room."
        action-label="Add Client"
        @click="isAddModalOpen = true"
      />
    </div>

    <!-- Client Cards Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="client in filteredClients"
        :key="client.id"
        class="bg-custom-bg-card border border-custom-border rounded-sm p-6 flex flex-col gap-6 relative group transition-all hover:translate-y-[-2px] hover:shadow-lg"
      >
        <!-- Top bar of card -->
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3">
            <div v-if="client.logo_url" class="w-12 h-12 rounded-full overflow-hidden border border-custom-border">
              <img :src="client.logo_url" :alt="client.name" class="w-full h-full object-cover" />
            </div>
            <div v-else class="w-12 h-12 rounded-full bg-custom-hover border border-custom-border flex items-center justify-center text-sm font-semibold text-primary">
              {{ client.name.charAt(0) }}
            </div>
            <div class="text-left">
              <h4 class="font-button text-sm font-semibold text-on-surface">{{ client.name }}</h4>
              <p class="text-xs text-custom-muted mt-0.5">{{ client.company || 'Individual Client' }}</p>
            </div>
          </div>

          <!-- Actions dropdown -->
          <div class="relative">
            <button
              @click="activeMenuId = activeMenuId === client.id ? null : client.id"
              class="text-custom-muted hover:text-on-surface transition-colors"
            >
              <span class="material-symbols-outlined text-sm">more_vert</span>
            </button>
            <div
              v-if="activeMenuId === client.id"
              class="absolute right-0 top-6 bg-custom-hover border border-custom-border rounded-sm py-1.5 shadow-xl w-32 z-20 flex flex-col text-left text-xs"
            >
              <button
                @click="handleDeleteClient(client.id); activeMenuId = null"
                class="px-3 py-2 text-error hover:bg-custom-bg-card hover:text-error-container transition-colors text-left flex items-center gap-1.5"
              >
                <span class="material-symbols-outlined text-sm">delete</span>
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Middle Info: email, project counts -->
        <div class="flex flex-col gap-2.5 text-xs border-t border-b border-custom-border py-4 text-left">
          <div class="flex items-center justify-between">
            <span class="text-custom-muted">Email</span>
            <span class="text-on-surface-variant truncate max-w-[180px]">{{ client.email }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-custom-muted">Portal Projects</span>
            <span class="text-primary font-semibold">{{ client.projectCount || 0 }}</span>
          </div>
        </div>

        <!-- Actions panel -->
        <div class="flex items-center gap-3">
          <button
            @click="copyPortalLink(client)"
            class="flex-1 bg-custom-hover hover:bg-custom-bg-card border border-custom-border text-on-surface-variant hover:text-primary font-button text-[10px] uppercase tracking-wider py-2.5 rounded-sm transition-all flex items-center justify-center gap-1.5"
          >
            <span class="material-symbols-outlined text-xs">link</span>
            {{ copiedTokenId === client.id ? 'Copied!' : 'Copy Portal Link' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ADD CLIENT MODAL (Teleport) -->
    <Teleport to="body">
      <div
        v-if="isAddModalOpen"
        class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        @click.self="closeAddModal"
      >
        <div class="bg-custom-bg-card border border-custom-border rounded-sm max-w-md w-full overflow-hidden shadow-2xl flex flex-col text-left">
          <div class="px-6 py-4 bg-custom-bg-sidebar border-b border-custom-border flex justify-between items-center">
            <h3 class="font-headline-sm text-sm uppercase tracking-widest text-on-surface">Add New Client</h3>
            <button @click="closeAddModal" class="text-custom-muted hover:text-on-surface">
              <span class="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          <div class="p-6 flex flex-col gap-5">
            <!-- Logo Select -->
            <div>
              <label class="font-label-caps text-[9px] text-custom-muted uppercase tracking-widest block mb-2 font-bold font-sans">Client Logo (Optional)</label>
              <div
                @click="triggerFileSelect"
                class="border border-dashed border-custom-border hover:border-primary/30 bg-custom-hover/40 p-4 rounded-sm flex items-center gap-4 cursor-pointer transition-colors"
              >
                <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
                <div v-if="newClientLogoPreview" class="w-10 h-10 rounded-full overflow-hidden border border-custom-border">
                  <img :src="newClientLogoPreview" alt="Preview" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-full bg-custom-hover border border-custom-border flex items-center justify-center text-custom-muted">
                  <span class="material-symbols-outlined text-sm">add_a_photo</span>
                </div>
                <span class="text-xs text-on-surface-variant">Click to select logo image</span>
              </div>
            </div>

            <!-- Name -->
            <div class="border-b border-custom-border pb-2">
              <input
                v-model="newClientName"
                type="text"
                placeholder="Client Name *"
                class="w-full bg-transparent border-none p-0 pb-1 text-sm text-on-surface placeholder-custom-muted/50 focus:ring-0 focus:outline-none"
              />
            </div>

            <!-- Company -->
            <div class="border-b border-custom-border pb-2">
              <input
                v-model="newClientCompany"
                type="text"
                placeholder="Company Name (Optional)"
                class="w-full bg-transparent border-none p-0 pb-1 text-sm text-on-surface placeholder-custom-muted/50 focus:ring-0 focus:outline-none"
              />
            </div>

            <!-- Email -->
            <div class="border-b border-custom-border pb-2">
              <input
                v-model="newClientEmail"
                type="email"
                placeholder="Client Email *"
                class="w-full bg-transparent border-none p-0 pb-1 text-sm text-on-surface placeholder-custom-muted/50 focus:ring-0 focus:outline-none"
              />
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
                @click="handleAddClient"
                :disabled="isSubmitting"
                class="flex-1 btn-accent text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <template v-if="isSubmitting">
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce"></span>
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span class="w-1.5 h-1.5 bg-on-primary rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </template>
                <template v-else>
                  Save Client
                </template>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
