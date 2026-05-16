// frontend/src/services/authService.js
import axios from 'axios'  // Import plain axios, NOT your api instance
import api from '@/plugins/axios'

class AuthService {
  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  }

  // Logout user
  async logout() {
    try {
      const response = await api.post('/auth/logout')
      return response.data
    } catch (error) {
      console.error('Logout API error:', error)
      throw error
    }
  }

  // Refresh access token - USE PLAIN AXIOS, NOT the interceptor
  async refreshToken(refreshToken) {
    // Create a temporary axios instance WITHOUT interceptors
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
      { refreshToken },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )
    return response.data
  }

  // Rest of your methods remain the same...
  async changePassword(data) {
    const response = await api.post('/auth/change-password', data)
    return response.data
  }

  async getProfile() {
    const response = await api.get('/auth/profile')
    return response.data
  }

  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  }

  setAuthHeader(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  }

  removeAuthHeader() {
    delete api.defaults.headers.common['Authorization']
  }
}

export default new AuthService()