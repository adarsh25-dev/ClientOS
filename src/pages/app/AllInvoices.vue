<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInvoicesStore } from '../../stores/invoices'
import { useToast } from '../../composables/useToast'
import SkeletonLoader from '../../components/ui/SkeletonLoader.vue'
import EmptyState from '../../components/ui/EmptyState.vue'

const invoicesStore = useInvoicesStore()
const toast = useToast()
const router = useRouter()

// Refs
const searchQuery = ref('')

const fetchInvoices = async () => {
  try {
    await invoicesStore.fetchInvoices()
  } catch (err) {
    toast.error('Failed to load invoices')
  }
}

const handleDelete = async (e, id) => {
  e.stopPropagation()
  if (!confirm('Are you sure you want to delete this invoice?')) return
  try {
    await invoicesStore.deleteInvoice(id)
    toast.success('Invoice deleted')
  } catch (err) {
    toast.error('Failed to delete invoice')
  }
}

// Filter invoices
const filteredInvoices = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return invoicesStore.invoices

  return invoicesStore.invoices.filter(i => 
    i.invoice_number.toLowerCase().includes(q) ||
    i.clients?.name?.toLowerCase().includes(q) ||
    i.projects?.name?.toLowerCase().includes(q)
  )
})

const getStatusColor = (status) => {
  switch (status) {
    case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    case 'sent':
    case 'viewed':
      return 'bg-warning/10 text-warning border-warning/20'
    default: return 'bg-gray-500/10 text-on-surface-variant border-gray-500/20'
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
}

onMounted(() => {
  fetchInvoices()
})
</script>

<template>
  <div class="flex flex-col gap-8 text-left">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-custom-border pb-6">
      <div>
        <h2 class="font-display text-2xl text-on-surface mb-1">Invoices</h2>
        <p class="font-body text-xs text-on-surface-variant">Generate line item summaries and printable PDF invoices.</p>
      </div>
      <router-link
        to="/app/invoices/new"
        class="bg-primary hover:bg-primary-container text-on-primary font-button text-xs uppercase tracking-widest py-3 px-6 rounded-sm transition-colors flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-sm">receipt</span>
        Build Invoice
      </router-link>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 max-w-md w-full relative">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-custom-muted text-sm">search</span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Filter invoices by invoice reference or client..."
        class="w-full bg-custom-bg-card border border-custom-border rounded-sm py-2 pl-10 pr-4 text-sm text-on-surface placeholder-custom-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>

    <!-- Skeletons -->
    <div v-if="invoicesStore.loading && invoicesStore.invoices.length === 0" class="flex flex-col gap-3">
      <SkeletonLoader type="list-item" :count="3" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredInvoices.length === 0" class="py-12">
      <EmptyState
        title="No invoices found"
        description="Build an invoice to configure subtotal listings, line items, and print pdf layouts."
        action-label="Build Invoice"
        action-route="/app/invoices/new"
      />
    </div>

    <!-- Invoices List -->
    <div v-else class="flex flex-col gap-3">
      <div
        v-for="invoice in filteredInvoices"
        :key="invoice.id"
        @click="router.push(`/app/invoices/${invoice.id}`)"
        class="bg-custom-bg-card border border-custom-border p-4 rounded-sm flex items-center justify-between hover:bg-custom-hover transition-colors cursor-pointer group"
      >
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-custom-hover flex items-center justify-center border border-custom-border">
            <span class="material-symbols-outlined text-on-surface-variant">receipt_long</span>
          </div>
          <div class="text-left">
            <h4 class="font-button text-sm font-semibold text-on-surface">{{ invoice.invoice_number }}</h4>
            <p class="text-xs text-custom-muted mt-0.5">
              Client: <strong class="text-on-surface-variant">{{ invoice.clients?.name }}</strong> 
              <span v-if="invoice.projects?.name"> • Project: <strong class="text-on-surface-variant">{{ invoice.projects.name }}</strong></span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="text-right">
            <span class="text-xs font-mono font-semibold text-primary">${{ invoice.total }}</span>
            <p class="text-[10px] text-custom-muted mt-0.5">Due: {{ formatDate(invoice.due_date) }}</p>
          </div>

          <div class="flex items-center gap-3">
            <span class="px-2.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded border" :class="getStatusColor(invoice.status)">
              {{ invoice.status }}
            </span>
            <!-- Delete button -->
            <button
              @click="handleDelete($event, invoice.id)"
              class="opacity-0 group-hover:opacity-100 text-custom-muted hover:text-red-400 transition-all"
            >
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
