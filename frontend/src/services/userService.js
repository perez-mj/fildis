// frontend/src/services/userService.js
import api from '@/plugins/axios'

export default {
  // Get all users with filters
  async getUsers(params = {}) {
    const response = await api.get('/admin/users', { params })
    return response.data
  },

  // Get all teachers
  async getTeachers() {
    const response = await api.get('/admin/users', { params: { role: 'teacher', limit: 100 } })
    return response.data.data
  },

  // Get all students
  async getStudents() {
    const response = await api.get('/admin/users', { params: { role: 'student', limit: 100 } })
    return response.data.data
  },

  // Create new user
  async createUser(userData) {
    const response = await api.post('/admin/users', userData)
    return response.data.data
  },

  // Update user
  async updateUser(id, userData) {
    const response = await api.put(`/admin/users/${id}`, userData)
    return response.data.data
  },

  // Delete user
  async deleteUser(id) {
    const response = await api.delete(`/admin/users/${id}`)
    return response.data
  }
}