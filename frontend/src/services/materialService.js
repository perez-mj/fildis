// frontend/src/services/materialService.js
import api from '@/plugins/axios'

// Helper function to extract ID from object or string
const extractId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object') {
        return id._id || id.id || null;
    }
    return null;
};

export default {
  // Get materials for a course (student view)
  async getCourseMaterials(courseId) {
    const id = extractId(courseId);
    if (!id) throw new Error('Invalid course ID');
    const response = await api.get(`/student/courses/${id}/materials`)
    return response.data.data
  },

  // Get material by ID (student view)
  async getMaterial(materialId) {
    const id = extractId(materialId);
    if (!id) throw new Error('Invalid material ID');
    const response = await api.get(`/student/materials/${id}`)
    return response.data.data
  },

  // Track material download (student)
  async trackDownload(materialId) {
    const id = extractId(materialId);
    if (!id) throw new Error('Invalid material ID');
    const response = await api.post(`/student/materials/${id}/download`)
    return response.data
  },

  // Track material view (student)
  async trackView(materialId) {
    const id = extractId(materialId);
    if (!id) throw new Error('Invalid material ID');
    const response = await api.post(`/student/materials/${id}/view`)
    return response.data
  }
}