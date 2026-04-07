// frontend/src/services/authService.js
import api from '@/plugins/axios'

class AuthService {
  // Login user
  async login(credentials) {
    const response = await api.post('/auth/login', credentials)
    return response.data
  }

  // Logout user
  async logout() {
    const response = await api.post('/auth/logout')
    return response.data
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  }

  // Change password
  async changePassword(data) {
    const response = await api.post('/auth/change-password', data)
    return response.data
  }

  // Get user profile
  async getProfile() {
    const response = await api.get('/auth/profile')
    return response.data
  }

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/auth/profile', profileData)
    return response.data
  }

  // Set auth header
  setAuthHeader(token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Remove auth header
  removeAuthHeader() {
    delete api.defaults.headers.common['Authorization']
  }
}

export default new AuthService()