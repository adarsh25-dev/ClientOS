import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useInvoicesStore = defineStore('invoices', {
  state: () => ({
    invoices: [],
    currentInvoice: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchInvoices() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(name, company), projects(name)')
          .order('created_at', { ascending: false })
        if (error) throw error
        this.invoices = data
      } catch (err) {
        this.error = err.message
        console.error('Error fetching invoices:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchInvoiceDetail(invoiceId) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('invoices')
          .select('*, clients(*), projects(*), profiles(*)')
          .eq('id', invoiceId)
          .single()
        if (error) throw error
        this.currentInvoice = data
        return data
      } catch (err) {
        this.error = err.message
        console.error('Error loading invoice detail:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async createInvoice(invoiceData) {
      this.loading = true
      this.error = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('invoices')
          .insert({
            freelancer_id: user.id,
            client_id: invoiceData.clientId,
            project_id: invoiceData.projectId,
            invoice_number: invoiceData.invoiceNumber,
            line_items: invoiceData.lineItems,
            subtotal: invoiceData.subtotal,
            tax_rate: invoiceData.taxRate,
            total: invoiceData.total,
            notes: invoiceData.notes,
            due_date: invoiceData.dueDate,
            status: invoiceData.status || 'draft'
          })
          .select()
          .single()
        if (error) throw error

        this.invoices.unshift(data)
        return data
      } catch (err) {
        this.error = err.message
        console.error('Error creating invoice:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateInvoice(invoiceId, invoiceData) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('invoices')
          .update({
            client_id: invoiceData.clientId,
            project_id: invoiceData.projectId,
            invoice_number: invoiceData.invoiceNumber,
            line_items: invoiceData.lineItems,
            subtotal: invoiceData.subtotal,
            tax_rate: invoiceData.taxRate,
            total: invoiceData.total,
            notes: invoiceData.notes,
            due_date: invoiceData.dueDate,
            status: invoiceData.status
          })
          .eq('id', invoiceId)
          .select()
          .single()
        if (error) throw error

        const idx = this.invoices.findIndex(inv => inv.id === invoiceId)
        if (idx !== -1) {
          this.invoices[idx] = data
        }
        if (this.currentInvoice && this.currentInvoice.id === invoiceId) {
          this.currentInvoice = data
        }
        return data
      } catch (err) {
        this.error = err.message
        console.error('Error updating invoice:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteInvoice(invoiceId) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoiceId)
        if (error) throw error
        this.invoices = this.invoices.filter(i => i.id !== invoiceId)
      } catch (err) {
        this.error = err.message
        console.error('Error deleting invoice:', err)
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
