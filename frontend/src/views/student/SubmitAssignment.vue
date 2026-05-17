<!-- frontend/src/views/student/SubmitAssignment.vue -->
<template>
  <v-container fluid class="submit-container">
    <v-row class="mb-6">
      <v-col cols="12">
        <v-btn variant="text" :to="{ name: 'MyAssignments' }" class="back-btn mb-3" prepend-icon="mdi-arrow-left"
          size="small">
          Back to Assignments
        </v-btn>
        <div class="assignment-header">
          <div>
            <h1 class="text-h4 font-weight-light mb-1">{{ assignment?.title }}</h1>
            <div class="header-accent"></div>
            <p class="text-subtitle-1 text-medium-emphasis mt-2">
              {{ assignment?.courseId?.courseCode }} • {{ assignment?.courseId?.courseName }}
            </p>
          </div>
          <v-chip :color="isOverdue ? 'error' : 'success'" variant="light" size="large" class="status-chip">
            <v-icon start :icon="isOverdue ? 'mdi-alert' : 'mdi-check-circle'"></v-icon>
            {{ isOverdue ? 'Overdue' : 'Active' }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Assignment Details -->
      <v-col cols="12" lg="5">
        <v-card class="details-card rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="text-h6 font-weight-light pa-4">
            Assignment Details
            <div class="card-accent"></div>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <!-- Description -->
            <div class="detail-section mb-4">
              <div class="detail-label">Description</div>
              <div class="detail-content">{{ assignment?.description || 'No description provided.' }}</div>
            </div>

            <!-- Instructions -->
            <div class="detail-section mb-4">
              <div class="detail-label">Instructions</div>
              <div class="detail-content instruction-text">
                {{ assignment?.instructions || 'No specific instructions provided.' }}
              </div>
            </div>

            <!-- Attachments -->
            <div class="detail-section mb-4" v-if="assignment?.attachments?.length">
              <div class="detail-label">Resources</div>
              <div class="attachments-list">
                <a v-for="(attachment, index) in assignment.attachments" :key="index" :href="attachment.webViewLink"
                  target="_blank" class="attachment-link">
                  <v-icon size="16" :color="getFileTypeColor(attachment.fileType)" class="mr-2">
                    {{ getFileIcon(attachment.fileType) }}
                  </v-icon>
                  <span class="text-caption">{{ attachment.originalFileName || attachment.fileName }}</span>
                  <v-icon size="14" class="ml-auto">mdi-open-in-new</v-icon>
                </a>
              </div>
            </div>

            <v-divider class="my-3"></v-divider>

            <!-- Assignment Metadata -->
            <div class="metadata-grid">
              <div class="metadata-item">
                <div class="metadata-label">Max Score</div>
                <div class="metadata-value">{{ assignment?.maxScore || 0 }} points</div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Due Date</div>
                <div class="metadata-value" :class="{ 'text-error': isOverdue }">
                  {{ formatDate(assignment?.dueDate) }}
                </div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Available Period</div>
                <div class="metadata-value">
                  {{ formatDate(assignment?.availableFrom) }} — {{ formatDate(assignment?.availableUntil) }}
                </div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">File Types</div>
                <div class="d-flex flex-wrap gap-1 mt-1">
                  <v-chip v-for="type in assignment?.allowedFileTypes" :key="type" size="x-small" variant="outlined">
                    .{{ type }}
                  </v-chip>
                </div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Max File Size</div>
                <div class="metadata-value">{{ formatFileSize(assignment?.maxFileSize) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Existing Submission -->
        <v-card v-if="existingSubmission" class="submission-card rounded-xl mt-4" elevation="0" variant="outlined">
          <v-card-title class="text-h6 font-weight-light pa-4">
            Your Submission
            <div class="card-accent"></div>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <div class="submission-status mb-3">
              <div class="detail-label">Status</div>
              <v-chip :color="getSubmissionStatusColor(existingSubmission.status)" size="small" variant="light">
                {{ existingSubmission.status?.toUpperCase() || 'SUBMITTED' }}
              </v-chip>
            </div>

            <div class="submission-date mb-3">
              <div class="detail-label">Submitted On</div>
              <div class="detail-content">{{ formatDate(existingSubmission.submissionDate) }}</div>
            </div>

            <div class="submission-files mb-3" v-if="existingSubmission.submittedFiles?.length">
              <div class="detail-label mb-2">Submitted Files</div>
              <div class="files-list">
                <a v-for="(file, idx) in existingSubmission.submittedFiles" :key="idx" :href="file.webViewLink"
                  target="_blank" class="file-link">
                  <v-icon size="16" class="mr-2">mdi-file-outline</v-icon>
                  <span class="text-caption">{{ file.originalFileName || file.fileName }}</span>
                  <v-chip size="x-small" variant="light" class="ml-auto">
                    {{ formatFileSize(file.fileSize) }}
                  </v-chip>
                </a>
              </div>
            </div>

            <div class="submission-comments mb-3" v-if="existingSubmission.comments">
              <div class="detail-label">Your Comments</div>
              <div class="comments-box">{{ existingSubmission.comments }}</div>
            </div>

            <!-- Grade Display -->
            <div v-if="existingSubmission.grade" class="grade-section mt-3">
              <v-divider class="mb-3"></v-divider>
              <div class="detail-label">Grade Received</div>
              <div class="grade-display mt-2">
                <div class="grade-score-large">
                  <span class="grade-score-value">{{ existingSubmission.grade.score }}</span>
                  <span class="grade-score-max">/{{ assignment?.maxScore }}</span>
                </div>
                <v-chip :color="getGradeColor(existingSubmission.grade.score)" size="large" variant="light">
                  {{ getPercentage(existingSubmission.grade.score, assignment?.maxScore) }}%
                </v-chip>
              </div>
              <div v-if="existingSubmission.grade.feedback" class="feedback-box mt-3">
                <div class="detail-label mb-1">Teacher's Feedback</div>
                <div class="feedback-content">{{ existingSubmission.grade.feedback }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Submission Form -->
      <v-col cols="12" lg="7">
        <v-card class="form-card rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="text-h6 font-weight-light pa-4">
            {{ submissionTitle }}
            <div class="card-accent"></div>
          </v-card-title>
          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <v-alert v-if="existingSubmission?.grade" type="success" variant="tonal" class="mb-4 rounded-lg"
              icon="mdi-check-circle">
              This assignment has been graded. Your submission is final.
            </v-alert>

            <v-alert v-else-if="!canSubmit" type="warning" variant="tonal" class="mb-4 rounded-lg" icon="mdi-alert">
              This assignment is not currently available for submission.
              <div class="text-caption mt-1">
                Available from {{ formatDate(assignment?.availableFrom) }} to {{ formatDate(assignment?.availableUntil)
                }}
              </div>
            </v-alert>

            <v-form ref="form" v-model="valid" v-else>
              <v-file-input v-model="files" :label="existingSubmission ? 'Add Additional Files' : 'Upload Files'"
                multiple :accept="getAcceptString" :rules="fileRules" prepend-icon="mdi-cloud-upload" variant="outlined"
                show-size counter class="file-input" :disabled="!canSubmit">
                <template v-slot:selection="{ fileNames }">
                  <template v-for="fileName in fileNames" :key="fileName">
                    <v-chip size="small" class="mr-2">
                      {{ fileName }}
                    </v-chip>
                  </template>
                </template>
              </v-file-input>

              <v-textarea v-model="comments" label="Comments (Optional)"
                placeholder="Add any comments or notes for your instructor..." variant="outlined" rows="4"
                :disabled="!canSubmit" class="mt-4"></v-textarea>

              <div class="d-flex gap-3 mt-4">
                <v-btn variant="outlined" :to="{ name: 'MyAssignments' }" class="flex-grow-1">
                  Cancel
                </v-btn>
                <v-btn color="primary" variant="flat" :loading="submitting" :disabled="!valid || !canSubmit"
                  class="flex-grow-1" height="48" @click="submitAssignment">
                  <v-icon start :icon="existingSubmission ? 'mdi-update' : 'mdi-send'"></v-icon>
                  {{ existingSubmission ? 'Update Submission' : 'Submit Assignment' }}
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAssignmentStore } from '@/stores/assignmentStore'
import { format } from 'date-fns'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()
const snackbar = inject('snackbar')

const assignmentId = route.params.assignmentId
const assignment = ref(null)
const existingSubmission = ref(null)
const files = ref([])
const comments = ref('')
const valid = ref(false)
const submitting = ref(false)
const form = ref(null)

const submissionTitle = computed(() => {
  if (existingSubmission.value?.grade) return 'Assignment Completed'
  if (existingSubmission.value) return 'Update Submission'
  return 'Submit Assignment'
})

const isOverdue = computed(() => {
  if (!assignment.value?.dueDate) return false
  return new Date(assignment.value.dueDate) < new Date()
})

const canSubmit = computed(() => {
  if (!assignment.value) return false
  if (existingSubmission.value?.grade) return false
  const now = new Date()
  const availableFrom = new Date(assignment.value.availableFrom || assignment.value.createdAt)
  const availableUntil = assignment.value.availableUntil ? new Date(assignment.value.availableUntil) : new Date(assignment.value.dueDate)
  return now >= availableFrom && now <= availableUntil
})

const getAcceptString = computed(() => {
  if (!assignment.value?.allowedFileTypes) return '*'
  return assignment.value.allowedFileTypes.map(type => `.${type}`).join(',')
})

const fileRules = [
  (v) => !v || v.length <= 5 || 'Maximum 5 files allowed',
  (v) => {
    if (!v || !assignment.value?.allowedFileTypes) return true
    for (const file of v) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!assignment.value.allowedFileTypes.includes(ext)) {
        return `File type .${ext} is not allowed`
      }
    }
    return true
  },
  (v) => {
    if (!v || !assignment.value?.maxFileSize) return true
    for (const file of v) {
      if (file.size > assignment.value.maxFileSize) {
        return `File ${file.name} exceeds maximum size of ${formatFileSize(assignment.value.maxFileSize)}`
      }
    }
    return true
  }
]

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (fileType) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    ppt: 'mdi-file-powerpoint-box',
    pptx: 'mdi-file-powerpoint-box',
    default: 'mdi-file-outline'
  }
  return icons[fileType?.toLowerCase()] || icons.default
}

const getFileTypeColor = (fileType) => {
  const colors = {
    pdf: '#ef4444',
    doc: '#3b82f6',
    docx: '#3b82f6',
    ppt: '#f59e0b',
    pptx: '#f59e0b',
    default: '#64748b'
  }
  return colors[fileType?.toLowerCase()] || colors.default
}

const getSubmissionStatusColor = (status) => {
  const colors = {
    submitted: 'info',
    late: 'warning',
    graded: 'success'
  }
  return colors[status?.toLowerCase()] || 'grey'
}

const getGradeColor = (score) => {
  if (!score) return 'grey'
  if (score >= 90) return 'success'
  if (score >= 75) return 'info'
  if (score >= 60) return 'warning'
  return 'error'
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1) + '%'
}

const loadAssignment = async () => {
  try {
    assignment.value = await assignmentStore.getAssignment(assignmentId)
    const submission = await assignmentStore.getMySubmission(assignmentId)
    existingSubmission.value = submission
    
    if (existingSubmission.value) {
      comments.value = existingSubmission.value.comments || ''
    }
  } catch (error) {
    console.error('Failed to load assignment:', error)
    if (snackbar) snackbar.value = { show: true, text: 'Failed to load assignment', color: 'error' }
  }
}

const submitAssignment = async () => {
  console.log('Submit button clicked')
  
  if (!form.value?.validate()) {
    console.log('Form validation failed')
    return
  }
  
  if (files.value.length === 0 && !existingSubmission.value) {
    if (snackbar) snackbar.value = { show: true, text: 'Please upload at least one file', color: 'warning' }
    return
  }
  
  submitting.value = true
  try {
    const formData = new FormData()
    files.value.forEach(file => {
      formData.append('files', file)
    })
    formData.append('comments', comments.value)
    
    await assignmentStore.submitAssignment(assignmentId, formData)
    
    if (snackbar) snackbar.value = { show: true, text: 'Assignment submitted successfully!', color: 'success' }
    
    setTimeout(() => {
      router.push({ name: 'MyAssignments' })
    }, 1500)
  } catch (error) {
    console.error('Failed to submit assignment:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to submit assignment'
    if (snackbar) snackbar.value = { show: true, text: errorMessage, color: 'error' }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadAssignment()
})
</script>

<style scoped>
.submit-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.back-btn {
  margin-left: -8px;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.header-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

.status-chip {
  border-radius: 30px !important;
}

/* Cards */
.details-card,
.submission-card,
.form-card {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.card-accent {
  width: 40px;
  height: 2px;
  background: rgb(var(--v-theme-primary));
  border-radius: 2px;
  margin-top: 8px;
}

/* Detail Sections */
.detail-section {
  width: 100%;
}

.detail-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 8px;
}

.detail-content {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #1e293b;
}

.instruction-text {
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
}

/* Attachments */
.attachments-list,
.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-link,
.file-link {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
  text-decoration: none;
  color: #1e293b;
  transition: all 0.2s ease;
}

.attachment-link:hover,
.file-link:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

/* Metadata Grid */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metadata-item {
  padding: 8px;
  background: #f8fafc;
  border-radius: 10px;
}

.metadata-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 0.9rem;
  font-weight: 500;
}

/* Comments Box */
.comments-box {
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Grade Display */
.grade-display {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.grade-score-large {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.grade-score-value {
  font-size: 2rem;
  font-weight: 600;
  color: #1e293b;
}

.grade-score-max {
  font-size: 1rem;
  color: #64748b;
}

.feedback-box {
  padding: 12px;
  background: #eff6ff;
  border-radius: 12px;
}

.feedback-content {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #1e40af;
}

/* File Input */
.file-input :deep(.v-field) {
  border-radius: 12px !important;
}

/* Gap Utility */
.gap-1 {
  gap: 4px;
}

.gap-3 {
  gap: 12px;
}

/* Responsive */
@media (max-width: 600px) {
  .assignment-header {
    flex-direction: column;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .grade-score-value {
    font-size: 1.5rem;
  }
}
</style>