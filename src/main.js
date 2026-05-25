import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useToast } from './composables/useToast'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Custom directive for input focus
app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

// Global Error Handler
app.config.errorHandler = (err, instance, info) => {
  console.error('ClientOS Global Error:', err, info)
  
  // Attempt to show global toast for errors
  try {
    const toast = useToast()
    toast.error('An unexpected error occurred: ' + (err.message || 'Check connection'))
  } catch (e) {
    console.warn('Toast unavailable during global error:', e)
  }

  // Redirect to login on critical authentication failures
  if (err.message?.includes('JWT') || err.message?.includes('token') || err.message?.includes('unauthorized')) {
    router.push('/login')
  }
}

app.mount('#app')
