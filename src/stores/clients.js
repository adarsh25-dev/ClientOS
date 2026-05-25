import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useClientsStore = defineStore('clients', {
  state: () => ({
    clients: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchClients() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error

        // Also fetch project counts for each client
        const clientsWithCounts = await Promise.all((data || []).map(async (client) => {
          const { count, error: countError } = await supabase
            .from('projects')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', client.id)
          
          return {
            ...client,
            projectCount: countError ? 0 : count
          }
        }))

        this.clients = clientsWithCounts
      } catch (err) {
        this.error = err.message
        console.error('Error fetching clients:', err)
      } finally {
        this.loading = false
      }
    },

    async createClient({ name, company, email, logoUrl }) {
      this.loading = true
      this.error = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('clients')
          .insert({
            freelancer_id: user.id,
            name,
            company,
            email,
            logo_url: logoUrl
          })
          .select()
          .single()
        if (error) throw error

        // Add to local state (with project count 0)
        this.clients.unshift({
          ...data,
          projectCount: 0
        })
        return data
      } catch (err) {
        this.error = err.message
        console.error('Error creating client:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteClient(clientId) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', clientId)
        if (error) throw error

        this.clients = this.clients.filter(c => c.id !== clientId)
      } catch (err) {
        this.error = err.message
        console.error('Error deleting client:', err)
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
