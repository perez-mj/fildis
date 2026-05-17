// frontend/src/stores/teacherStore.js
import { defineStore } from 'pinia'
import teacherService from '@/services/teacherService'

export const useTeacherStore = defineStore('teacher', {
  state: () => ({
    stats: null,
    courses: [],
    currentCourse: null,
    materials: [],
    assignments: [],
    submissions: [],
    announcements: [],
    loading: false,
    error: null
  }),

  getters: {
    pendingSubmissionsCount: (state) => {
      return state.submissions.filter(s => s.status === 'submitted' || s.status === 'late').length
    },
    totalStudentsCount: (state) => {
      return state.courses.reduce((total, course) => total + (course.students?.length || 0), 0)
    }
  },

  actions: {
    async fetchStats() {
      this.loading = true
      try {
        const stats = await teacherService.getTeacherStats()
        this.stats = stats
        return stats
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch stats'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMyCourses() {
      this.loading = true
      try {
        const courses = await teacherService.getMyCourses()
        this.courses = courses
        return courses
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch courses'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAssignmentsForCourse(courseId) {
      this.loading = true
      try {
        const response = await teacherService.getAssignments(courseId)
        const assignments = response.data || []
        // Store in assignments array
        this.assignments = assignments
        return assignments
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch assignments'
        throw error
      } finally {
        this.loading = false
      }
    },

    async uploadMaterial(courseId, formData) {
      this.loading = true
      try {
        const material = await teacherService.uploadMaterial(courseId, formData)
        if (this.currentCourse?._id === courseId) {
          this.materials.unshift(material)
        }
        return material
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to upload material'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteMaterial(materialId) {
      this.loading = true
      try {
        await teacherService.deleteMaterial(materialId)
        this.materials = this.materials.filter(m => m._id !== materialId)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete material'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createAssignment(courseId, formData) {
      this.loading = true
      try {
        const assignment = await teacherService.createAssignment(courseId, formData)
        this.assignments.unshift(assignment)
        return assignment
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create assignment'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateAssignment(assignmentId, data) {
      this.loading = true
      try {
        const updatedAssignment = await teacherService.updateAssignment(assignmentId, data)
        const index = this.assignments.findIndex(a => a._id === assignmentId)
        if (index !== -1) {
          this.assignments[index] = updatedAssignment
        }
        return updatedAssignment
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update assignment'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchAssignmentSubmissions(assignmentId) {
      this.loading = true
      try {
        const submissions = await teacherService.getAssignmentSubmissions(assignmentId)
        this.submissions = submissions
        return submissions
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch submissions'
        throw error
      } finally {
        this.loading = false
      }
    },
    
    async deleteAssignment(assignmentId) {
      this.loading = true
      try {
        await teacherService.deleteAssignment(assignmentId)
        this.assignments = this.assignments.filter(a => a._id !== assignmentId)
        return true
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete assignment'
        throw error
      } finally {
        this.loading = false
      }
    },

    async gradeSubmission(submissionId, score, feedback) {
      this.loading = true
      try {
        const graded = await teacherService.gradeSubmission(submissionId, score, feedback)
        const index = this.submissions.findIndex(s => s._id === submissionId)
        if (index !== -1) {
          this.submissions[index] = graded
        }
        return graded
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to grade submission'
        throw error
      } finally {
        this.loading = false
      }
    },

    async postAnnouncement(courseId, data) {
      this.loading = true
      try {
        const announcement = await teacherService.postAnnouncement(courseId, data)
        this.announcements.unshift(announcement)
        return announcement
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to post announcement'
        throw error
      } finally {
        this.loading = false
      }
    },

    setCurrentCourse(course) {
      this.currentCourse = course
      this.materials = course?.materials || []
      this.assignments = course?.assignments || []
    },

    clearError() {
      this.error = null
    }
  }
})