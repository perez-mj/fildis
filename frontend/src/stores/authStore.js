// frontend/src/stores/authStore.js
import { defineStore } from 'pinia'
import authService from '@/services/authService'

export const useAuthStore = defineStore('auth', {
    state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
    returnUrl: null
  }),

  persist: {
    key: 'lms-auth',
    storage: localStorage,
    paths: ['user', 'accessToken', 'refreshToken']
  },

  getters: {
    isAuthenticated: (state) => !!state.accessToken && !!state.user,
    userRole: (state) => state.user?.role || null,
    userName: (state) => state.user?.name || `${state.user?.firstName} ${state.user?.lastName}` || '',
    userEmail: (state) => state.user?.email || '',
    isAdmin: (state) => state.user?.role === 'admin',
    isTeacher: (state) => state.user?.role === 'teacher',
    isStudent: (state) => state.user?.role === 'student',
    
    permissions: (state) => {
      const role = state.user?.role
      const permissions = {
        admin: ['manage_users', 'manage_courses', 'manage_teachers', 'manage_students', 'view_all_courses', 'create_announcements', 'manage_enrollments', 'view_reports'],
        teacher: ['view_my_courses', 'manage_materials', 'create_assignments', 'grade_submissions', 'post_announcements', 'view_my_students'],
        student: ['view_my_courses', 'view_materials', 'submit_assignments', 'view_grades', 'view_announcements']
      }
      return permissions[role] || []
    },
    
    hasPermission: (state) => (permission) => {
      const role = state.user?.role
      const permissions = {
        admin: ['manage_users', 'manage_courses', 'manage_teachers', 'manage_students', 'view_all_courses', 'create_announcements', 'manage_enrollments', 'view_reports'],
        teacher: ['view_my_courses', 'manage_materials', 'create_assignments', 'grade_submissions', 'post_announcements', 'view_my_students'],
        student: ['view_my_courses', 'view_materials', 'submit_assignments', 'view_grades', 'view_announcements']
      }
      return permissions[role]?.includes(permission) || false
    },
    
    dashboardRoute: (state) => {
      switch (state.user?.role) {
        case 'admin': return '/admin/dashboard'
        case 'teacher': return '/teacher/dashboard'
        case 'student': return '/student/dashboard'
        default: return '/login'
      }
    }
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      
      try {
        const response = await authService.login({ email, password })
        
        this.user = response.user
        this.accessToken = response.accessToken
        this.refreshToken = response.refreshToken
        
        // Set auth header for future requests
        authService.setAuthHeader(response.accessToken)
        
        return response
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

        async logout() {
      this.loading = true
      
      try {
        // Only call logout API if we have a valid token
        if (this.accessToken) {
          await authService.logout().catch(e => console.warn('Logout API error:', e))
        }
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear all state regardless of API success
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        this.returnUrl = null
        authService.removeAuthHeader()
        this.loading = false
        
        // Clear any pending requests
        localStorage.removeItem('lms-auth')
      }
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }
      
      try {
        const response = await authService.refreshToken(this.refreshToken)
        
        // Update tokens
        this.accessToken = response.accessToken
        this.refreshToken = response.refreshToken
        
        // Update axios header
        authService.setAuthHeader(response.accessToken)
        
        return response.accessToken
      } catch (error) {
        // Clear state on refresh failure
        this.user = null
        this.accessToken = null
        this.refreshToken = null
        authService.removeAuthHeader()
        throw error
      }
    },

    async changePassword(currentPassword, newPassword) {
      this.loading = true
      this.error = null
      
      try {
        await authService.changePassword({
          currentPassword,
          newPassword
        })
        
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Password change failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUserProfile() {
      if (!this.accessToken) return null
      
      this.loading = true
      
      try {
        const user = await authService.getProfile()
        this.user = user
        return user
      } catch (error) {
        console.error('Fetch profile error:', error)
        if (error.response?.status === 401) {
          await this.refreshAccessToken()
          return this.fetchUserProfile() // Retry with new token
        }
        return null
      } finally {
        this.loading = false
      }
    },

    setReturnUrl(url) {
      this.returnUrl = url
    },

    clearReturnUrl() {
      this.returnUrl = null
    },

    clearError() {
      this.error = null
    }
  }
})