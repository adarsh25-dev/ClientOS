<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { supabase } from '../lib/supabase'
import { useTimeAgo } from '@vueuse/core'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  fileId: {
    type: String,
    default: null
  },
  currentUser: {
    type: Object, // { name: String, type: 'freelancer' | 'client' }
    required: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

// Refs
const comments = ref([])
const newCommentText = ref('')
const loading = ref(false)
const threadContainer = ref(null)
const expandedComments = ref({}) // tracks expanded comment IDs

let channel = null

const fetchComments = async () => {
  loading.value = true
  try {
    let query = supabase
      .from('feedback')
      .select('*')
      .eq('project_id', props.projectId)

    if (props.fileId) {
      query = query.eq('file_id', props.fileId)
    } else {
      query = query.is('file_id', null)
    }

    const { data, error } = await query.order('created_at', { ascending: true })
    if (error) throw error
    comments.value = data || []
    scrollToBottom()
  } catch (err) {
    console.error('Error fetching comments:', err)
  } finally {
    loading.value = false
  }
}

const submitComment = async () => {
  const text = newCommentText.value.trim()
  if (!text) return

  newCommentText.value = ''
  
  // Optimistic ID
  const tempId = 'temp-' + Date.now()
  const optimisticComment = {
    id: tempId,
    project_id: props.projectId,
    file_id: props.fileId,
    author_type: props.currentUser.type,
    author_name: props.currentUser.name,
    content: text,
    created_at: new Date().toISOString()
  }

  comments.value.push(optimisticComment)
  scrollToBottom()

  try {
    const { data, error } = await supabase
      .from('feedback')
      .insert({
        project_id: props.projectId,
        file_id: props.fileId,
        author_type: props.currentUser.type,
        author_name: props.currentUser.name,
        content: text
      })
      .select()
      .single()

    if (error) throw error

    // Replace optimistic comment
    const idx = comments.value.findIndex(c => c.id === tempId)
    if (idx !== -1) {
      comments.value[idx] = data
    }
  } catch (err) {
    console.error('Error saving comment:', err)
    // Remove optimistic comment on failure
    comments.value = comments.value.filter(c => c.id !== tempId)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (threadContainer.value) {
      threadContainer.value.scrollTop = threadContainer.value.scrollHeight
    }
  })
}

// Watch for changes in projectId/fileId to refetch
watch(() => [props.projectId, props.fileId], () => {
  fetchComments()
}, { immediate: true })

onMounted(() => {
  // Subscribe to realtime database changes for comments on this project
  channel = supabase
    .channel(`feedback-realtime-${props.projectId}-${props.fileId || 'general'}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        table: 'feedback',
        filter: `project_id=eq.${props.projectId}`
      },
      (payload) => {
        const newRecord = payload.new
        // Verify file_id match
        const fileMatch = props.fileId 
          ? newRecord.file_id === props.fileId
          : !newRecord.file_id

        if (fileMatch) {
          // Check if we already have it in list (e.g. from optimistic update)
          const exists = comments.value.some(c => c.id === newRecord.id || c.content === newRecord.content && c.author_name === newRecord.author_name && Math.abs(new Date(c.created_at) - new Date(newRecord.created_at)) < 5000)
          if (!exists) {
            comments.value.push(newRecord)
            scrollToBottom()
          }
        }
      }
    )
    .subscribe()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
  }
})

// Time Ago formatter
const formatTime = (timeStr) => {
  return useTimeAgo(new Date(timeStr)).value
}
</script>

<template>
  <div class="flex flex-col h-full bg-[#0D0D14] border border-[#1E2030] rounded-sm overflow-hidden">
    <!-- Header -->
    <div class="px-4 py-3 bg-[#13131C] border-b border-[#1E2030] flex items-center justify-between">
      <span class="text-xs font-button uppercase tracking-widest text-[#F0EDE6]">
        {{ fileId ? 'File Review Feed' : 'Project Discussion' }}
      </span>
      <span class="text-[10px] text-[#C9A84C] bg-[#C9A84C]/5 px-2 py-0.5 rounded border border-[#C9A84C]/10 font-semibold uppercase">Realtime Live</span>
    </div>

    <!-- Comments List -->
    <div 
      ref="threadContainer"
      class="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-[350px] min-h-[180px]"
    >
      <div v-if="loading && comments.length === 0" class="flex flex-col gap-3 py-4">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-[#1A1A25] animate-pulse"></div>
          <div class="flex flex-col gap-1 flex-1">
            <div class="h-3 w-24 bg-[#1A1A25] rounded animate-pulse"></div>
            <div class="h-8 bg-[#1A1A25] rounded animate-pulse w-2/3"></div>
          </div>
        </div>
      </div>

      <div v-else-if="comments.length === 0" class="flex flex-col items-center justify-center py-12 text-center text-xs text-[#5A5A6A]">
        <span class="material-symbols-outlined text-2xl mb-2 text-[#3A3A4A]">chat_bubble_outline</span>
        <span>No comments yet. Start the conversation below.</span>
      </div>

      <div 
        v-for="comment in comments" 
        :key="comment.id"
        class="flex flex-col max-w-[85%]"
        :class="comment.author_type === 'freelancer' ? 'self-start items-start' : 'self-end items-end'"
      >
        <!-- Author info -->
        <span class="text-[10px] font-medium text-[#5A5A70] mb-1.5 px-1">
          {{ comment.author_name }} • {{ formatTime(comment.created_at) }}
        </span>

        <!-- Message Bubble -->
        <div 
          class="px-4 py-3 rounded-sm text-sm text-left leading-relaxed relative"
          :class="comment.author_type === 'freelancer' 
            ? 'bg-[#16161F] text-[#F0EDE6] border border-[#1E2030] rounded-tl-none' 
            : 'bg-[#1A1710] text-[#E9E1D7] border border-[#2A2520] rounded-tr-none'"
        >
          <!-- Comment text with show more limit if needed -->
          <div 
            class="whitespace-pre-wrap transition-all"
            :class="!expandedComments[comment.id] ? 'line-clamp-3' : ''"
          >
            {{ comment.content }}
          </div>
          
          <!-- Show more trigger -->
          <button 
            v-if="comment.content.split('\n').length > 3 || comment.content.length > 150"
            @click="expandedComments[comment.id] = !expandedComments[comment.id]"
            class="text-[10px] uppercase font-bold tracking-widest text-[#C9A84C] mt-2 block transition-colors hover:text-[#F0EDE6]"
          >
            {{ expandedComments[comment.id] ? 'Show Less' : 'Show More' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Input Form -->
    <form 
      v-if="!readonly"
      @submit.prevent="submitComment"
      class="border-t border-[#1E2030] bg-[#13131C] p-3 flex gap-2"
    >
      <input 
        v-model="newCommentText"
        type="text" 
        class="flex-1 bg-[#1A1A25] border border-[#1E2030] rounded-sm py-2 px-3 text-sm text-[#F0EDE6] placeholder-[#5A5A6A] focus:outline-none focus:border-[#C9A84C] transition-colors"
        placeholder="Type a message..."
      />
      <button 
        type="submit"
        class="bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-button text-xs uppercase tracking-widest px-4 rounded-sm transition-colors flex items-center justify-center gap-1.5"
      >
        <span class="material-symbols-outlined text-sm">send</span>
        Send
      </button>
    </form>
  </div>
</template>
