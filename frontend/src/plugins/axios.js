// frontend/src/plugins/axios.js
import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import router from '@/router'

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    const token = authStore.accessToken
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor with token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }
    
    originalRequest._retry = true
    
    const authStore = useAuthStore()
    
    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      }).catch(err => Promise.reject(err))
    }
    
    isRefreshing = true
    
    try {
      // Attempt to refresh token
      await authStore.refreshAccessToken()
      
      // Get new token
      const newToken = authStore.accessToken
      
      // Update failed requests queue
      processQueue(null, newToken)
      
      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
      
    } catch (refreshError) {
      // Refresh failed - clear all tokens and redirect to login
      processQueue(refreshError, null)
      await authStore.logout()
      router.push('/login?sessionExpired=true')
      return Promise.reject(refreshError)
      
    } finally {
      isRefreshing = false
    }
  }
)

export default api