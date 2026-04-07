
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

  actions: {
    async fetchAssignments(courseId = null) {
      this.loading = true
      try {
        this.assignments = await assignmentService.getAssignments(courseId)
      } catch (error) {
        this.error = error.message
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
    }
  },

  getters: {
    pendingAssignments: (state) => {
      return state.assignments.filter(a => a.status === 'pending')
    },
    getSubmissionsByAssignment: (state) => (assignmentId) => {
      return state.submissions.filter(s => s.assignmentId === assignmentId)
    }
  }
})