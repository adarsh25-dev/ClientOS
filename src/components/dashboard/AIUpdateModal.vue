<script setup>
import { ref, onUnmounted } from 'vue'
import { useAI } from '../../composables/useAI'
import { useToast } from '../../composables/useToast'
import { supabase } from '../../lib/supabase'

const props = defineProps({
  projectId: {
    type: String,
    required: true
  },
  projectName: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close', 'update-saved'])

// Refs
const rawNotes = ref('')
const tone = ref('professional')
const step = ref('input') // 'input' | 'generating' | 'result'
const isSaved = ref(false)
const copyButtonText = ref('Copy')

const { loading, error, statusMessage, generatedSummary, generateProjectUpdate } = useAI()
const toast = useToast()

const handleGenerate = async () => {
  step.value = 'generating'
  try {
    await generateProjectUpdate({
      projectName: props.projectName,
      clientName: props.clientName,
      rawNotes: rawNotes.value,
      tone: tone.value
    })
    step.value = 'result'
  } catch (err) {
    step.value = 'input'
    toast.error(err)
  }
}

const handleSendToClient = async () => {
  if (!generatedSummary.value) return
  loading.value = true
  try {
    const { error: dbError } = await supabase
      .from('updates')
      .insert({
        project_id: props.projectId,
        content: generatedSummary.value,
        raw_notes: rawNotes.value,
        tone: tone.value
      })
    if (dbError) throw dbError

    isSaved.value = true
    toast.success('Update saved and visible to client')
    emit('update-saved')
    setTimeout(() => {
      emit('close')
    }, 1500)
  } catch (err) {
    toast.error('Failed to save update: ' + err.message)
  } finally {
    loading.value = false
  }
}

const handleCopyToClipboard = () => {
  navigator.clipboard.writeText(generatedSummary.value)
  copyButtonText.value = 'Copied!'
  setTimeout(() => {
    copyButtonText.value = 'Copy'
  }, 2000)
}

const handleRegenerate = () => {
  handleGenerate()
}
</script>

<template>
  <div class="fixed inset-0 bg-[#0A0A0F]/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
    <div class="bg-[#16161F] border border-[#1E2030] rounded-sm max-w-lg w-full overflow-hidden shadow-2xl flex flex-col">
      <!-- Header -->
      <div class="px-6 py-4 bg-[#0D0D14] border-b border-[#1E2030] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary">bolt</span>
          <span class="font-headline-sm text-sm uppercase tracking-widest text-[#F0EDE6]">
            AI Project Update Generator
          </span>
        </div>
        <button 
          @click="emit('close')" 
          class="text-[#5A5A6A] hover:text-[#F0EDE6] transition-colors"
          :disabled="loading"
        >
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 flex-1 flex flex-col gap-6">
        <!-- STEP 1: Input -->
        <div v-if="step === 'input'" class="flex flex-col gap-4">
          <div class="text-left">
            <label class="font-label-caps text-[10px] text-[#5A5A70] uppercase tracking-widest block mb-2">Raw Notes & Completed Milestones</label>
            <textarea
              v-model="rawNotes"
              class="w-full h-32 bg-[#1A1A25] border border-[#1E2030] rounded-sm p-3 text-sm text-[#F0EDE6] placeholder-[#5A5A6A] focus:outline-none focus:border-primary transition-colors resize-none"
              placeholder="Example: Wrapped wireframe designs. Sent home page details. Working on user auth setup. Next: configure DB routes."
            ></textarea>
          </div>

          <div class="text-left">
            <label class="font-label-caps text-[10px] text-[#5A5A70] uppercase tracking-widest block mb-2">Tone</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="t in ['professional', 'friendly', 'brief']"
                :key="t"
                @click="tone = t"
                type="button"
                class="py-2.5 px-4 rounded-sm text-xs font-button uppercase tracking-wider border transition-all text-center"
                :class="tone === t
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-[#1A1A25] border-[#1E2030] text-[#A0A0B0] hover:text-[#F0EDE6]'"
              >
                {{ t }}
              </button>
            </div>
          </div>

          <button
            @click="handleGenerate"
            :disabled="!rawNotes.trim()"
            class="w-full btn-accent disabled:bg-[#1A1A25] disabled:text-[#5A5A6A] disabled:border-[#1E2030] text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3.5 rounded-sm duration-300 flex items-center justify-center gap-2"
          >
            Generate Summary
            <span class="material-symbols-outlined text-sm">auto_awesome</span>
          </button>
        </div>

        <!-- STEP 2: Generating -->
        <div v-else-if="step === 'generating'" class="py-12 flex flex-col items-center justify-center gap-4 text-center">
          <div class="w-12 h-12 rounded-full border-t-[2px] border-r-[2px] border-primary animate-spin"></div>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium text-[#F0EDE6]">{{ statusMessage }}</span>
            <span class="text-xs text-[#5A5A70]">Parsing inputs & drafting content...</span>
          </div>
        </div>

        <!-- STEP 3: Result -->
        <div v-else-if="step === 'result'" class="flex flex-col gap-4 text-left">
          <div>
            <label class="font-label-caps text-[10px] text-[#5A5A70] uppercase tracking-widest block mb-2">Draft Update</label>
            <div class="w-full bg-[#1A1A25] border border-[#1E2030] rounded-sm p-4 text-sm text-[#F0EDE6] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
              {{ generatedSummary }}
            </div>
          </div>

          <div class="flex gap-2">
            <button
              @click="handleCopyToClipboard"
              class="flex-1 border border-[#1E2030] hover:border-[#5A5A70] bg-[#1A1A25] text-xs font-button uppercase tracking-widest text-[#F0EDE6] py-3 rounded-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">content_copy</span>
              {{ copyButtonText }}
            </button>
            <button
              @click="handleRegenerate"
              class="border border-[#1E2030] hover:border-[#5A5A70] bg-[#1A1A25] text-xs font-button uppercase tracking-widest text-[#F0EDE6] px-4 py-3 rounded-sm transition-colors flex items-center justify-center"
            >
              <span class="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          <button
            @click="handleSendToClient"
            :disabled="loading || isSaved"
            class="w-full btn-accent disabled:bg-[#1A1A25] disabled:text-[#5A5A6A] text-[#0A0A0F] font-button text-xs uppercase tracking-widest py-3.5 rounded-sm flex items-center justify-center gap-2"
          >
            <span class="material-symbols-outlined text-sm">send_and_archive</span>
            {{ isSaved ? 'Sent!' : 'Send to Client Portal' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
