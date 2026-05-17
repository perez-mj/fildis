// frontend/src/services/teacherService.js
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
  // Dashboard stats
  async getTeacherStats() {
    const response = await api.get('/teacher/stats')
    return response.data.data
  },

  // Get teacher's courses
  async getMyCourses() {
    const response = await api.get('/teacher/courses')
    return response.data.data
  },

  // Get assignments for a specific course
  async getAssignments(courseId) {
    const id = extractId(courseId);
    if (!id) throw new Error('Invalid course ID');
    const response = await api.get(`/teacher/courses/${id}/assignments`)
    return response.data
  },

  // Upload material
  async uploadMaterial(courseId, formData) {
    const response = await api.post(`/teacher/courses/${courseId}/materials`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

  // Delete material
  async deleteMaterial(materialId) {
    const id = extractId(materialId);
    if (!id) throw new Error('Invalid material ID');
    const response = await api.delete(`/teacher/materials/${id}`)
    return response.data
  },

  async getAssignment(assignmentId) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.get(`/teacher/assignments/${id}`)
    return response.data.data
  },

  // Create assignment
  async createAssignment(courseId, formData) {
    const response = await api.post(`/teacher/courses/${courseId}/assignments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

// Update assignment
async updateAssignment(assignmentId, formData) {
    // If formData is FormData, send as multipart/form-data
    // Otherwise send as JSON
    const config = formData instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };
    
    return api.put(`/teacher/assignments/${assignmentId}`, formData, config);
},

  // Delete assignment
  async deleteAssignment(assignmentId) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.delete(`/teacher/assignments/${id}`)
    return response.data
  },

  // Get assignment submissions
  async getAssignmentSubmissions(assignmentId) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.get(`/teacher/assignments/${id}/submissions`)
    return response.data.data
  },

  // Grade submission
  async gradeSubmission(submissionId, score, feedback) {
    const id = extractId(submissionId);
    if (!id) throw new Error('Invalid submission ID');
    const response = await api.post(`/teacher/submissions/${id}/grade`, { score, feedback })
    return response.data.data
  },

  // Get grading summary
  async getGradingSummary(assignmentId) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.get(`/teacher/assignments/${id}/grading-summary`)
    return response.data.data
  },

  // Post announcement
  async postAnnouncement(courseId, data) {
    const response = await api.post(`/teacher/courses/${courseId}/announcements`, data)
    return response.data.data
  },

  // Get teacher announcements
  async getMyAnnouncements() {
    const response = await api.get('/teacher/announcements')
    return response.data.data
  },
}