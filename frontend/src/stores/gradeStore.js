// frontend/src/stores/gradeStore.js
import { defineStore } from 'pinia'
import gradeService from '@/services/gradeService'

export const useGradeStore = defineStore('grade', {
  state: () => ({
    grades: [],
    courseGrades: {},
    summary: {
      totalGraded: 0,
      averageGrade: 0,
      totalScore: 0,
      totalMaxScore: 0,
      overallPercentage: 0
    },
    loading: false,
    error: null
  }),

  getters: {
    getGradesByCourse: (state) => (courseId) => {
      return state.courseGrades[courseId] || []
    },
    getPassingGrades: (state) => {
      return state.grades.filter(g => g.grade?.score >= (g.assignmentId?.passingScore || 50))
    },
    getFailingGrades: (state) => {
      return state.grades.filter(g => g.grade?.score < (g.assignmentId?.passingScore || 50))
    },
    overallAverage: (state) => {
      if (state.grades.length === 0) return 0
      const total = state.grades.reduce((sum, g) => sum + (g.grade?.score || 0), 0)
      return (total / state.grades.length).toFixed(2)
    }
  },

  actions: {
    async fetchMyGrades() {
      this.loading = true
      this.error = null
      try {
        const response = await gradeService.getMyGrades()
        // Handle different response structures
        if (response && response.submissions) {
          this.grades = response.submissions
          this.summary = response.statistics || this.summary
        } else if (response && response.data) {
          this.grades = response.data.submissions || response.data
          this.summary = response.data.statistics || this.summary
        } else if (Array.isArray(response)) {
          this.grades = response
        } else {
          this.grades = response || []
        }
        return { submissions: this.grades, statistics: this.summary }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch grades'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCourseGrades(courseId) {
      this.loading = true
      this.error = null
      try {
        const grades = await gradeService.getCourseGrades(courseId)
        this.courseGrades[courseId] = grades
        return grades
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch course grades'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchGradeSummary() {
      try {
        const summary = await gradeService.getGradeSummary()
        this.summary = summary
        return summary
      } catch (error) {
        console.error('Failed to fetch grade summary:', error)
        return this.summary
      }
    },

    clearGrades() {
      this.grades = []
      this.courseGrades = {}
      this.summary = {
        totalGraded: 0,
        averageGrade: 0,
        totalScore: 0,
        totalMaxScore: 0,
        overallPercentage: 0
      }
      this.error = null
    }
  }
})