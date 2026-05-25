<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { useClientsStore } from '../../stores/clients'
import { useProjectsStore } from '../../stores/projects'
import { useInvoicesStore } from '../../stores/invoices'
import { useToast } from '../../composables/useToast'
import { useAI } from '../../composables/useAI'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const clientsStore = useClientsStore()
const projectsStore = useProjectsStore()
const invoicesStore = useInvoicesStore()
const ai = useAI()
const fileInput = ref(null)

// State
const loading = ref(false)
const saving = ref(false)
const editMode = ref(false)
const invoiceId = ref(null)
const isSendSuccessOpen = ref(false)
const isPulsing = ref(false)

const today = new Date().toISOString().split('T')[0]
const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const form = reactive({
  clientId: '',
  projectId: '',
  invoiceNumber: '',
  issueDate: today,
  dueDate: thirtyDaysLater,
  lineItems: [{ id: '1', description: '', qty: 1, rate: 0 }],
  notes: '',
  taxRate: 0,
  taxEnabled: false,
  agencyName: '',
  clientName: '',
  clientCompany: '',
  clientEmail: ''
})

import { watch } from 'vue'

watch(() => form.clientId, (newId) => {
  if (editMode.value && !loading.value) {
    // Let loadInvoiceToEdit handle it if loading
    const c = clientsStore.clients.find(c => c.id === newId)
    if (c) {
      form.clientName = c.name
      form.clientCompany = c.company
      form.clientEmail = c.email
    }
  } else if (!editMode.value) {
    const c = clientsStore.clients.find(c => c.id === newId)
    if (c) {
      form.clientName = c.name
      form.clientCompany = c.company
      form.clientEmail = c.email
    }
  }
})

watch(() => [invoicesStore.currentInvoice, projectsStore.currentProject], () => {
  if (!form.agencyName) {
    form.agencyName = invoicesStore.currentInvoice?.profiles?.agency_name || projectsStore.currentProject?.profiles?.agency_name || 'Design Agency'
  }
}, { deep: true, immediate: true })

// UI animations
const triggerPulse = () => {
  isPulsing.value = false
  setTimeout(() => {
    isPulsing.value = true
  }, 10)
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const formattedIssueDate = computed(() => formatDate(form.issueDate))
const formattedDueDate = computed(() => formatDate(form.dueDate))

const selectedClient = computed(() => {
  return clientsStore.clients.find(c => c.id === form.clientId) || null
})

// Auto-generate invoice number
const generateInvoiceNumber = async () => {
  try {
    const { count, error } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
    if (error) throw error

    const year = new Date().getFullYear()
    const nextCount = (count || 0) + 1
    const padCount = String(nextCount).padStart(3, '0')
    form.invoiceNumber = `INV-${year}-${padCount}`
  } catch (err) {
    console.error('Error generating invoice number:', err)
  }
}

// Line items management
const addLineItem = () => {
  form.lineItems.push({
    id: String(Date.now()),
    description: '',
    qty: 1,
    rate: 0
  })
  triggerPulse()
}

const removeLineItem = (index) => {
  if (form.lineItems.length <= 1) return
  form.lineItems.splice(index, 1)
  triggerPulse()
}

const getLineAmount = (item) => {
  const qty = parseFloat(item.qty) || 0
  const rate = parseFloat(item.rate) || 0
  return Number((qty * rate).toFixed(2))
}

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      try {
        const extractedItems = await ai.extractInvoiceItems(dataUrl)
        if (extractedItems && extractedItems.length > 0) {
          // If the only item is the default empty one, replace it
          if (form.lineItems.length === 1 && !form.lineItems[0].description && form.lineItems[0].rate === 0) {
            form.lineItems = extractedItems.map((item, idx) => ({
              ...item,
              id: String(Date.now() + idx)
            }))
          } else {
            // Append
            extractedItems.forEach((item, idx) => {
              form.lineItems.push({
                ...item,
                id: String(Date.now() + idx)
              })
            })
          }
          toast.success('Items extracted successfully!')
          triggerPulse()
        } else {
          toast.info('No items found in the image.')
        }
      } catch (err) {
        toast.error('AI Scan failed: ' + err)
      }
    }
    reader.readAsDataURL(file)
  } catch (err) {
    toast.error('File read error: ' + err.message)
  } finally {
    event.target.value = ''
  }
}

const handleAutoWriteNotes = async () => {
  try {
    const clientName = selectedClient.value?.name || ''
    const notes = await ai.generateInvoiceNotes(clientName, form.lineItems)
    if (notes) {
      form.notes = notes
      triggerPulse()
      toast.success('Notes auto-generated!')
    }
  } catch (err) {
    toast.error('Failed to auto-write notes: ' + (err.message || err))
  }
}

// Calculations
const subtotal = computed(() => {
  const sum = form.lineItems.reduce((acc, item) => acc + getLineAmount(item), 0)
  return Number(sum.toFixed(2))
})

const taxAmount = computed(() => {
  if (!form.taxEnabled) return 0
  const rate = parseFloat(form.taxRate) || 0
  return Number((subtotal.value * (rate / 100)).toFixed(2))
})

const total = computed(() => {
  return Number((subtotal.value + taxAmount.value).toFixed(2))
})

// Form submit handlers
const saveInvoice = async (status = 'draft') => {
  if (!form.clientId) {
    toast.error('Please select a client')
    return
  }

  saving.value = true
  try {
    if (form.clientName || form.clientCompany || form.clientEmail) {
      await clientsStore.updateClient(form.clientId, {
        name: form.clientName,
        company: form.clientCompany,
        email: form.clientEmail
      })
    }
    const payload = {
      clientId: form.clientId,
      projectId: form.projectId || null,
      invoiceNumber: form.invoiceNumber,
      lineItems: form.lineItems,
      subtotal: subtotal.value,
      taxRate: form.taxEnabled ? form.taxRate : 0,
      total: total.value,
      notes: form.notes,
      dueDate: form.dueDate,
      status
    }

    if (editMode.value) {
      await invoicesStore.updateInvoice(invoiceId.value, payload)
      toast.success('Invoice updated')
    } else {
      await invoicesStore.createInvoice(payload)
      toast.success('Invoice saved')
    }

    if (status === 'sent') {
      isSendSuccessOpen.value = true
    } else {
      router.push('/app/invoices')
    }
  } catch (err) {
    toast.error('Failed to save invoice: ' + err.message)
  } finally {
    saving.value = false
  }
}

// Print Handler
const handlePrint = () => {
  window.print()
}

// Edit mode initialization
const loadInvoiceToEdit = async (id) => {
  loading.value = true
  try {
    const data = await invoicesStore.fetchInvoiceDetail(id)
    if (data.status === 'paid') {
      toast.error('Paid invoices cannot be edited')
      router.push('/app/invoices')
      return
    }

    editMode.value = true
    invoiceId.value = id
    form.clientId = data.client_id
    form.projectId = data.project_id || ''
    form.invoiceNumber = data.invoice_number
    form.dueDate = data.due_date
    form.lineItems = data.line_items || []
    form.notes = data.notes || ''
    form.taxRate = data.tax_rate || 0
    form.taxEnabled = (data.tax_rate > 0)
    
    form.agencyName = data.profiles?.agency_name || 'Design Agency'
    form.clientName = data.clients?.name || ''
    form.clientCompany = data.clients?.company || ''
    form.clientEmail = data.clients?.email || ''
  } catch (err) {
    toast.error('Failed to load invoice')
    router.push('/app/invoices')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  clientsStore.fetchClients()
  projectsStore.fetchProjects()

  const id = route.params.id || route.query.id
  if (id) {
    loadInvoiceToEdit(id)
  } else {
    generateInvoiceNumber()
    // Auto-prepopulate if route queries present
    if (route.query.clientId) form.clientId = route.query.clientId
    if (route.query.projectId) form.projectId = route.query.projectId
  }
})

// Projects filtered by selected client
const clientProjects = computed(() => {
  if (!form.clientId) return projectsStore.projects
  return projectsStore.projects.filter(p => p.client_id === form.clientId)
})
</script>

<template>
<div class="h-[calc(100vh-80px)] overflow-hidden flex flex-col md:flex-row -mt-8 -mx-8 relative z-0">
  <!-- LEFT PANEL: Editor -->
  <section class="w-full md:w-[55%] h-full overflow-y-auto bg-background p-margin-desktop border-r border-outline-variant custom-scrollbar animate-rise relative">
    <div class="max-w-2xl mx-auto space-y-16 pb-32 pt-8">
      <!-- Header -->
      <div class="space-y-4 flex justify-between items-start">
        <div>
          <h1 class="font-display-lg text-display-lg md:text-display-lg text-on-surface">{{ editMode ? 'Edit Invoice' : 'New Invoice' }}</h1>
          <p class="font-body-md text-body-md text-on-surface-variant">Drafting {{ form.invoiceNumber }}</p>
        </div>
        <div class="flex items-center gap-3 no-print">
          <button
            @click="saveInvoice('draft')"
            :disabled="saving"
            class="text-on-surface-variant hover-cinematic hover:text-tertiary font-label-caps text-label-caps uppercase border border-outline-variant hover:border-tertiary px-6 py-3"
          >
            Save as Draft
          </button>
          <button
            @click="saveInvoice('sent')"
            :disabled="saving"
            class="bg-tertiary text-on-tertiary font-label-caps text-label-caps uppercase px-6 py-3 hover:bg-tertiary-fixed hover-cinematic flex items-center gap-2"
          >
            <span class="material-symbols-outlined text-[18px]">send</span> Send
          </button>
        </div>
      </div>

      <!-- Bill To Section -->
      <div class="space-y-8 animate-rise stagger-1">
        <h2 class="font-label-caps text-label-caps text-tertiary uppercase tracking-widest border-b border-outline-variant pb-2">Bill To</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Select Client</label>
            <select
              v-model="form.clientId"
              class="input-minimal font-body-lg text-body-lg w-full pb-2 bg-transparent appearance-none"
              @change="triggerPulse"
            >
              <option value="" disabled class="bg-surface text-on-surface">Choose client...</option>
              <option v-for="c in clientsStore.clients" :key="c.id" :value="c.id" class="bg-surface text-on-surface">{{ c.name }} ({{ c.company }})</option>
            </select>
          </div>
          
          <div class="flex flex-col gap-2 md:col-span-2" v-if="form.clientId">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Client Name</label>
            <input v-model="form.clientName" type="text" class="input-minimal font-body-lg text-body-lg w-full pb-2" @input="triggerPulse" />
          </div>
          <div class="flex flex-col gap-2" v-if="form.clientId">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Client Company</label>
            <input v-model="form.clientCompany" type="text" class="input-minimal font-body-lg text-body-lg w-full pb-2" @input="triggerPulse" />
          </div>
          <div class="flex flex-col gap-2" v-if="form.clientId">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Client Email</label>
            <input v-model="form.clientEmail" type="text" class="input-minimal font-body-lg text-body-lg w-full pb-2" @input="triggerPulse" />
          </div>
        </div>
      </div>

      <!-- Project Details -->
      <div class="space-y-8 animate-rise stagger-2">
        <h2 class="font-label-caps text-label-caps text-tertiary uppercase tracking-widest border-b border-outline-variant pb-2">Project Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Invoice Number</label>
            <input v-model="form.invoiceNumber" type="text" class="input-minimal font-body-lg text-body-lg w-full pb-2" @input="triggerPulse" />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Agency Name</label>
            <input v-model="form.agencyName" type="text" class="input-minimal font-body-lg text-body-lg w-full pb-2" @input="triggerPulse" />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Project Name (Optional)</label>
            <select
              v-model="form.projectId"
              class="input-minimal font-body-lg text-body-lg w-full pb-2 bg-transparent appearance-none"
            >
              <option value="" class="bg-surface text-on-surface">General Project / No Link</option>
              <option v-for="p in clientProjects" :key="p.id" :value="p.id" class="bg-surface text-on-surface">{{ p.name }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Issue Date</label>
            <input
              v-model="form.issueDate"
              type="date"
              class="input-minimal font-body-lg text-body-lg w-full pb-2"
              style="color-scheme: dark;"
              @change="triggerPulse"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-label-caps text-label-caps text-on-surface-variant uppercase">Due Date</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="input-minimal font-body-lg text-body-lg w-full pb-2"
              style="color-scheme: dark;"
              @change="triggerPulse"
            />
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div class="space-y-6 animate-rise stagger-3">
        <h2 class="font-label-caps text-label-caps text-tertiary uppercase tracking-widest border-b border-outline-variant pb-2">Line Items</h2>
        <div class="space-y-4">
          <div
            v-for="(item, index) in form.lineItems"
            :key="item.id"
            class="grid grid-cols-12 gap-4 items-end border-b border-surface-variant pb-4 group relative line-item-row"
          >
            <div class="col-span-12 md:col-span-6 flex flex-col gap-2">
              <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" :class="{'md:opacity-100': index === 0, 'opacity-0 h-0 overflow-hidden md:h-auto': index !== 0}">Description</label>
              <input
                v-model="item.description"
                type="text"
                placeholder="Item Description"
                class="input-minimal font-body-md text-body-md w-full pb-1 item-desc"
                @input="triggerPulse"
              />
            </div>
            <div class="col-span-4 md:col-span-2 flex flex-col gap-2">
              <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" :class="{'md:opacity-100': index === 0, 'opacity-0 h-0 overflow-hidden md:h-auto': index !== 0}">Qty</label>
              <input
                v-model="item.qty"
                type="number"
                step="any"
                class="input-minimal font-body-md text-body-md w-full pb-1 item-qty"
                @input="triggerPulse"
              />
            </div>
            <div class="col-span-4 md:col-span-2 flex flex-col gap-2">
              <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" :class="{'md:opacity-100': index === 0, 'opacity-0 h-0 overflow-hidden md:h-auto': index !== 0}">Rate</label>
              <input
                v-model="item.rate"
                type="number"
                step="any"
                class="input-minimal font-body-md text-body-md w-full pb-1 item-rate"
                @input="triggerPulse"
              />
            </div>
            <div class="col-span-4 md:col-span-2 flex flex-col gap-2 text-right">
              <label class="font-label-caps text-label-caps text-on-surface-variant uppercase" :class="{'md:opacity-100': index === 0, 'opacity-0 h-0 overflow-hidden md:h-auto': index !== 0}">Amount</label>
              <div class="font-headline-sm text-headline-sm text-on-surface pb-1 item-amount"><span class="mr-0.5 font-body-md font-medium tracking-normal text-[0.8em] relative -top-[0.05em]">$</span>{{ getLineAmount(item).toFixed(2) }}</div>
            </div>
            <button
              v-if="form.lineItems.length > 1"
              @click="removeLineItem(index)"
              class="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-outline hover:text-error"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-4">
          <button
            @click="addLineItem"
            class="flex items-center gap-2 text-on-surface-variant hover-cinematic hover:text-tertiary font-label-caps text-label-caps uppercase border border-outline-variant hover:border-tertiary px-6 py-3"
          >
            <span class="material-symbols-outlined text-[18px]">add</span> Add Line Item
          </button>
          
          <button
            @click="fileInput.click()"
            :disabled="ai.loading.value"
            class="flex items-center gap-2 text-tertiary hover-cinematic font-label-caps text-label-caps uppercase border border-tertiary/30 hover:border-tertiary bg-tertiary/5 px-6 py-3 disabled:opacity-50"
          >
            <span class="material-symbols-outlined text-[18px]" :class="{ 'animate-spin': ai.loading.value }">
              {{ ai.loading.value ? 'autorenew' : 'document_scanner' }}
            </span> 
            {{ ai.loading.value ? 'Scanning...' : 'AI Scan Document' }}
          </button>
          <input 
            type="file" 
            ref="fileInput" 
            accept="image/jpeg, image/png, image/webp" 
            class="hidden" 
            @change="handleImageUpload" 
          />
        </div>
      </div>

      <!-- Notes & Tax -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-rise stagger-3">
        <div class="space-y-4">
          <div class="flex items-center justify-between border-b border-outline-variant pb-2">
            <h2 class="font-label-caps text-label-caps text-tertiary uppercase tracking-widest">Notes</h2>
            <button
              @click="handleAutoWriteNotes"
              :disabled="ai.loading.value"
              class="text-[10px] uppercase font-bold tracking-wider text-tertiary hover:text-tertiary-fixed transition-colors flex items-center gap-1 disabled:opacity-50"
              title="AI will draft a polite note based on the line items"
            >
              <span class="material-symbols-outlined text-[14px]" :class="{ 'animate-spin': ai.loading.value }">
                {{ ai.loading.value ? 'autorenew' : 'auto_awesome' }}
              </span>
              Auto-write
            </button>
          </div>
          <textarea
            v-model="form.notes"
            class="w-full bg-transparent border border-outline-variant text-on-surface font-body-md text-body-md p-4 min-h-[120px] focus:border-tertiary focus:outline-none transition-colors duration-500 resize-none placeholder-outline"
            placeholder="Thank you for your business. Payment is due within 30 days."
          ></textarea>
        </div>

        <div class="space-y-4">
          <h2 class="font-label-caps text-label-caps text-tertiary uppercase tracking-widest border-b border-outline-variant pb-2">Tax & Extras</h2>
          
          <div class="flex items-center justify-between border-b border-surface-variant pb-4">
            <span class="font-body-md text-body-md text-on-surface">Apply Tax</span>
            <div class="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
              <input
                v-model="form.taxEnabled"
                type="checkbox"
                id="toggle-tax"
                class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-primary-container border-2 border-outline-variant appearance-none cursor-pointer checked:right-0 checked:border-tertiary checked:bg-tertiary hover-cinematic"
                @change="triggerPulse"
              />
              <label
                for="toggle-tax"
                class="toggle-label block overflow-hidden h-6 rounded-full bg-surface-variant cursor-pointer border border-outline-variant hover-cinematic"
              ></label>
            </div>
          </div>
          
          <div class="flex items-center justify-between tax-reveal" :class="{ 'show': form.taxEnabled }">
            <span class="font-label-caps text-label-caps text-on-surface-variant uppercase">Tax Rate (%)</span>
            <input
              v-model.number="form.taxRate"
              type="number"
              step="any"
              class="input-minimal font-body-md text-body-md w-24 text-right pb-1"
              @input="triggerPulse"
            />
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- RIGHT PANEL: Live Preview -->
  <section class="w-full md:w-[45%] h-full bg-[#10131f] border-l border-outline-variant hidden md:flex flex-col relative z-0 no-print">
    <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
    <div class="flex-grow p-8 flex items-center justify-center overflow-y-auto custom-scrollbar">
      
      <!-- "Printed" Invoice Canvas -->
      <div id="invoice-preview" class="w-full max-w-lg bg-[#F5F2EB] shadow-2xl p-12 text-[#0A0A0F] relative transition-all duration-300" :class="{ 'pulse-preview': isPulsing }">
        <div class="flex justify-between items-start mb-16">
          <div class="font-headline-md text-headline-md font-bold tracking-tighter">{{ form.agencyName || 'Design Agency' }}</div>
          <div class="text-right">
            <h2 class="font-label-caps text-label-caps text-[#C9A84C] uppercase tracking-widest mb-1">Invoice</h2>
            <div class="font-body-md text-body-md text-[#474742]">#{{ form.invoiceNumber || 'INV-0000' }}</div>
          </div>
        </div>
        
        <div class="flex justify-between mb-16">
          <div>
            <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-2">Billed To</div>
            <div class="font-headline-sm text-headline-sm mb-1">{{ form.clientName || 'Client Name' }}</div>
            <div class="font-body-md text-body-md text-[#474742]">
              <span>{{ form.clientCompany || 'Company Name' }}</span><br/>
              <span>{{ form.clientEmail || 'email@example.com' }}</span>
            </div>
          </div>
          <div class="text-right">
            <div class="mb-4">
              <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-1">Issue Date</div>
              <div class="font-body-md text-body-md">{{ formattedIssueDate }}</div>
            </div>
            <div>
              <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-1">Due Date</div>
              <div class="font-body-md text-body-md">{{ formattedDueDate }}</div>
            </div>
          </div>
        </div>

        <table class="w-full mb-12 border-collapse">
          <thead>
            <tr class="border-b-2 border-[#0A0A0F]">
              <th class="text-left font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Description</th>
              <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Qty</th>
              <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Rate</th>
              <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Amount</th>
            </tr>
          </thead>
          <tbody class="font-body-md text-body-md">
            <tr v-for="(item, index) in form.lineItems" :key="index" class="border-b border-[#E8E4DC]">
              <td class="py-4">{{ item.description || ' ' }}</td>
              <td class="py-4 text-right">{{ item.qty }}</td>
              <td class="py-4 text-right">${{ Number(item.rate || 0).toFixed(2) }}</td>
              <td class="py-4 text-right">${{ getLineAmount(item).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="flex justify-end">
          <div class="w-1/2">
            <div class="flex justify-between py-2 font-body-md text-body-md text-[#474742]">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            <div v-if="form.taxEnabled" class="flex justify-between py-2 font-body-md text-body-md text-[#474742] border-b border-[#E8E4DC]">
              <span>Tax ({{ form.taxRate }}%)</span>
              <span>${{ taxAmount.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between py-4 font-headline-sm text-headline-sm text-[#C9A84C]">
              <span>Total Due</span>
              <span><span class="mr-0.5 font-body-md font-medium tracking-normal text-[0.8em] relative -top-[0.05em]">$</span>{{ total.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        
        <div v-if="form.notes" class="mt-8 pt-4 border-t border-[#E8E4DC] text-xs text-[#474742]">
          {{ form.notes }}
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="h-24 bg-surface/90 backdrop-blur-md border-t border-outline-variant flex items-center justify-end px-8 z-10 no-print">
      <button @click="handlePrint" class="bg-[#C9A84C] text-[#0A0A0F] font-label-caps text-label-caps uppercase px-8 py-4 hover:bg-[#e6c364] hover-cinematic flex items-center gap-2">
        <span class="material-symbols-outlined text-[18px]">download</span> Download PDF
      </button>
    </div>
  </section>

  <!-- SEND CONFIRMATION MODAL -->
  <Teleport to="body">
    <div
      v-if="isSendSuccessOpen"
      class="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    >
      <div class="bg-surface-container border border-outline-variant p-12 text-center flex flex-col gap-6 shadow-2xl max-w-md w-full animate-rise">
        <div class="w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/30 text-tertiary flex items-center justify-center mx-auto">
          <span class="material-symbols-outlined text-2xl">mark_email_read</span>
        </div>
        <div>
          <h3 class="font-headline-sm text-headline-sm text-on-surface mb-2">Invoice sent!</h3>
          <p class="font-body-md text-body-md text-on-surface-variant">
            Your client can now view, download, and track the payment status of this invoice from their portal.
          </p>
        </div>
        <button
          @click="isSendSuccessOpen = false; router.push('/app/invoices')"
          class="bg-tertiary text-on-tertiary font-label-caps text-label-caps uppercase py-4 hover:bg-tertiary-fixed hover-cinematic w-full mt-4"
        >
          Go to Invoices
        </button>
      </div>
    </div>
  </Teleport>
  
  <!-- PRINT ONLY PREVIEW -->
  <div class="hidden print:block print-only-invoice w-full max-w-lg mx-auto bg-[#F5F2EB] shadow-2xl p-12 text-[#0A0A0F] relative font-sans">
    <div class="flex justify-between items-start mb-16">
      <div class="font-headline-md text-headline-md font-bold tracking-tighter">{{ form.agencyName || 'Design Agency' }}</div>
      <div class="text-right">
        <h2 class="font-label-caps text-label-caps text-[#C9A84C] uppercase tracking-widest mb-1">Invoice</h2>
        <div class="font-body-md text-body-md text-[#474742]">#{{ form.invoiceNumber || 'INV-0000' }}</div>
      </div>
    </div>
    
    <div class="flex justify-between mb-16">
      <div>
        <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-2">Billed To</div>
        <div class="font-headline-sm text-headline-sm mb-1">{{ form.clientName || 'Client Name' }}</div>
        <div class="font-body-md text-body-md text-[#474742]">
          <span>{{ form.clientCompany || 'Company Name' }}</span><br/>
          <span>{{ form.clientEmail || 'email@example.com' }}</span>
        </div>
      </div>
      <div class="text-right">
        <div class="mb-4">
          <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-1">Issue Date</div>
          <div class="font-body-md text-body-md">{{ formattedIssueDate }}</div>
        </div>
        <div>
          <div class="font-label-caps text-label-caps text-[#474742] uppercase tracking-widest mb-1">Due Date</div>
          <div class="font-body-md text-body-md">{{ formattedDueDate }}</div>
        </div>
      </div>
    </div>

    <table class="w-full mb-12 border-collapse">
      <thead>
        <tr class="border-b-2 border-[#0A0A0F]">
          <th class="text-left font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Description</th>
          <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Qty</th>
          <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Rate</th>
          <th class="text-right font-label-caps text-label-caps text-[#0A0A0F] uppercase tracking-widest py-3">Amount</th>
        </tr>
      </thead>
      <tbody class="font-body-md text-body-md">
        <tr v-for="(item, index) in form.lineItems" :key="index" class="border-b border-[#E8E4DC]">
          <td class="py-4">{{ item.description || ' ' }}</td>
          <td class="py-4 text-right">{{ item.qty }}</td>
          <td class="py-4 text-right">${{ Number(item.rate || 0).toFixed(2) }}</td>
          <td class="py-4 text-right">${{ getLineAmount(item).toFixed(2) }}</td>
        </tr>
      </tbody>
    </table>

    <div class="flex justify-end">
      <div class="w-1/2">
        <div class="flex justify-between py-2 font-body-md text-body-md text-[#474742]">
          <span>Subtotal</span>
          <span>${{ subtotal.toFixed(2) }}</span>
        </div>
        <div v-if="form.taxEnabled" class="flex justify-between py-2 font-body-md text-body-md text-[#474742] border-b border-[#E8E4DC]">
          <span>Tax ({{ form.taxRate }}%)</span>
          <span>${{ taxAmount.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between py-4 font-headline-sm text-headline-sm text-[#C9A84C]">
          <span>Total Due</span>
          <span><span class="mr-0.5 font-body-md font-medium tracking-normal text-[0.8em] relative -top-[0.05em]">$</span>{{ total.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="form.notes" class="mt-8 pt-4 border-t border-[#E8E4DC] text-xs text-[#474742]">
      {{ form.notes }}
    </div>
  </div>
</div>
</template>

<style scoped>
/* Scoped styles specific to invoice builder that aren't global */
.animate-rise {
    animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    opacity: 0;
    transform: translateY(20px);
}
@keyframes rise {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
.stagger-1 { animation-delay: 0.1s; }
.stagger-2 { animation-delay: 0.2s; }
.stagger-3 { animation-delay: 0.3s; }

.pulse-preview {
    animation: pulse-op 0.15s cubic-bezier(0.19, 1, 0.22, 1);
}
@keyframes pulse-op {
    0% { opacity: 1; }
    50% { opacity: 0.7; }
    100% { opacity: 1; }
}

.input-minimal {
    background: transparent;
    border: none;
    border-bottom: 1px solid #2A2D3A;
    border-radius: 0;
    color: #F0EDE6;
    transition: border-color 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}
.input-minimal:focus {
    outline: none;
    border-bottom-color: #C9A84C;
    box-shadow: none;
}
.input-minimal::placeholder {
    color: #47464b;
}

.tax-reveal {
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}
.tax-reveal.show {
    max-height: 100px;
    opacity: 1;
    padding-top: 0.5rem;
}

@media print {
  /* Reset viewport and wrap layout elements for proper print flow */
  html, body, #app, .min-h-screen, main, .flex-grow, .flex-1 {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    position: static !important;
    background: white !important;
    box-shadow: none !important;
  }

  /* Hide non-printable elements using display:none to prevent blank pages */
  .no-print,
  .no-print * {
    display: none !important;
  }

  /* Hide the editor and live preview sections */
  section {
    display: none !important;
  }

  /* Reset the container wrapper */
  .h-\[calc\(100vh-80px\)\] {
    height: auto !important;
    overflow: visible !important;
    display: block !important;
    margin: 0 !important;
  }

  /* Ensure the printable invoice flows naturally without absolute positioning constraints */
  .print-only-invoice {
    display: block !important;
    position: static !important;
    width: 100% !important;
    max-width: none !important;
    margin: 0 !important;
    padding: 40px !important;
    box-shadow: none !important;
    background: white !important;
    color: #0A0A0F !important;
  }
}
</style>
