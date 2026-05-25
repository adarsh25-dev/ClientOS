<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useAI } from '../../composables/useAI'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import FeedbackThread from '../../components/FeedbackThread.vue'

import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js'

// Configure PDF.js worker from CDN to avoid build issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
})

const { user, profile } = useAuth()
const toast = useToast()
const ai = useAI()

// Refs
const files = ref([])
const displayedFiles = ref([])
const loading = ref(true)
const searchQuery = ref('')
let searchTimeout = null
const uploadsInProgress = ref([]) // tracks active upload items: { name, progress }
const isDetailModalOpen = ref(false)
const selectedFile = ref(null)

const fileInput = ref(null)
const isDragging = ref(false)

const fetchFiles = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('project_id', props.projectId)
      .order('uploaded_at', { ascending: false })
    if (error) throw error
    files.value = data || []
    
    // Re-run search if there was a query, otherwise just display all
    if (searchQuery.value) {
      displayedFiles.value = await ai.searchFiles(searchQuery.value, files.value)
    } else {
      displayedFiles.value = files.value
    }
  } catch (err) {
    console.error('Error fetching files:', err)
  } finally {
    loading.value = false
  }
}

watch(searchQuery, (newVal) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!newVal) {
    displayedFiles.value = files.value
    return
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      displayedFiles.value = await ai.searchFiles(newVal, files.value)
    } catch (err) {
      console.error(err)
    }
  }, 500)
})

// Drag & Drop handlers
const handleDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const dropped = e.dataTransfer.files
  if (dropped.length > 0) {
    processFiles(dropped)
  }
}

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e) => {
  const selected = e.target.files
  if (selected.length > 0) {
    processFiles(selected)
  }
}

const processFiles = async (fileList) => {
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i]
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File ${file.name} exceeds the 50MB limit`)
      continue
    }

    // Check version conflict
    const existing = files.value.filter(f => f.name === file.name)
    let version = 1
    if (existing.length > 0) {
      const maxVer = Math.max(...existing.map(f => f.version))
      const confirmed = confirm(`A file named "${file.name}" already exists (v${maxVer}). Upload as v${maxVer + 1}?`)
      if (!confirmed) continue
      version = maxVer + 1
    }

    await uploadFile(file, version)
  }
  fetchFiles()
}

const uploadFile = async (file, version) => {
  const uploadItem = { name: file.name, progress: 0 }
  uploadsInProgress.value.push(uploadItem)

  try {
    // Extract text content for semantic indexing
    const contentText = await extractFileText(file)
    const storagePath = `${user.value.id}/${props.projectId}/${Date.now()}_${file.name}`
    
    // Upload using Supabase storage Client
    const { error: uploadErr } = await supabase.storage
      .from('clientos-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadErr) throw uploadErr

    // Insert file record
    const { error: dbErr } = await supabase
      .from('files')
      .insert({
        project_id: props.projectId,
        name: file.name,
        storage_path: storagePath,
        file_type: file.type || file.name.split('.').pop(),
        version,
        status: 'pending'
      })

    if (dbErr) throw dbErr
    toast.success(`Uploaded ${file.name} (v${version})`)
  } catch (err) {
    console.error('File upload error:', err)
    toast.error(`Failed to upload ${file.name}: ${err.message}`)
  } finally {
    uploadsInProgress.value = uploadsInProgress.value.filter(u => u.name !== file.name)
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
    toast.error('Download failed: ' + err.message)
  }
}

const deleteFile = async (file) => {
  if (!confirm(`Are you sure you want to delete ${file.name} (v${file.version})?`)) return
  try {
    // 1. Delete DB record
    const { error: dbErr } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id)
    if (dbErr) throw dbErr

    // 2. Delete storage file
    const { error: storageErr } = await supabase.storage
      .from('clientos-files')
      .remove([file.storage_path])
    if (storageErr) console.warn('Failed to clean up storage path:', storageErr)

    toast.success('File deleted')
    fetchFiles()
    if (selectedFile.value?.id === file.id) {
      isDetailModalOpen.value = false
    }
  } catch (err) {
    toast.error('Failed to delete file: ' + err.message)
  }
}

// Update file state directly (Freelancer review override)
const updateFileStatus = async (status) => {
  if (!selectedFile.value) return
  try {
    const { error } = await supabase
      .from('files')
      .update({ status })
      .eq('id', selectedFile.value.id)
    if (error) throw error

    selectedFile.value.status = status
    toast.success(`File marked as ${status}`)
    fetchFiles()
  } catch (err) {
    toast.error('Failed to update file status')
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

const openDetail = (file) => {
  selectedFile.value = file
  isDetailModalOpen.value = true
}

const fileCategory = computed(() => {
  if (!selectedFile.value) return 'unknown'
  const t = selectedFile.value.file_type?.toLowerCase() || ''
  const n = selectedFile.value.name?.toLowerCase() || ''
  
  if (t.includes('image') || n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp')) return 'image'
  if (t.includes('pdf') || n.endsWith('.pdf')) return 'pdf'
  if (t.includes('word') || t.includes('excel') || t.includes('powerpoint') || t.includes('officedocument') || n.endsWith('.doc') || n.endsWith('.docx') || n.endsWith('.xls') || n.endsWith('.xlsx') || n.endsWith('.ppt') || n.endsWith('.pptx')) return 'office'
  if (t.includes('csv') || n.endsWith('.csv')) return 'csv'
  if (t.includes('text') || n.endsWith('.txt') || n.endsWith('.md')) return 'text'
  if (t.includes('video') || n.endsWith('.mp4') || n.endsWith('.webm') || n.endsWith('.mov')) return 'video'
  if (t.includes('audio') || n.endsWith('.mp3') || n.endsWith('.wav') || n.endsWith('.ogg')) return 'audio'
  
  return 'unknown'
})

// Preview signed URL helper
const previewUrl = ref('')
const textPreviewContent = ref('')
const csvPreviewData = ref([])
const isPreviewLoading = ref(false)

const parseCSV = (text) => {
  const result = []
  const lines = text.split('\n')
  for (let line of lines) {
    if (!line.trim()) continue
    const row = []
    let inQuotes = false
    let currentVal = ''
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' && line[i+1] === '"') {
        currentVal += '"'
        i++ 
      } else if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal)
        currentVal = ''
      } else {
        currentVal += char
      }
    }
    row.push(currentVal)
    result.push(row)
  }
  return result
}

watch(() => selectedFile.value, async (newVal) => {
  previewUrl.value = ''
  textPreviewContent.value = ''
  csvPreviewData.value = []
  if (newVal) {
    isPreviewLoading.value = true
    try {
      const { data, error } = await supabase.storage
        .from('clientos-files')
        .createSignedUrl(newVal.storage_path, 3600)
      if (!error && data) {
        previewUrl.value = data.signedUrl
        
        // Fetch text content for text/csv files
        if (fileCategory.value === 'text' || fileCategory.value === 'csv') {
          try {
            const res = await fetch(data.signedUrl)
            const text = await res.text()
            if (fileCategory.value === 'csv') {
              csvPreviewData.value = parseCSV(text.length > 500000 ? text.substring(0, 500000) : text)
            } else {
              textPreviewContent.value = text.length > 50000 ? text.substring(0, 50000) + '\n\n... (file truncated for preview)' : text
            }
          } catch (e) {
            textPreviewContent.value = 'Failed to load content.'
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      isPreviewLoading.value = false
    }
  }
})

onMounted(() => {
  fetchFiles()
})
</script>

<template>
  <div class="flex flex-col gap-6 text-left">
    <!-- Drag & Drop Upload Zone -->
    <div
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="triggerFileSelect"
      class="border border-dashed border-custom-border hover:border-primary/40 bg-custom-bg-card/30 p-10 rounded-sm flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors relative"
      :class="isDragging ? 'border-primary bg-primary/5' : ''"
    >
      <input ref="fileInput" type="file" multiple class="hidden" @change="handleFileSelect" />
      <span class="material-symbols-outlined text-3xl text-primary animate-pulse">cloud_upload</span>
      <h3 class="text-sm font-semibold text-on-surface font-button uppercase tracking-widest">Drag deliverables here</h3>
      <p class="text-xs text-custom-muted">Or click to browse files (PNG, JPG, PDF, ZIP up to 50MB)</p>
    </div>

    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
      <div class="relative w-full md:w-96">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-custom-muted text-[18px]" :class="{'animate-spin text-primary': ai.loading.value && searchQuery}">
          {{ ai.loading.value && searchQuery ? 'autorenew' : 'search_insights' }}
        </span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Semantic search files using AI..." 
          class="w-full bg-custom-bg-card border border-custom-border text-on-surface text-sm pl-10 pr-4 py-2.5 focus:border-primary focus:outline-none transition-colors rounded-sm placeholder-custom-muted/50"
        />
      </div>
      <div v-if="searchQuery" class="text-xs text-primary font-medium flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[14px]">auto_awesome</span>
        AI Reranking Active
      </div>
    </div>

    <!-- Active Upload Progress Bars -->
    <div v-if="uploadsInProgress.length > 0" class="flex flex-col gap-3 p-4 bg-custom-bg-card border border-custom-border rounded-sm">
      <div v-for="up in uploadsInProgress" :key="up.name" class="flex flex-col gap-1.5 text-xs text-left">
        <div class="flex justify-between font-medium">
          <span class="text-on-surface truncate max-w-[240px]">{{ up.name }}</span>
          <span class="text-primary">Uploading...</span>
        </div>
        <div class="w-full bg-custom-hover h-1 rounded-full overflow-hidden">
          <div class="bg-primary h-full animate-pulse" style="width: 60%"></div>
        </div>
      </div>
    </div>

    <!-- Files Listing Grid -->
    <div v-if="(loading && files.length === 0) || (ai.loading.value && searchQuery)" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <SkeletonLoader type="card" :count="3" />
    </div>

    <div v-else-if="displayedFiles.length === 0" class="py-12 text-center border border-dashed border-custom-border rounded-sm">
      <span class="material-symbols-outlined text-4xl text-custom-muted mb-3">folder_open</span>
      <h4 class="text-sm font-semibold text-on-surface uppercase tracking-widest mb-1">{{ searchQuery ? 'No semantic matches found' : 'No files uploaded' }}</h4>
      <p class="text-xs text-custom-muted">{{ searchQuery ? 'Try adjusting your AI search query.' : 'Deliverables uploaded here will appear in the client portal room.' }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="file in displayedFiles"
        :key="file.id"
        class="bg-custom-bg-card border border-custom-border rounded-sm p-5 flex flex-col gap-4 relative group hover:border-custom-border/80 transition-colors"
      >
        <!-- Top row: File details & Version badge -->
        <div class="flex justify-between items-start" @click="openDetail(file)">
          <div class="flex items-center gap-3 cursor-pointer">
            <span class="material-symbols-outlined text-2xl text-primary">
              {{ getFileIcon(file.file_type) }}
            </span>
            <div class="text-left max-w-[160px]">
              <h4 class="text-xs font-semibold text-on-surface truncate hover:text-primary transition-colors">{{ file.name }}</h4>
              <p class="text-[10px] text-custom-muted mt-0.5">{{ formatDate(file.uploaded_at) }}</p>
            </div>
          </div>

          <span class="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10 font-semibold select-none">
            v{{ file.version }}
          </span>
        </div>

        <!-- Status Pill row -->
        <div class="flex items-center justify-between mt-1" @click="openDetail(file)">
          <span class="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border cursor-pointer" :class="getStatusClass(file.status)">
            {{ getStatusLabel(file.status) }}
          </span>
        </div>

        <!-- Hover Actions Overlay -->
        <div class="absolute right-4 bottom-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            @click="downloadFile(file)"
            class="w-7 h-7 bg-custom-hover border border-custom-border hover:border-primary text-on-surface-variant hover:text-primary rounded-sm flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined text-base">download</span>
          </button>
          <button
            @click="deleteFile(file)"
            class="w-7 h-7 bg-custom-hover border border-custom-border hover:border-red-500 text-on-surface-variant hover:text-red-400 rounded-sm flex items-center justify-center transition-colors"
          >
            <span class="material-symbols-outlined text-base">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- FILE DETAIL MODAL (Teleport) -->
    <Teleport to="body">
      <div
        v-if="isDetailModalOpen"
        class="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 md:p-8"
        @click.self="isDetailModalOpen = false"
      >
        <div class="bg-custom-bg-card border border-custom-border rounded-sm max-w-4xl w-full h-[90vh] md:h-[80vh] overflow-hidden shadow-2xl flex flex-col md:flex-row text-left">
          
          <!-- Left: Preview / Details (70%) -->
          <div class="flex-1 bg-custom-bg-sidebar flex flex-col p-6 justify-between border-b md:border-b-0 md:border-r border-custom-border">
            <!-- Top bar -->
            <div class="flex justify-between items-start gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="text-sm font-semibold text-on-surface truncate max-w-sm">{{ selectedFile?.name }}</h3>
                  <span v-if="selectedFile?.status" class="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border" :class="getStatusClass(selectedFile.status)">
                    {{ getStatusLabel(selectedFile.status) }}
                  </span>
                </div>
                <p class="text-[10px] text-custom-muted mt-1">Version {{ selectedFile?.version }} • {{ selectedFile?.file_type }}</p>
              </div>
              <button @click="downloadFile(selectedFile)" class="flex items-center gap-1.5 px-3 py-1.5 bg-custom-hover border border-custom-border hover:border-primary text-xs font-button uppercase tracking-wider text-on-surface-variant hover:text-primary rounded-sm transition-colors">
                <span class="material-symbols-outlined text-sm">download</span>
                Download
              </button>
            </div>

            <!-- Preview panel -->
            <div class="flex-1 flex items-center justify-center overflow-hidden py-4 max-h-[300px] md:max-h-full w-full">
              <div v-if="isPreviewLoading" class="flex flex-col items-center gap-3 text-custom-muted">
                <span class="material-symbols-outlined text-6xl animate-pulse">downloading</span>
                <span class="text-xs uppercase tracking-widest font-button">Loading preview...</span>
              </div>
              
              <template v-else-if="previewUrl">
                <div v-if="fileCategory === 'image'" class="max-w-full max-h-full overflow-hidden flex items-center justify-center">
                  <img :src="previewUrl" alt="File Preview" class="max-w-full max-h-[250px] md:max-h-[350px] object-contain rounded-sm" />
                </div>
                
                <div v-else-if="fileCategory === 'pdf'" class="w-full h-full overflow-hidden flex items-center justify-center bg-custom-bg-card rounded-sm">
                  <object :data="previewUrl + '#toolbar=0&navpanes=0'" type="application/pdf" class="w-full h-full">
                    <iframe :src="previewUrl + '#toolbar=0&navpanes=0'" class="w-full h-full border-0">
                      This browser does not support PDFs. Please download the PDF to view it.
                    </iframe>
                  </object>
                </div>

                <div v-else-if="fileCategory === 'office'" class="w-full h-full overflow-hidden flex items-center justify-center rounded-sm bg-white">
                  <iframe :src="`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`" class="w-full h-full border-0"></iframe>
                </div>

                <div v-else-if="fileCategory === 'text'" class="w-full h-full overflow-auto flex flex-col items-start justify-start rounded-sm bg-black/90 p-4 border border-custom-border/50">
                  <pre class="text-xs text-green-400 whitespace-pre-wrap font-mono">{{ textPreviewContent || 'Loading text...' }}</pre>
                </div>

                <div v-else-if="fileCategory === 'csv'" class="w-full h-full overflow-auto bg-custom-bg-card p-4 border border-custom-border/50 rounded-sm">
                  <table v-if="csvPreviewData.length" class="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr>
                        <th v-for="(col, i) in csvPreviewData[0]" :key="i" class="p-2 border border-custom-border bg-custom-bg-sidebar font-semibold text-on-surface whitespace-nowrap">
                          {{ col }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, rIndex) in csvPreviewData.slice(1)" :key="rIndex" class="hover:bg-custom-hover/50 transition-colors">
                        <td v-for="(col, i) in row" :key="i" class="p-2 border border-custom-border text-on-surface-variant whitespace-nowrap">
                          {{ col }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="text-custom-muted text-xs">Loading CSV data...</div>
                </div>

                <div v-else-if="fileCategory === 'video'" class="w-full h-full overflow-hidden flex items-center justify-center bg-black/50 rounded-sm">
                  <video :src="previewUrl" controls class="max-w-full max-h-[250px] md:max-h-[350px] rounded-sm"></video>
                </div>

                <div v-else-if="fileCategory === 'audio'" class="w-full h-full overflow-hidden flex items-center justify-center bg-custom-bg-card rounded-sm border border-custom-border p-8">
                  <audio :src="previewUrl" controls class="w-full max-w-md"></audio>
                </div>

                <div v-else class="flex flex-col items-center gap-3 text-custom-muted">
                  <span class="material-symbols-outlined text-6xl">insert_drive_file</span>
                  <span class="text-xs uppercase tracking-widest font-button text-center">No inline preview available <br/> <span class="text-[10px] lowercase text-custom-muted/70">(Click download above)</span></span>
                </div>
              </template>
              
              <div v-else class="flex flex-col items-center gap-3 text-custom-muted">
                <span class="material-symbols-outlined text-6xl text-red-500/50">error</span>
                <span class="text-xs uppercase tracking-widest font-button text-center">Preview generation failed</span>
              </div>
            </div>

            <!-- Footer: Freelancer override review status actions -->
            <div class="flex items-center justify-between border-t border-custom-border/50 pt-4 mt-2">
              <span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Review Override:</span>
              <div class="flex gap-2">
                <button
                  @click="updateFileStatus('changes_requested')"
                  :disabled="selectedFile?.status === 'changes_requested'"
                  class="px-3 py-1.5 text-xs font-button uppercase rounded-sm transition-colors disabled:opacity-50 disabled:cursor-default"
                  :class="selectedFile?.status === 'changes_requested' ? 'bg-red-500 text-white border border-red-500' : 'border border-red-500/20 text-red-400 hover:bg-red-500/5'"
                >
                  <span class="flex items-center gap-1">
                    <span v-if="selectedFile?.status === 'changes_requested'" class="material-symbols-outlined text-[14px]">check</span>
                    Request Changes
                  </span>
                </button>
                <button
                  @click="updateFileStatus('approved')"
                  :disabled="selectedFile?.status === 'approved'"
                  class="px-4 py-1.5 text-xs font-button uppercase rounded-sm transition-colors disabled:opacity-50 disabled:cursor-default"
                  :class="selectedFile?.status === 'approved' ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'"
                >
                  <span class="flex items-center gap-1">
                    <span v-if="selectedFile?.status === 'approved'" class="material-symbols-outlined text-[14px]">check</span>
                    Approve Deliverable
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right: Comments / Thread Feed (30%) -->
          <div class="w-full md:w-[320px] shrink-0 h-full flex flex-col bg-surface">
            <div class="p-4 border-b border-custom-border flex justify-between items-center bg-custom-bg-sidebar/80">
              <span class="text-xs font-button uppercase tracking-widest text-on-surface">Comments</span>
              <button @click="isDetailModalOpen = false" class="text-custom-muted hover:text-on-surface transition-colors md:hidden">
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div class="flex-1 overflow-hidden h-full flex flex-col justify-between">
              <FeedbackThread
                v-if="selectedFile"
                :projectId="projectId"
                :fileId="selectedFile.id"
                :currentUser="{ name: profile?.full_name || 'Freelancer', type: 'freelancer' }"
              />
            </div>
          </div>

        </div>
      </div>
    </Teleport>
  </div>
</template>
