// frontend/src/services/aiService.js
import api from '@/plugins/axios'

export default {
  // Get AI summary for a material
  async getMaterialSummary(materialId) {
    const response = await api.get(`/ai/materials/${materialId}/summary`)
    return response.data.data
  },

  // Regenerate summary (teacher only)
  async regenerateSummary(materialId) {
    const response = await api.post(`/ai/materials/${materialId}/regenerate-summary`)
    return response.data.data
  },

  // Get AI reviewer/questions
  async getMaterialReviewer(materialId, numQuestions = 10, difficulty = 'medium') {
    const response = await api.get(`/ai/materials/${materialId}/reviewer`, {
      params: { numQuestions, difficulty }
    })
    return response.data.data
  },

  // Regenerate reviewer (teacher only)
  async regenerateReviewer(materialId, numQuestions = 10, difficulty = 'medium') {
    const response = await api.post(`/ai/materials/${materialId}/regenerate-reviewer`, {
      numQuestions,
      difficulty
    })
    return response.data.data
  }
}