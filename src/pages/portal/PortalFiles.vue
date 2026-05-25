<script setup>
import { ref, computed } from 'vue'
import { usePortalStore } from '../../stores/portal'
import { useToast } from '../../composables/useToast'
import { supabase } from '../../lib/supabase'
import FeedbackThread from '../../components/FeedbackThread.vue'

const portalStore = usePortalStore()
const toast = useToast()

const files = computed(() => portalStore.files)
const activeProject = computed(() => portalStore.activeProject)
const client = computed(() => portalStore.client)

// State
const expandedFileId = ref(null)
const changesFeedback = ref({}) // key: fileId, value: commentText
const requestingChangesId = ref(null) // tracks which file is actively prompting for changes comment

const handleApprove = async (fileId) => {
  try {
    await portalStore.approveFile(fileId)
    toast.success('Deliverable marked as approved')
  } catch (err) {
    toast.error('Approval failed')
  }
}

const handleRequestChanges = async (fileId) => {
  const text = changesFeedback.value[fileId]?.trim()
  if (!text) {
    toast.warning('Please enter details about the changes needed')
    return
  }

  try {
    await portalStore.requestChanges(fileId, text)
    toast.success('Changes requested and feedback sent')
    
    // Clear state
    changesFeedback.value[fileId] = ''
    requestingChangesId.value = null
  } catch (err) {
    toast.error('Submission failed')
  }
}

const downloadFile = async (file) => {
  try {
    const { data, error } = await supabase.storage
      .from('clientos-files')
      .createSignedUrl(file.storage_path, 3600)
    if (error) throw error
    window.open(data.signedUrl, '_blank')
  } catch (err) {
    toast.error('Download failed')
  }
}

// Helpers
const getFileIcon = (type) => {
  if (!type) return 'insert_drive_file'
  if (type.includes('image')) return 'image'
  if (type.includes('pdf')) return 'picture_as_pdf'
  if (type.includes('zip') || type.includes('compressed')) return 'archive'
  return 'insert_drive_file'
}

const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

const getStatusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'changes_requested':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-warning/10 text-warning border-warning/20'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'approved': return 'Approved'
    case 'changes_requested': return 'Changes Requested'
    default: return 'Awaiting Review'
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    <!-- Header -->
    <div class="border-b border-[#1E2030] pb-6 mb-2">
      <h2 class="font-display text-2xl text-[#F0EDE6] mb-1">Deliverables</h2>
      <p class="font-body text-xs text-[#A0A0B0]">Review project assets, sign off on completed items, and request changes.</p>
    </div>

    <!-- Empty state -->
    <div v-if="files.length === 0" class="py-16 text-center border border-dashed border-[#1E2030] rounded-sm">
      <span class="material-symbols-outlined text-4xl text-[#5A5A6A] mb-3">folder_open</span>
      <h4 class="text-sm font-semibold text-[#F0EDE6] uppercase tracking-widest mb-1">No deliverables uploaded</h4>
      <p class="text-xs text-[#5A5A70]">Your project team hasn't uploaded any deliverables yet.</p>
    </div>

    <!-- Files listing grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="file in files"
        :key="file.id"
        class="bg-[#16161F] border border-[#1E2030] rounded-sm p-5 flex flex-col gap-4 relative group"
        :class="file.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/[0.01]' : ''"
      >
        <!-- Info row -->
        <div class="flex justify-between items-start">
          <div class="flex items-center gap-3 cursor-pointer" @click="downloadFile(file)">
            <span class="material-symbols-outlined text-2xl text-[#C9A84C]">
              {{ getFileIcon(file.file_type) }}
            </span>
            <div class="text-left max-w-[160px]">
              <h4 class="text-xs font-semibold text-[#F0EDE6] truncate hover:text-[#C9A84C] transition-colors">{{ file.name }}</h4>
              <p class="text-[10px] text-[#5A5A70] mt-0.5">{{ formatDate(file.uploaded_at) }}</p>
            </div>
          </div>

          <span class="text-[10px] uppercase font-bold tracking-wider text-[#C9A84C] bg-[#C9A84C]/5 px-2 py-0.5 rounded border border-[#C9A84C]/10 font-semibold select-none">
            v{{ file.version }}
          </span>
        </div>

        <!-- Status & Expansion toggle -->
        <div class="flex items-center justify-between mt-1">
          <span class="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border" :class="getStatusClass(file.status)">
            {{ getStatusLabel(file.status) }}
          </span>

          <button
            @click="expandedFileId = expandedFileId === file.id ? null : file.id"
            class="text-xs font-button uppercase tracking-wider text-[#5A5A70] hover:text-[#C9A84C] flex items-center gap-1"
          >
            <span>Feedback</span>
            <span class="material-symbols-outlined text-sm transition-transform" :class="expandedFileId === file.id ? 'rotate-180' : ''">keyboard_arrow_down</span>
          </button>
        </div>

        <!-- Action panel for clients (pending files only) -->
        <div v-if="file.status === 'pending'" class="flex gap-2 border-t border-[#1E2030]/50 pt-4 mt-1">
          <button
            @click="requestingChangesId = file.id"
            class="flex-1 border border-[#1E2030] hover:border-red-500/30 text-xs font-button uppercase tracking-wider text-[#A0A0B0] hover:text-red-400 py-2.5 rounded-sm transition-colors text-center"
          >
            Request Changes
          </button>
          <button
            @click="handleApprove(file.id)"
            class="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-button uppercase tracking-wider py-2.5 rounded-sm transition-colors text-center"
          >
            Approve ✓
          </button>
        </div>

        <!-- Action details form for requesting changes inline -->
        <div v-if="requestingChangesId === file.id" class="border-t border-[#1E2030]/50 pt-4 mt-2 flex flex-col gap-2.5">
          <textarea
            v-model="changesFeedback[file.id]"
            class="w-full h-20 bg-[#1A1A25] border border-[#1E2030] rounded-sm p-2 text-xs text-[#F0EDE6] placeholder-[#5A5A6A] focus:outline-none focus:border-[#C9A84C]"
            placeholder="Describe what changes are needed..."
          ></textarea>
          <div class="flex gap-2 justify-end">
            <button @click="requestingChangesId = null" class="px-2.5 py-1 text-[10px] border border-[#1E2030] text-[#5A5A70] uppercase font-button rounded-sm">Cancel</button>
            <button @click="handleRequestChanges(file.id)" class="px-3 py-1 text-[10px] bg-red-500/25 border border-red-500/40 text-red-300 uppercase font-button rounded-sm">Send Request</button>
          </div>
        </div>

        <div 
          v-if="expandedFileId === file.id" 
          class="border-t border-[#1E2030]/50 pt-4 mt-2 animate-fade-in h-[380px]"
        >
          <FeedbackThread
            v-if="activeProject"
            :projectId="activeProject.id"
            :fileId="file.id"
            :currentUser="{ name: client?.name || 'Client', type: 'client' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
