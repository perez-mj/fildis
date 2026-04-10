// frontend/src/services/assignmentService.js
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
  // Get all assignments for a course
  async getCourseAssignments(courseId) {
    const id = extractId(courseId);
    if (!id) throw new Error('Invalid course ID');
    const response = await api.get(`/courses/${id}/assignments`)
    return response.data.data
  },

  // Get assignment by ID
  async getAssignment(id) {
    const assignmentId = extractId(id);
    if (!assignmentId) throw new Error('Invalid assignment ID');
    const response = await api.get(`/assignments/${assignmentId}`)
    return response.data.data
  },

  // Submit assignment (student)
  async submitAssignment(assignmentId, formData) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.post(`/student/assignments/${id}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data.data
  },

  // Get my submissions (student)
  async getMySubmissions() {
    const response = await api.get('/student/submissions')
    return response.data.data
  },

  // Get submission by assignment (student)
  async getMySubmission(assignmentId) {
    const id = extractId(assignmentId);
    if (!id) throw new Error('Invalid assignment ID');
    const response = await api.get(`/student/assignments/${id}/my-submission`)
    return response.data.data
  }
}