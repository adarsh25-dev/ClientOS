import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [],
    currentProject: null,
    currentClient: null,
    milestones: [],
    files: [],
    feedback: [],
    updates: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchProjects() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, clients(name, company)')
          .order('created_at', { ascending: false })
        if (error) throw error
        this.projects = data
      } catch (err) {
        this.error = err.message
        console.error('Error fetching projects:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchProjectDetail(projectId) {
      this.loading = true
      this.error = null
      try {
        // Fetch project first as we need client_id
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()
        if (projectError) throw projectError
        this.currentProject = project

        // Now fetch everything else concurrently
        const [
          clientRes,
          milestonesRes,
          filesRes,
          updatesRes,
          feedbackRes
        ] = await Promise.all([
          supabase.from('clients').select('*').eq('id', project.client_id).single(),
          supabase.from('milestones').select('*').eq('project_id', projectId).order('order_index', { ascending: true }),
          supabase.from('files').select('*').eq('project_id', projectId).order('uploaded_at', { ascending: false }),
          supabase.from('updates').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
          supabase.from('feedback').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
        ])

        if (clientRes.error) throw clientRes.error
        this.currentClient = clientRes.data

        if (milestonesRes.error) throw milestonesRes.error
        this.milestones = milestonesRes.data

        if (filesRes.error) throw filesRes.error
        this.files = filesRes.data

        if (updatesRes.error) throw updatesRes.error
        this.updates = updatesRes.data

        if (feedbackRes.error) throw feedbackRes.error
        this.feedback = feedbackRes.data
      } catch (err) {
        this.error = err.message
        console.error('Error loading project detail:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async createProject({ name, description, clientId, dueDate }) {
      this.loading = true
      this.error = null
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const { data, error } = await supabase
          .from('projects')
          .insert({
            freelancer_id: user.id,
            client_id: clientId,
            name,
            description,
            due_date: dueDate,
            status: 'active'
          })
          .select()
          .single()
        if (error) throw error
        this.projects.unshift(data)
        return data
      } catch (err) {
        this.error = err.message
        console.error('Error creating project:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateProjectStatus(projectId, status) {
      try {
        const { error } = await supabase
          .from('projects')
          .update({ status })
          .eq('id', projectId)
        if (error) throw error
        if (this.currentProject && this.currentProject.id === projectId) {
          this.currentProject.status = status
        }
        const proj = this.projects.find(p => p.id === projectId)
        if (proj) proj.status = status
      } catch (err) {
        console.error('Error updating project status:', err)
        throw err
      }
    },

    async addMilestone({ title, dueDate }) {
      try {
        const orderIndex = this.milestones.length
        const { data, error } = await supabase
          .from('milestones')
          .insert({
            project_id: this.currentProject.id,
            title,
            due_date: dueDate,
            status: 'pending',
            order_index: orderIndex
          })
          .select()
          .single()
        if (error) throw error
        this.milestones.push(data)
        return data
      } catch (err) {
        console.error('Error adding milestone:', err)
        throw err
      }
    },

    async updateMilestone(milestoneId, updates) {
      try {
        const { error } = await supabase
          .from('milestones')
          .update(updates)
          .eq('id', milestoneId)
        if (error) throw error
        const idx = this.milestones.findIndex(m => m.id === milestoneId)
        if (idx !== -1) {
          this.milestones[idx] = { ...this.milestones[idx], ...updates }
        }
      } catch (err) {
        console.error('Error updating milestone:', err)
        throw err
      }
    },

    async deleteMilestone(milestoneId) {
      try {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .eq('id', milestoneId)
        if (error) throw error
        this.milestones = this.milestones.filter(m => m.id !== milestoneId)
      } catch (err) {
        console.error('Error deleting milestone:', err)
        throw err
      }
    },

    async reorderMilestones(reorderedList) {
      // reorderedList has the full array in new order
      try {
        this.milestones = reorderedList
        const promises = reorderedList.map((m, index) => {
          return supabase
            .from('milestones')
            .update({ order_index: index })
            .eq('id', m.id)
        })
        await Promise.all(promises)
      } catch (err) {
        console.error('Error saving reordered milestones:', err)
        throw err
      }
    }
  }
})
