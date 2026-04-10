// frontend/src/services/announcementService.js
import api from '@/plugins/axios'

export default {
  // Get all announcements (with filters)
  async getAnnouncements(params = {}) {
    const response = await api.get('/announcements', { params })
    return response.data
  },

  // Get unread count
  async getUnreadCount() {
    const response = await api.get('/announcements/unread-count')
    return response.data
  },

  // Create announcement
  async createAnnouncement(data) {
    const response = await api.post('/announcements', data)
    return response.data
  },

  // Update announcement
  async updateAnnouncement(id, data) {
    const response = await api.put(`/announcements/${id}`, data)
    return response.data
  },

  // Delete announcement
  async deleteAnnouncement(id) {
    const response = await api.delete(`/announcements/${id}`)
    return response.data
  },

  // Mark as read
  async markAsRead(id) {
    const response = await api.post(`/announcements/${id}/mark-read`)
    return response.data
  }
}