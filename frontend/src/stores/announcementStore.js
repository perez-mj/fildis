// frontend/src/services/announcementService.js
import { defineStore } from 'pinia'
import announcementService from '@/services/announcementService'

export const useAnnouncementStore = defineStore('announcement', {
  state: () => ({
    announcements: [],
    loading: false,
    error: null,
    unreadCount: 0
  }),

  getters: {
    getAllAnnouncements: (state) => state.announcements,
    getPinnedAnnouncements: (state) => state.announcements.filter(a => a.isPinned && a.isActive),
    getNormalAnnouncements: (state) => state.announcements.filter(a => !a.isPinned && a.isActive),
    getHighPriorityAnnouncements: (state) => state.announcements.filter(a => a.priority === 'urgent' || a.priority === 'high'),
    getAnnouncementsByTarget: (state) => (target) => state.announcements.filter(a => a.targetAudience === target)
  },

  actions: {
    async fetchAnnouncements(params = {}) {
      this.loading = true
      this.error = null
      try {
        const response = await announcementService.getAnnouncements(params)
        this.announcements = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch announcements'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchUnreadCount() {
      try {
        const response = await announcementService.getUnreadCount()
        this.unreadCount = response.data.unreadCount
        return response.data.unreadCount
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
        return 0
      }
    },

    async createAnnouncement(data) {
      this.loading = true
      this.error = null
      try {
        const response = await announcementService.createAnnouncement(data)
        this.announcements.unshift(response.data)
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAnnouncement(id, data) {
      this.loading = true
      this.error = null
      try {
        const response = await announcementService.updateAnnouncement(id, data)
        const index = this.announcements.findIndex(a => a._id === id)
        if (index !== -1) {
          this.announcements[index] = response.data
        }
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteAnnouncement(id) {
      this.loading = true
      this.error = null
      try {
        await announcementService.deleteAnnouncement(id)
        this.announcements = this.announcements.filter(a => a._id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    async markAsRead(id) {
      try {
        await announcementService.markAsRead(id)
        const announcement = this.announcements.find(a => a._id === id)
        if (announcement) {
          const alreadyRead = announcement.readBy?.some(r => r.user === this.currentUserId)
          if (!alreadyRead) {
            announcement.views += 1
            if (!announcement.readBy) announcement.readBy = []
            announcement.readBy.push({ user: this.currentUserId })
          }
        }
        await this.fetchUnreadCount()
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    }
  }
})