import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://planitask-project.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor : attach JWT ──────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor : global error handling ──────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    } else if (error.response?.status >= 500) {
      showToast('Erreur serveur. Veuillez réessayer.', 'error')
    } else if (!error.response) {
      showToast('Connexion impossible. Vérifiez que le serveur est démarré.', 'error')
    }
    return Promise.reject(error)
  },
)

function showToast(message: string, type: 'error' | 'success') {
  const existing = document.getElementById('global-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'global-toast'
  toast.style.cssText = `
    position:fixed; bottom:24px; right:24px; z-index:9999;
    padding:12px 20px; border-radius:12px; font-size:14px; font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,0.15); max-width:400px;
    background:${type === 'error' ? '#FEF2F2' : '#F0FDF4'};
    color:${type === 'error' ? '#DC2626' : '#16A34A'};
    border:1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'};
    animation:slideIn 0.3s ease;
  `
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}

export function showSuccess(message: string) { showToast(message, 'success') }
export function showError(message: string) { showToast(message, 'error') }

export default axiosInstance
