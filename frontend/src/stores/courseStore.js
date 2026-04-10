// frontend/src/stores/courseStore.js
import { defineStore } from 'pinia'
import courseService from '@/services/courseService'

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [],
    currentCourse: null,
    loading: false,
    error: null,
    stats: {
      totalStudents: 0,
      totalTeachers: 0,
      totalCourses: 0,
      activeCourses: 0
    }
  }),

  getters: {
    getCourses: (state) => state.courses,
    getCurrentCourse: (state) => state.currentCourse,
    isLoading: (state) => state.loading,
    dashboardStats: (state) => state.stats
  },

  actions: {
    async fetchCourses() {
      this.loading = true
      try {
        const response = await courseService.getCourses({ limit: 100 })
        this.courses = response.data
        return response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch courses'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCourse(id) {
      this.loading = true
      try {
        const course = await courseService.getCourse(id)
        this.currentCourse = course
        return course
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch course'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCourse(courseData) {
      this.loading = true
      try {
        const course = await courseService.createCourse(courseData)
        this.courses.push(course)
        return course
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create course'
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateCourse(id, courseData) {
      this.loading = true
      try {
        const course = await courseService.updateCourse(id, courseData)
        const index = this.courses.findIndex(c => c._id === id)
        if (index !== -1) {
          this.courses[index] = course
        }
        if (this.currentCourse?._id === id) {
          this.currentCourse = course
        }
        return course
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update course'
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteCourse(id) {
      this.loading = true
      try {
        await courseService.deleteCourse(id)
        this.courses = this.courses.filter(c => c._id !== id)
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete course'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchStats() {
      try {
        const stats = await courseService.getStats()
        this.stats = stats
        return stats
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch stats'
        throw error
      }
    },

    async enrollStudent(courseId, studentId) {
      try {
        await courseService.enrollStudent(courseId, studentId)
        // Refresh course data
        if (this.currentCourse?._id === courseId) {
          await this.fetchCourse(courseId)
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to enroll student'
        throw error
      }
    },

    async removeStudent(courseId, studentId) {
      try {
        await courseService.removeStudent(courseId, studentId)
        if (this.currentCourse?._id === courseId) {
          await this.fetchCourse(courseId)
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to remove student'
        throw error
      }
    }
  }
})