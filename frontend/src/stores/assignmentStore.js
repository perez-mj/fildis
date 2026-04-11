
// frontend/src/stores/assignmentStore.js
import { defineStore } from 'pinia'
import assignmentService from '@/services/assignmentService'

export const useAssignmentStore = defineStore('assignment', {
  state: () => ({
    assignments: [],
    submissions: [],
    currentAssignment: null,
    loading: false,
    error: null
  }),

  getters: {
    pendingAssignments: (state) => {
      return state.assignments.filter(a => !a.submission && new Date(a.dueDate) > new Date())
    },
    getSubmissionsByAssignment: (state) => (assignmentId) => {
      return state.submissions.filter(s => s.assignmentId === assignmentId)
    }
  },

  actions: {
    async fetchAssignments(courseId = null) {
      this.loading = true
      try {
        if (courseId) {
          this.assignments = await assignmentService.getStudentCourseAssignments(courseId)
        } else {
          // Fetch assignments from all courses
          // This would need to be implemented based on your needs
          this.assignments = []
        }
      } catch (error) {
        this.error = error.message
        console.error('Failed to fetch assignments:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchSubmissions(assignmentId) {
      this.loading = true
      try {
        this.submissions = await assignmentService.getSubmissions(assignmentId)
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async getAssignment(assignmentId) {
      this.loading = true
      try {
        const assignment = await assignmentService.getAssignment(assignmentId)
        this.currentAssignment = assignment
        return assignment
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch assignment'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getMySubmissions() {
      this.loading = true
      try {
        const submissions = await assignmentService.getMySubmissions()
        this.submissions = submissions
        return submissions
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch submissions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async getMySubmission(assignmentId) {
      try {
        const submission = await assignmentService.getMySubmission(assignmentId)
        return submission
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch submission'
        throw error
      }
    },

    async createAssignment(assignmentData) {
      try {
        const newAssignment = await assignmentService.createAssignment(assignmentData)
        this.assignments.push(newAssignment)
        return newAssignment
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async submitAssignment(assignmentId, submissionData) {
      try {
        const submission = await assignmentService.submitAssignment(assignmentId, submissionData)
        return submission
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async gradeSubmission(submissionId, gradeData) {
      try {
        const graded = await assignmentService.gradeSubmission(submissionId, gradeData)
        const index = this.submissions.findIndex(s => s.id === submissionId)
        if (index !== -1) {
          this.submissions[index] = graded
        }
        return graded
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    clearAssignments() {
      this.assignments = []
      this.submissions = []
      this.currentAssignment = null
      this.error = null
    }
  }
})