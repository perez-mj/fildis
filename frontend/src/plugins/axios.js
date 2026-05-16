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
        // CRITICAL: Don't add token for refresh endpoint
        if (config.url === '/auth/refresh') {
            return config
        }
        
        const authStore = useAuthStore()
        const token = authStore.accessToken
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        
        return config
    },
    (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        
        // CRITICAL: Don't retry refresh endpoint
        if (originalRequest.url === '/auth/refresh') {
            return Promise.reject(error)
        }
        
        // Check if error is due to token expiration
        const isTokenExpired = error.response?.status === 401 && 
                              (error.response?.data?.code === 'TOKEN_EXPIRED' ||
                               error.response?.data?.message?.toLowerCase().includes('expired'))
        
        // If not token expired or already retried, reject
        if (!isTokenExpired || originalRequest._retry) {
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
            console.log('🔄 Refreshing access token...')
            const newToken = await authStore.refreshAccessToken()
            console.log('✅ Token refreshed successfully')
            
            // Process queued requests
            processQueue(null, newToken)
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
            
        } catch (refreshError) {
            console.error('❌ Refresh token failed:', refreshError)
            processQueue(refreshError, null)
            
            // Clear auth state and redirect to login
            await authStore.logout()
            
            // Only redirect if not already on login page
            if (router.currentRoute.value.path !== '/login') {
                router.push('/login?sessionExpired=true')
            }
            
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

export default api