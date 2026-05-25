import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

// Pages
import LandingPage from '../pages/landing/LandingPage.vue'
import LoginPage from '../pages/auth/LoginPage.vue'
import SignupPage from '../pages/auth/SignupPage.vue'
import OnboardingPage from '../pages/OnboardingPage.vue'

// App Pages
import AppShell from '../components/layout/AppShell.vue'
import DashboardHome from '../pages/app/DashboardHome.vue'
import ClientsList from '../pages/app/ClientsList.vue'
import ProjectsList from '../pages/app/ProjectsList.vue'
import ProjectDetail from '../pages/app/ProjectDetail.vue'
import AllInvoices from '../pages/app/AllInvoices.vue'
import InvoiceBuilder from '../pages/app/InvoiceBuilder.vue'
import Settings from '../pages/app/Settings.vue'

// Portal Pages
import PortalLayout from '../components/layout/PortalLayout.vue'
import PortalAccess from '../pages/portal/PortalAccess.vue'
import PortalOverview from '../pages/portal/PortalOverview.vue'
import PortalFiles from '../pages/portal/PortalFiles.vue'
import PortalInvoices from '../pages/portal/PortalInvoices.vue'
import PortalFeedback from '../pages/portal/PortalFeedback.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage
  },
  {
    path: '/login',
    name: 'login',
    component: LoginPage
  },
  {
    path: '/signup',
    name: 'signup',
    component: SignupPage
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: OnboardingPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/app',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/app/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: DashboardHome },
      { path: 'clients', name: 'clients', component: ClientsList },
      { path: 'clients/:id', redirect: '/app/clients' }, // client details fallback redirection
      { path: 'projects', name: 'projects', component: ProjectsList },
      { path: 'projects/:id', name: 'project-detail', component: ProjectDetail },
      { path: 'invoices', name: 'invoices', component: AllInvoices },
      { path: 'invoices/new', name: 'invoice-create', component: InvoiceBuilder },
      { path: 'invoices/:id', name: 'invoice-edit', component: InvoiceBuilder },
      { path: 'settings', name: 'settings', component: Settings }
    ]
  },
  {
    path: '/portal/:slug',
    name: 'portal-access',
    component: PortalAccess
  },
  {
    path: '/portal/:slug',
    component: PortalLayout,
    children: [
      { path: 'overview', name: 'portal-overview', component: PortalOverview },
      { path: 'files', name: 'portal-files', component: PortalFiles },
      { path: 'invoices', name: 'portal-invoices', component: PortalInvoices },
      { path: 'feedback', name: 'portal-feedback', component: PortalFeedback }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Make sure auth is initialized
  if (authStore.loading && !authStore.user) {
    // If auth is still loading, wait
    await authStore.initialize()
  } else if (!authStore.user) {
    // Attempt initialize one-time
    await authStore.initialize()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isOnboarded = authStore.isOnboarded

  // 1. Guard for authenticated routes
  if (to.meta.requiresAuth) {
    if (!isAuthenticated) {
      return next({ name: 'login' })
    }

    // Onboarding guard: if not onboarded and trying to access app -> onboarding
    if (!isOnboarded && to.name !== 'onboarding') {
      return next({ name: 'onboarding' })
    }

    // If already onboarded and trying to access onboarding -> dashboard
    if (isOnboarded && to.name === 'onboarding') {
      return next({ name: 'dashboard' })
    }

    return next()
  }

  // 2. Guard for public auth pages (login / signup)
  if ((to.name === 'login' || to.name === 'signup') && isAuthenticated) {
    if (isOnboarded) {
      return next({ name: 'dashboard' })
    } else {
      return next({ name: 'onboarding' })
    }
  }

  // 3. Portal token authentication check
  if (to.path.startsWith('/portal/') && to.name !== 'portal-access') {
    const slug = to.params.slug
    const localToken = localStorage.getItem(`portal_token_${slug}`)
    const queryToken = to.query.token

    const token = queryToken || localToken
    if (!token) {
      return next({ name: 'portal-access', params: { slug } })
    }
  }

  next()
})

export default router
