import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Mock database builder
class MockQueryBuilder {
  constructor(table) {
    this.table = table
    this.filters = []
    this.orderCol = null
    this.orderAsc = true
    this.limitVal = null
    this.operation = 'select'
    this.payload = null
    this.countOnly = false
  }

  select(fields, options) {
    this.operation = 'select'
    if (options && options.count) {
      this.countOnly = true
    }
    return this
  }

  eq(col, val) {
    this.filters.push(item => item[col] === val)
    return this
  }

  in(col, vals) {
    this.filters.push(item => vals.includes(item[col]))
    return this
  }

  is(col, val) {
    this.filters.push(item => item[col] === val)
    return this
  }

  not(col, op, val) {
    if (op === 'is' && val === null) {
      this.filters.push(item => item[col] !== null && item[col] !== undefined)
    }
    return this
  }

  order(col, opts) {
    this.orderCol = col
    this.orderAsc = opts ? opts.ascending !== false : true
    return this
  }

  limit(n) {
    this.limitVal = n
    return this
  }

  insert(payload) {
    this.operation = 'insert'
    this.payload = payload
    return this
  }

  update(payload) {
    this.operation = 'update'
    this.payload = payload
    return this
  }

  delete() {
    this.operation = 'delete'
    return this
  }

  async execute() {
    let list = JSON.parse(localStorage.getItem(`mock_db_${this.table}`) || '[]')

    // Apply filters
    for (const f of this.filters) {
      list = list.filter(f)
    }

    if (this.operation === 'select') {
      if (this.orderCol) {
        list.sort((a, b) => {
          const valA = a[this.orderCol]
          const valB = b[this.orderCol]
          if (valA < valB) return this.orderAsc ? -1 : 1
          if (valA > valB) return this.orderAsc ? 1 : -1
          return 0
        })
      }
      if (this.limitVal !== null) {
        list = list.slice(0, this.limitVal)
      }
      if (this.countOnly) {
        return { data: null, error: null, count: list.length }
      }
      return { data: list, error: null }
    }

    if (this.operation === 'insert') {
      const rows = Array.isArray(this.payload) ? this.payload : [this.payload]
      const inserted = rows.map(r => ({
        id: r.id || 'mock-' + Math.random().toString(36).substring(2, 11),
        created_at: new Date().toISOString(),
        ...r
      }))
      
      const fullList = JSON.parse(localStorage.getItem(`mock_db_${this.table}`) || '[]')
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify([...inserted, ...fullList]))
      
      return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null }
    }

    if (this.operation === 'update') {
      const fullList = JSON.parse(localStorage.getItem(`mock_db_${this.table}`) || '[]')
      const updatedList = fullList.map(item => {
        let match = true
        for (const f of this.filters) {
          if (!f(item)) {
            match = false
            break
          }
        }
        if (match) {
          return { ...item, ...this.payload }
        }
        return item
      })
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(updatedList))
      return { data: this.payload, error: null }
    }

    if (this.operation === 'delete') {
      const fullList = JSON.parse(localStorage.getItem(`mock_db_${this.table}`) || '[]')
      const remainingList = fullList.filter(item => {
        let match = true
        for (const f of this.filters) {
          if (!f(item)) {
            match = false
            break
          }
        }
        return !match
      })
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(remainingList))
      return { data: null, error: null }
    }
  }

  then(resolve, reject) {
    this.execute().then(resolve, reject)
  }

  single() {
    return {
      then: (resolve, reject) => {
        this.execute().then(res => {
          if (res.error) return resolve(res)
          const data = Array.isArray(res.data) ? res.data[0] : res.data
          resolve({ data: data || null, error: data ? null : new Error('Row not found') })
        }, reject)
      }
    }
  }

  maybeSingle() {
    return {
      then: (resolve, reject) => {
        this.execute().then(res => {
          if (res.error) return resolve(res)
          const data = Array.isArray(res.data) ? res.data[0] : res.data
          resolve({ data: data || null, error: null })
        }, reject)
      }
    }
  }
}

// Mock auth client
let authListeners = []
const triggerAuthListeners = (event, session) => {
  authListeners.forEach(callback => callback(event, session ? { session } : null))
}

const mockAuth = {
  getSession: async () => {
    const user = JSON.parse(localStorage.getItem('mock_session_user') || 'null')
    return { data: { session: user ? { user } : null }, error: null }
  },
  getUser: async () => {
    const user = JSON.parse(localStorage.getItem('mock_session_user') || 'null')
    return { data: { user }, error: null }
  },
  signInWithPassword: async ({ email, password }) => {
    const profiles = JSON.parse(localStorage.getItem('mock_db_profiles') || '[]')
    let userProfile = profiles.find(p => p.email === email || p.id === email)
    const user = { id: userProfile?.id || 'mock-user-123', email }
    localStorage.setItem('mock_session_user', JSON.stringify(user))

    if (!userProfile) {
      userProfile = {
        id: user.id,
        full_name: email.split('@')[0],
        agency_name: 'Mock Agency',
        plan: 'free',
        brand_color: '#C9A84C',
        portal_slug: 'mock-portal'
      }
      localStorage.setItem('mock_db_profiles', JSON.stringify([...profiles, userProfile]))
    }

    triggerAuthListeners('SIGNED_IN', { user })
    return { data: { user }, error: null }
  },
  signUp: async ({ email, password }) => {
    const user = { id: 'mock-user-' + Math.random().toString(36).substring(2, 11), email }
    localStorage.setItem('mock_session_user', JSON.stringify(user))
    triggerAuthListeners('SIGNED_IN', { user })
    return { data: { user }, error: null }
  },
  signOut: async () => {
    localStorage.removeItem('mock_session_user')
    triggerAuthListeners('SIGNED_OUT', null)
    return { error: null }
  },
  signInWithOAuth: async () => {
    const user = { id: 'mock-google-user', email: 'google-user@example.com' }
    localStorage.setItem('mock_session_user', JSON.stringify(user))
    triggerAuthListeners('SIGNED_IN', { user })
    return { error: null }
  },
  onAuthStateChange: (callback) => {
    authListeners.push(callback)
    const user = JSON.parse(localStorage.getItem('mock_session_user') || 'null')
    callback(user ? 'SIGNED_IN' : 'SIGNED_OUT', user ? { user } : null)
    return { data: { subscription: { unsubscribe: () => {
      authListeners = authListeners.filter(l => l !== callback)
    } } } }
  }
}

// Mock storage client
const mockStorage = {
  from: () => ({
    upload: async (path) => {
      return { data: { path }, error: null }
    },
    getPublicUrl: () => {
      return { data: { publicUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop' } }
    },
    createSignedUrl: async () => {
      return { data: { signedUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop' }, error: null }
    },
    remove: async () => {
      return { data: null, error: null }
    }
  })
}

// Realtime ChannelMock
const mockChannel = {
  on: () => mockChannel,
  subscribe: () => mockChannel,
  unsubscribe: () => {}
}

const mockSupabase = {
  auth: mockAuth,
  storage: mockStorage,
  from: (table) => new MockQueryBuilder(table),
  channel: () => mockChannel
}

// Seed mock database on local load
const seedMockDB = () => {
  if (true) { // Force re-seed to match UI
    localStorage.clear()
    const profileId = 'mock-user-123'
    
    localStorage.setItem('mock_db_profiles', JSON.stringify([{
      id: profileId,
      full_name: 'Adarsh Parmar',
      agency_name: 'Antigravity Agency',
      tagline: 'Premium Design & Engineering Studio',
      logo_url: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop',
      brand_color: '#C9A84C',
      portal_slug: 'antigravity',
      plan: 'pro'
    }]))

    const client1Id = 'client-1'
    const client2Id = 'client-2'
    localStorage.setItem('mock_db_clients', JSON.stringify([
      { id: client1Id, freelancer_id: profileId, name: 'Design', company: 'Design', created_at: new Date().toISOString() },
      { id: client2Id, freelancer_id: profileId, name: 'Development', company: 'Development', created_at: new Date().toISOString() },
      { id: 'client-3', freelancer_id: profileId, name: 'Vertex Capital', company: 'Vertex Capital', created_at: new Date().toISOString() },
      { id: 'client-4', freelancer_id: profileId, name: 'Amount: $12,500', company: 'Amount: $12,500', created_at: new Date().toISOString() },
      { id: 'client-5', freelancer_id: profileId, name: 'Project: Aura Branding', company: 'Project: Aura Branding', created_at: new Date().toISOString() },
      ...Array.from({ length: 7 }).map((_, i) => ({ id: `client-extra-${i}`, freelancer_id: profileId, name: 'Extra', company: 'Extra', created_at: new Date().toISOString() }))
    ]))

    localStorage.setItem('mock_db_projects', JSON.stringify([
      {
        id: 'proj-1', freelancer_id: profileId, client_id: client1Id,
        name: 'Aura Branding Identity', status: 'In Progress',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'proj-2', freelancer_id: profileId, client_id: client2Id,
        name: 'Nexus Web Platform', status: 'Planning',
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1000).toISOString()
      },
      // Deadlines
      {
        id: 'proj-3', freelancer_id: profileId, client_id: 'client-3',
        name: 'Review Wireframes', status: 'active',
        due_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'proj-4', freelancer_id: profileId, client_id: 'client-4',
        name: 'Invoice #1042 Due', status: 'active',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString()
      },
      {
        id: 'proj-5', freelancer_id: profileId, client_id: 'client-5',
        name: 'Final Assets Delivery', status: 'active',
        due_date: new Date(new Date().getFullYear(), 9, 24).toISOString(), // Oct 24
        created_at: new Date().toISOString()
      },
      ...Array.from({ length: 3 }).map((_, i) => ({
        id: `proj-extra-${i}`, freelancer_id: profileId, client_id: 'client-1',
        name: 'Extra Project', status: 'active',
        created_at: new Date().toISOString()
      }))
    ]))

    localStorage.setItem('mock_db_milestones', JSON.stringify([
      { id: 'm1', project_id: 'proj-1', title: 'Discovery Session', status: 'completed', due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], order_index: 0 }
    ]))

    localStorage.setItem('mock_db_updates', JSON.stringify([
      // mock updates
    ]))

    localStorage.setItem('mock_db_files', JSON.stringify([
      { id: 'f1', project_id: 'proj-1', name: 'aura_moodboard_v1.pdf', status: 'pending' },
      { id: 'f2', project_id: 'proj-1', name: 'f2', status: 'pending' },
      { id: 'f3', project_id: 'proj-1', name: 'f3', status: 'pending' }
    ]))

    localStorage.setItem('mock_db_invoices', JSON.stringify(Array.from({ length: 24 }).map((_, i) => ({
      id: `i${i}`, project_id: 'proj-1', client_id: 'client-1', freelancer_id: profileId,
      status: 'sent'
    }))))

    localStorage.setItem('mock_db_feedback', JSON.stringify([]))

    localStorage.setItem('mock_session_user', JSON.stringify({ id: profileId, email: 'freelancer@example.com' }))
  }
}

// Select active layer
let supabaseInstance
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url' || supabaseAnonKey === 'your_supabase_anon_key') {
  console.log('%c[ClientOS] Supabase credentials not found. Initializing Local Mock Database.', 'color: #C9A84C; font-weight: bold;')
  seedMockDB()
  supabaseInstance = mockSupabase
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = supabaseInstance
