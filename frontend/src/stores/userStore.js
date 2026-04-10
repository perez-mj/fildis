// frontend/src/stores/userStore.js
import { defineStore } from 'pinia'
import userService from '@/services/userService'

export const useUserStore = defineStore('user', {
  state: () => ({
    teachers: [],
    students: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchTeachers() {
      this.loading = true
      this.error = null
      try {
        this.teachers = await userService.getTeachers()
        return this.teachers
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchStudents() {
      this.loading = true
      this.error = null
      try {
        this.students = await userService.getStudents()
        return this.students
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      this.loading = true
      this.error = null
      try {
        const newUser = await userService.createUser(userData)
        if (userData.role === 'teacher') {
          this.teachers.push(newUser)
        } else if (userData.role === 'student') {
          this.students.push(newUser)
        }
        return newUser
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateUser(id, userData) {
      this.loading = true
      this.error = null
      try {
        const updatedUser = await userService.updateUser(id, userData)
        
        // Find and update in the appropriate array
        if (updatedUser.role === 'teacher') {
          const index = this.teachers.findIndex(u => u._id === id)
          if (index !== -1) {
            this.teachers[index] = updatedUser
          }
        } else if (updatedUser.role === 'student') {
          const index = this.students.findIndex(u => u._id === id)
          if (index !== -1) {
            this.students[index] = updatedUser
          }
        }
        return updatedUser
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteUser(id, role) {
      this.loading = true
      this.error = null
      try {
        await userService.deleteUser(id)
        
        if (role === 'teacher') {
          this.teachers = this.teachers.filter(u => u._id !== id)
        } else if (role === 'student') {
          this.students = this.students.filter(u => u._id !== id)
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message
        throw error
      } finally {
        this.loading = false
      }
    }
  },

  getters: {
    getTeachers: (state) => state.teachers,
    getStudents: (state) => state.students,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  }
})