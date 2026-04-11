// frontend/src/stores/studentStore.js
import { defineStore } from 'pinia'
import api from '@/plugins/axios'

export const useStudentStore = defineStore('student', {
  state: () => ({
    enrolledCourses: [],
    dashboardStats: {
      enrolledCourses: 0,
      pendingAssignments: 0,
      upcomingDeadlines: [],
      recentGrades: []
    },
    loading: false,
    error: null
  }),

  getters: {
    getEnrolledCourses: (state) => state.enrolledCourses,
    getUpcomingDeadlines: (state) => state.dashboardStats.upcomingDeadlines,
    getRecentGrades: (state) => state.dashboardStats.recentGrades,
    hasPendingAssignments: (state) => state.dashboardStats.pendingAssignments > 0
  },

  actions: {
    async fetchEnrolledCourses() {
      this.loading = true
      this.error = null
      try {
        const response = await api.get('/student/courses')
        this.enrolledCourses = response.data.data
        return this.enrolledCourses
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch enrolled courses'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCourseDetails(courseId) {
      this.loading = true
      this.error = null
      try {
        const response = await api.get(`/student/courses/${courseId}`)
        return response.data.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch course details'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchDashboardStats() {
      try {
        const response = await api.get('/student/stats')
        this.dashboardStats = response.data.data
        return this.dashboardStats
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch dashboard stats'
        throw error
      }
    },

    clearStudentData() {
      this.enrolledCourses = []
      this.dashboardStats = {
        enrolledCourses: 0,
        pendingAssignments: 0,
        upcomingDeadlines: [],
        recentGrades: []
      }
      this.error = null
    }
  }
})