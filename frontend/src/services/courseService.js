// frontend/src/services/courseService.js
import api from '@/plugins/axios'

export default {
  // Get all courses
  async getCourses(params = {}) {
    const response = await api.get('/admin/courses', { params })
    return response.data
  },

  // Get course by ID
  async getCourse(id) {
    const response = await api.get(`/admin/courses/${id}`)
    return response.data.data
  },

  // Create course
  async createCourse(courseData) {
    const response = await api.post('/admin/courses', courseData)
    return response.data.data
  },

  // Update course
  async updateCourse(id, courseData) {
    const response = await api.put(`/admin/courses/${id}`, courseData)
    return response.data.data
  },

  // Delete course
  async deleteCourse(id) {
    const response = await api.delete(`/admin/courses/${id}`)
    return response.data
  },

  // Enroll student in course
  async enrollStudent(courseId, studentId) {
    const response = await api.post(`/admin/courses/${courseId}/students`, { studentId })
    return response.data
  },

  // Remove student from course
  async removeStudent(courseId, studentId) {
    const response = await api.delete(`/admin/courses/${courseId}/students/${studentId}`)
    return response.data
  },

  // Get dashboard stats
  async getStats() {
    const response = await api.get('/admin/stats')
    return response.data.data
  }
}