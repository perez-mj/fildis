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
      try {
        this.teachers = await userService.getTeachers()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async fetchStudents() {
      this.loading = true
      try {
        this.students = await userService.getStudents()
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createUser(userData) {
      try {
        const newUser = await userService.createUser(userData)
        if (userData.role === 'teacher') {
          this.teachers.push(newUser)
        } else if (userData.role === 'student') {
          this.students.push(newUser)
        }
        return newUser
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async updateUser(id, userData) {
      try {
        const updatedUser = await userService.updateUser(id, userData)
        const array = userData.role === 'teacher' ? this.teachers : this.students
        const index = array.findIndex(u => u.id === id)
        if (index !== -1) {
          array[index] = updatedUser
        }
        return updatedUser
      } catch (error) {
        this.error = error.message
        throw error
      }
    },

    async deleteUser(id, role) {
      try {
        await userService.deleteUser(id)
        const array = role === 'teacher' ? this.teachers : this.students
        this[role === 'teacher' ? 'teachers' : 'students'] = array.filter(u => u.id !== id)
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  },

  getters: {
    getTeachers: (state) => state.teachers,
    getStudents: (state) => state.students,
    isLoading: (state) => state.loading
  }
})