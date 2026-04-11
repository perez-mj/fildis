// frontend/src/stores/materialStore.js
import { defineStore } from 'pinia'
import materialService from '@/services/materialService'

export const useMaterialStore = defineStore('material', {
  state: () => ({
    materials: [],
    currentMaterial: null,
    loading: false,
    error: null
  }),

  getters: {
    getMaterialsByCourse: (state) => (courseId) => {
      return state.materials.filter(m => m.courseId === courseId || m.courseId?._id === courseId)
    },
    getMaterialsByType: (state) => (fileType) => {
      return state.materials.filter(m => m.fileType === fileType)
    }
  },

  actions: {
    async fetchCourseMaterials(courseId) {
      this.loading = true
      this.error = null
      try {
        const materials = await materialService.getCourseMaterials(courseId)
        this.materials = materials
        return materials
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch materials'
        console.error('Error fetching materials:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchMaterial(materialId) {
      this.loading = true
      this.error = null
      try {
        const material = await materialService.getMaterial(materialId)
        this.currentMaterial = material
        return material
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch material'
        throw error
      } finally {
        this.loading = false
      }
    },

    async trackDownload(materialId) {
      try {
        await materialService.trackDownload(materialId)
      } catch (error) {
        console.error('Failed to track download:', error)
      }
    },

    async trackView(materialId) {
      try {
        await materialService.trackView(materialId)
      } catch (error) {
        console.error('Failed to track view:', error)
      }
    },

    clearMaterials() {
      this.materials = []
      this.currentMaterial = null
      this.error = null
    }
  }
})