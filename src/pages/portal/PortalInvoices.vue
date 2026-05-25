<script setup>
import { computed, ref, onMounted } from 'vue'
import { usePortalStore } from '../../stores/portal'
import { useToast } from '../../composables/useToast'
import { supabase } from '../../lib/supabase'

const portalStore = usePortalStore()
const toast = useToast()

const invoices = computed(() => portalStore.invoices)
const profile = computed(() => portalStore.freelancerProfile)
const client = computed(() => portalStore.client)

const selectedInvoice = ref(null)

const handlePayInvoice = async (invoice) => {
  try {
    await portalStore.markInvoicePaid(invoice.id)
    if (selectedInvoice.value?.id === invoice.id) {
      selectedInvoice.value.status = 'paid'
    }
    toast.success('Payment simulated successfully!')
  } catch (err) {
    toast.error('Simulation failed')
  }
}

const selectInvoice = async (invoice) => {
  selectedInvoice.value = invoice
  if (invoice.status === 'sent') {
    await portalStore.markInvoiceViewed(invoice.id)
  }
}

const handlePrint = () => {
  window.print()
}

const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

const getLineAmount = (item) => {
  return (item.qty || 0) * (item.rate || 0)
}

onMounted(() => {
  if (invoices.value.length > 0) {
    selectInvoice(invoices.value[0])
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 text-left print-container">
    <!-- Header -->
    <div class="border-b border-[#1E2030] pb-6 mb-2 no-print">
      <h2 class="font-display text-2xl text-[#F0EDE6] mb-1">Invoices</h2>
      <p class="font-body text-xs text-[#A0A0B0]">Review invoice details, pay outstanding balances, and download receipts.</p>
    </div>

    <!-- Empty state -->
    <div v-if="invoices.length === 0" class="py-16 text-center border border-dashed border-[#1E2030] rounded-sm no-print">
      <span class="material-symbols-outlined text-4xl text-[#5A5A6A] mb-3">receipt_long</span>
      <h4 class="text-sm font-semibold text-[#F0EDE6] uppercase tracking-widest mb-1">No invoices found</h4>
      <p class="text-xs text-[#5A5A70]">There are no invoices configured for your portal room.</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      <!-- Left Column: Invoices List (40%) -->
      <div class="lg:col-span-4 flex flex-col gap-3 no-print">
        <div
          v-for="invoice in invoices"
          :key="invoice.id"
          @click="selectInvoice(invoice)"
          class="bg-[#16161F] border rounded-sm p-4 text-left cursor-pointer transition-all hover:bg-[#1A1A25]"
          :class="selectedInvoice?.id === invoice.id ? 'border-[#C9A84C]' : 'border-[#1E2030]'"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold font-mono text-[#C9A84C]">{{ invoice.invoice_number }}</span>
            <span 
              class="px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border"
              :class="invoice.status === 'paid' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-warning/10 text-warning border-warning/20'"
            >
              {{ invoice.status }}
            </span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-[#5A5A70]">Due Date: {{ formatDate(invoice.due_date) }}</span>
            <span class="text-[#F0EDE6] font-mono font-semibold">${{ invoice.total }}</span>
          </div>
        </div>
      </div>

      <!-- Right Column: Live Invoice Preview Sheet (60%) -->
      <div v-if="selectedInvoice" class="lg:col-span-8 flex flex-col gap-4">
        
        <div class="flex justify-between items-center no-print">
          <span class="text-xs font-button uppercase tracking-widest text-[#A0A0B0]">Invoice Reference</span>
          <div class="flex items-center gap-3">
            <button
              v-if="selectedInvoice.status !== 'paid'"
              @click="handlePayInvoice(selectedInvoice)"
              class="bg-[#C9A84C] hover:bg-[#8A7030] text-[#0A0A0F] font-button text-[10px] uppercase tracking-widest py-2 px-4 rounded-sm transition-colors"
            >
              Pay Invoice
            </button>
            <button
              @click="handlePrint"
              class="text-xs font-button uppercase tracking-widest text-[#C9A84C] hover:underline underline-offset-4 flex items-center gap-1.5"
            >
              <span class="material-symbols-outlined text-sm">print</span>
              Print Invoice
            </button>
          </div>
        </div>

        <!-- Receipt Print Sheet container -->
        <div class="bg-white text-black p-8 md:p-12 rounded-sm shadow-xl flex flex-col gap-6 text-left border border-gray-200 min-h-[500px] font-sans">
          <!-- Brand Header -->
          <div class="flex justify-between items-start border-b border-gray-200 pb-6">
            <div>
              <h1 class="text-xl font-bold tracking-tight text-gray-900 m-0">{{ profile?.agency_name || 'Design Agency' }}</h1>
              <p class="text-xs text-gray-500 mt-1">{{ profile?.tagline || 'Premium Deliveries' }}</p>
            </div>
            <div class="text-right">
              <h2 class="text-lg font-bold text-gray-900 uppercase m-0 tracking-wider">Invoice</h2>
              <span class="text-xs font-mono text-gray-500">{{ selectedInvoice.invoice_number }}</span>
            </div>
          </div>

          <!-- Billing Info splits -->
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div>
              <h4 class="font-bold text-gray-900 mb-1">Billed To</h4>
              <p class="text-gray-600 font-medium">{{ client?.name }}</p>
              <p class="text-gray-500">{{ client?.company }}</p>
            </div>
            <div class="text-right">
              <h4 class="font-bold text-gray-900 mb-1">Details</h4>
              <p class="text-gray-600">Issue Date: <span class="font-mono">{{ formatDate(selectedInvoice.created_at) }}</span></p>
              <p class="text-gray-600">Due Date: <span class="font-mono">{{ formatDate(selectedInvoice.due_date) }}</span></p>
              <p class="text-gray-600 mt-1">Status: 
                <span class="font-bold uppercase" :class="selectedInvoice.status === 'paid' ? 'text-emerald-600' : 'text-[#8A6020]'">
                  {{ selectedInvoice.status }}
                </span>
              </p>
            </div>
          </div>

          <!-- Items list -->
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-gray-200 text-gray-500 font-semibold">
                <th class="py-2">Description</th>
                <th class="py-2 text-center w-12">Qty</th>
                <th class="py-2 text-right w-20">Rate</th>
                <th class="py-2 text-right w-20">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedInvoice.line_items" :key="item.id" class="border-b border-gray-100 text-gray-800">
                <td class="py-2.5 font-medium">{{ item.description }}</td>
                <td class="py-2.5 text-center font-mono">{{ item.qty }}</td>
                <td class="py-2.5 text-right font-mono">${{ (item.rate || 0).toFixed(2) }}</td>
                <td class="py-2.5 text-right font-mono">${{ getLineAmount(item).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals block -->
          <div class="w-48 ml-auto flex flex-col gap-2 text-xs border-t border-gray-200 pt-4">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span class="font-mono">${{ (selectedInvoice.subtotal || 0).toFixed(2) }}</span>
            </div>
            <div v-if="selectedInvoice.tax_rate > 0" class="flex justify-between text-gray-600">
              <span>Tax ({{ selectedInvoice.tax_rate }}%)</span>
              <span class="font-mono">${{ (selectedInvoice.subtotal * (selectedInvoice.tax_rate / 100)).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2 text-sm">
              <span>Total Paid</span>
              <span class="font-mono">${{ (selectedInvoice.total || 0).toFixed(2) }}</span>
            </div>
          </div>

          <!-- Notes Footer notes -->
          <div v-if="selectedInvoice.notes" class="border-t border-gray-100 pt-4 mt-auto text-[10px] text-gray-500 leading-relaxed text-left">
            <h5 class="font-bold text-gray-900 mb-1">Notes & Terms</h5>
            <p>{{ selectedInvoice.notes }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .no-print {
    display: none !important;
  }
  .print-container {
    padding: 0 !important;
    margin: 0 !important;
  }
  .invoice-preview-panel {
    position: static !important;
    width: 100% !important;
  }
  .lg\:col-span-8 {
    grid-column: span 12 / span 12 !important;
  }
}
</style>
