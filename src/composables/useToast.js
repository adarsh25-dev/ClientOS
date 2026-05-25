import { ref } from 'vue'

const toasts = ref([])

let nextId = 0

function addToast(type, message, duration = 3000) {
  const id = nextId++
  const toast = { id, type, message, duration }
  toasts.value.push(toast)

  if (duration > 0) {
    setTimeout(() => {
      dismiss(id)
    }, duration)
  }
}

function dismiss(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

export function useToast() {
  const success = (message, duration = 3000) => addToast('success', message, duration)
  const error = (message, duration = 5000) => addToast('error', message, duration)
  const warning = (message, duration = 4000) => addToast('warning', message, duration)
  const info = (message, duration = 3000) => addToast('info', message, duration)

  return {
    toasts,
    success,
    error,
    warning,
    info,
    dismiss
  }
}
