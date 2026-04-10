// frontend/src/services/gradeService.js
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
  // Get my grades (student)
  async getMyGrades() {
    const response = await api.get('/student/grades')
    return response.data.data
  },

  // Get course grades (student)
  async getCourseGrades(courseId) {
    const id = extractId(courseId);
    if (!id) throw new Error('Invalid course ID');
    const response = await api.get(`/student/courses/${id}/grades`)
    return response.data.data
  },

  // Get grade summary (student)
  async getGradeSummary() {
    const response = await api.get('/student/grades/summary')
    return response.data.data
  }
}