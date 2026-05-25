import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const usePortalStore = defineStore('portal', {
  state: () => ({
    client: null,
    freelancerProfile: null,
    projects: [],
    activeProject: null,
    milestones: [],
    updates: [],
    files: [],
    invoices: [],
    feedback: [],
    loading: false,
    error: null
  }),

  actions: {
    async initPortal(slug, token) {
      this.loading = true
      this.error = null
      try {
        // 1. Fetch freelancer profile by slug
        const { data: freelancer, error: freelancerError } = await supabase
          .from('profiles')
          .select('*')
          .eq('portal_slug', slug)
          .single()
        if (freelancerError) throw new Error('Freelancer portal not found')
        this.freelancerProfile = freelancer

        // 2. Verify token matches a client for this freelancer
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('freelancer_id', freelancer.id)
          .eq('portal_access_token', token)
          .single()
        if (clientError || !client) throw new Error('Invalid or expired client portal token')
        this.client = client

        // Save token in localStorage
        localStorage.setItem(`portal_token_${slug}`, token)

        // 3. Load all projects for this client
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('client_id', client.id)
        if (projectsError) throw projectsError
        this.projects = projects || []

        const promises = [
          supabase.from('invoices').select('*').eq('client_id', client.id)
        ]

        if (this.projects.length > 0) {
          promises.push(this.setActiveProject(this.projects[0].id))
        }

        const [invoicesRes] = await Promise.all(promises)

        if (invoicesRes.error) throw invoicesRes.error
        this.invoices = invoicesRes.data || []
      } catch (err) {
        this.error = err.message
        console.error('Error initializing portal:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async setActiveProject(projectId) {
      const proj = this.projects.find(p => p.id === projectId)
      if (!proj) return
      this.activeProject = proj

      try {
        const [
          milestonesRes,
          updatesRes,
          filesRes,
          feedbackRes
        ] = await Promise.all([
          supabase.from('milestones').select('*').eq('project_id', projectId).order('order_index', { ascending: true }),
          supabase.from('updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('files').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
          supabase.from('feedback').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
        ])

        if (milestonesRes.error) throw milestonesRes.error
        this.milestones = milestonesRes.data || []

        if (updatesRes.error) throw updatesRes.error
        this.updates = updatesRes.data || []

        if (filesRes.error) throw filesRes.error
        this.files = filesRes.data || []

        if (feedbackRes.error) throw feedbackRes.error
        this.feedback = feedbackRes.data || []
      } catch (err) {
        console.error('Error fetching project portal data:', err)
      }
    },

    async markUpdateRead(updateId) {
      try {
        const { error } = await supabase
          .from('updates')
          .update({ read_by_client: true })
          .eq('id', updateId)
        if (error) throw error
        const idx = this.updates.findIndex(u => u.id === updateId)
        if (idx !== -1) {
          this.updates[idx].read_by_client = true
        }
      } catch (err) {
        console.error('Error marking update as read:', err)
      }
    },

    async approveFile(fileId) {
      try {
        const { error } = await supabase
          .from('files')
          .update({ status: 'approved' })
          .eq('id', fileId)
        if (error) throw error
        const idx = this.files.findIndex(f => f.id === fileId)
        if (idx !== -1) {
          this.files[idx].status = 'approved'
        }
      } catch (err) {
        console.error('Error approving file:', err)
        throw err
      }
    },

    async requestChanges(fileId, feedbackContent) {
      try {
        // 1. Add feedback comment
        const { data: feedbackItem, error: fbError } = await supabase
          .from('feedback')
          .insert({
            project_id: this.activeProject.id,
            file_id: fileId,
            author_type: 'client',
            author_name: this.client.name,
            content: feedbackContent
          })
          .select()
          .single()
        if (fbError) throw fbError

        // Add feedback locally
        this.feedback.push(feedbackItem)

        // 2. Update file status
        const { error: fileError } = await supabase
          .from('files')
          .update({ status: 'changes_requested' })
          .eq('id', fileId)
        if (fileError) throw fileError

        const idx = this.files.findIndex(f => f.id === fileId)
        if (idx !== -1) {
          this.files[idx].status = 'changes_requested'
        }
      } catch (err) {
        console.error('Error requesting changes:', err)
        throw err
      }
    },

    async markInvoicePaid(invoiceId) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId)
        if (error) throw error
        const idx = this.invoices.findIndex(i => i.id === invoiceId)
        if (idx !== -1) {
          this.invoices[idx].status = 'paid'
        }
      } catch (err) {
        console.error('Error marking invoice paid:', err)
        throw err
      }
    },

    async markInvoiceViewed(invoiceId) {
      try {
        const { error } = await supabase
          .from('invoices')
          .update({ status: 'viewed' })
          .eq('id', invoiceId)
        if (error) throw error
        const idx = this.invoices.findIndex(i => i.id === invoiceId)
        if (idx !== -1) {
          this.invoices[idx].status = 'viewed'
        }
      } catch (err) {
        console.error('Error marking invoice viewed:', err)
      }
    }
  }
})
