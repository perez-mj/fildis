<!-- frontend/src/views/student/SubmitAssignment.vue -->
<template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div>
          <v-btn
            variant="text"
            :to="{ name: 'MyAssignments' }"
            class="mb-2"
            prepend-icon="mdi-arrow-left"
          >
            Back to Assignments
          </v-btn>
          <h1 class="text-h4 font-weight-bold mb-1">{{ assignment?.title }}</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            {{ assignment?.courseId?.courseCode }} - {{ assignment?.courseId?.courseName }}
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <!-- Assignment Details -->
      <v-col cols="12" lg="5">
        <v-card class="rounded-lg mb-4" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">Assignment Details</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-2 font-weight-medium mb-1">Description</div>
              <div class="text-body-2">{{ assignment?.description }}</div>
            </div>

            <div class="mb-4">
              <div class="text-subtitle-2 font-weight-medium mb-1">Instructions</div>
              <div class="text-body-2">{{ assignment?.instructions || 'No specific instructions provided.' }}</div>
            </div>

            <!-- Teacher's Attachments -->
            <div class="mb-4" v-if="assignment?.attachments && assignment.attachments.length > 0">
              <div class="text-subtitle-2 font-weight-medium mb-2">Assignment Attachments</div>
              <v-list density="compact" class="bg-grey-lighten-1 rounded">
                <v-list-item
                  v-for="(attachment, index) in assignment.attachments"
                  :key="index"
                  :href="attachment.webViewLink"
                  target="_blank"
                  class="attachment-item"
                >
                  <template v-slot:prepend>
                    <v-icon :color="getFileTypeColor(attachment.fileType)" size="24">
                      {{ getFileIcon(attachment.fileType) }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="text-caption">
                    {{ attachment.originalFileName || attachment.fileName }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-btn
                      :href="attachment.webContentLink"
                      target="_blank"
                      variant="text"
                      size="small"
                      icon="mdi-download"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <v-divider class="my-3"></v-divider>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Max Score</div>
              <div class="text-body-2">{{ assignment?.maxScore }} points</div>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Due Date</div>
              <div class="text-body-2" :class="{ 'text-error': isOverdue }">
                {{ formatDate(assignment?.dueDate) }}
                <v-chip v-if="isOverdue" size="x-small" color="error" class="ml-2">Overdue</v-chip>
              </div>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Available Period</div>
              <div class="text-body-2">
                {{ formatDate(assignment?.availableFrom) }} - {{ formatDate(assignment?.availableUntil) }}
              </div>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Allowed File Types</div>
              <div class="d-flex flex-wrap gap-1 mt-1">
                <v-chip v-for="type in assignment?.allowedFileTypes" :key="type" size="x-small">
                  .{{ type }}
                </v-chip>
              </div>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Max File Size</div>
              <div class="text-body-2">{{ formatFileSize(assignment?.maxFileSize) }}</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Existing Submission -->
        <v-card v-if="existingSubmission" class="rounded-lg" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">Your Submission</v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Status</div>
              <v-chip :color="getSubmissionStatusColor(existingSubmission.status)" size="small">
                {{ existingSubmission.status?.toUpperCase() || 'SUBMITTED' }}
              </v-chip>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Submitted On</div>
              <div class="text-body-2">{{ formatDate(existingSubmission.submissionDate) }}</div>
            </div>

            <div class="mb-2" v-if="existingSubmission.submittedFiles?.length">
              <div class="text-subtitle-2 font-weight-medium">Submitted Files</div>
              <v-list density="compact" class="bg-grey-lighten-1 rounded mt-1">
                <v-list-item
                  v-for="(file, idx) in existingSubmission.submittedFiles"
                  :key="idx"
                  :href="file.webViewLink"
                  target="_blank"
                >
                  <template v-slot:prepend>
                    <v-icon size="20">mdi-file</v-icon>
                  </template>
                  <v-list-item-title class="text-caption">
                    {{ file.originalFileName || file.fileName }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <v-chip size="x-small" color="info">
                      {{ formatFileSize(file.fileSize) }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </div>

            <div v-if="existingSubmission.comments" class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Your Comments</div>
              <div class="text-body-2 pa-2 bg-grey-lighten-5 rounded-lg">
                {{ existingSubmission.comments }}
              </div>
            </div>

            <!-- Show Grade if available -->
            <div v-if="existingSubmission.grade" class="mt-3">
              <v-divider class="mb-2"></v-divider>
              <div class="text-subtitle-2 font-weight-medium">Grade Received</div>
              <div class="d-flex align-center mt-1">
                <v-chip :color="getGradeColor(existingSubmission.grade.score)" size="large">
                  {{ existingSubmission.grade.score }}/{{ assignment?.maxScore }}
                  ({{ getPercentage(existingSubmission.grade.score, assignment?.maxScore) }}%)
                </v-chip>
              </div>
              <div v-if="existingSubmission.grade.feedback" class="mt-2">
                <div class="text-subtitle-2 font-weight-medium">Feedback</div>
                <div class="text-body-2 pa-2 bg-grey-lighten-5 rounded-lg">
                  {{ existingSubmission.grade.feedback }}
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Submission Form -->
      <v-col cols="12" lg="7">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            {{ existingSubmission && existingSubmission.grade ? 'Assignment Already Graded' : (existingSubmission ? 'Update Submission' : 'Submit Assignment') }}
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-alert
              v-if="existingSubmission && existingSubmission.grade"
              type="success"
              variant="tonal"
              class="mb-4"
            >
              This assignment has been graded. You cannot make changes to your submission.
            </v-alert>

            <v-alert
              v-else-if="!canSubmit"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              This assignment is not available for submission. The submission period is
              {{ formatDate(assignment?.availableFrom) }} to {{ formatDate(assignment?.availableUntil) }}.
            </v-alert>

            <v-form ref="form" v-model="valid" v-else>
              <v-file-input
                v-model="files"
                :label="existingSubmission ? 'Add More Files' : 'Upload Files'"
                multiple
                :accept="getAcceptString"
                :rules="fileRules"
                prepend-icon="mdi-paperclip"
                variant="outlined"
                show-size
                counter
                :disabled="!canSubmit || (existingSubmission && existingSubmission.grade)"
              >
                <template v-slot:selection="{ fileNames }">
                  <template v-for="fileName in fileNames" :key="fileName">
                    <v-chip size="small" class="mr-2">
                      {{ fileName }}
                    </v-chip>
                  </template>
                </template>
              </v-file-input>

              <v-textarea
                v-model="comments"
                label="Comments (Optional)"
                placeholder="Add any comments for the teacher..."
                variant="outlined"
                rows="4"
                :disabled="!canSubmit || (existingSubmission && existingSubmission.grade)"
              ></v-textarea>

              <div class="d-flex justify-space-between mt-4">
                <v-btn
                  color="grey"
                  variant="text"
                  :to="{ name: 'MyAssignments' }"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="primary"
                  variant="flat"
                  :loading="submitting"
                  :disabled="!valid || !canSubmit || (existingSubmission && existingSubmission.grade)"
                  @click="submitAssignment"
                >
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

const route = useRoute()
const router = useRouter()
const assignmentStore = useAssignmentStore()

const assignmentId = route.params.assignmentId
const assignment = ref(null)
const existingSubmission = ref(null)
const files = ref([])
const comments = ref('')
const valid = ref(false)
const submitting = ref(false)
const form = ref(null)

const isOverdue = computed(() => {
  if (!assignment.value?.dueDate) return false
  return new Date(assignment.value.dueDate) < new Date()
})

const canSubmit = computed(() => {
  if (!assignment.value) return false
  const now = new Date()
  const availableFrom = new Date(assignment.value.availableFrom || assignment.value.createdAt)
  const availableUntil = new Date(assignment.value.availableUntil || assignment.value.dueDate)
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
    xls: 'mdi-file-excel-box',
    xlsx: 'mdi-file-excel-box',
    zip: 'mdi-folder-zip',
    rar: 'mdi-folder-zip',
    jpg: 'mdi-file-image',
    png: 'mdi-file-image',
    mp4: 'mdi-video-box',
    mp3: 'mdi-music-box',
    txt: 'mdi-file-document',
    py: 'mdi-language-python',
    js: 'mdi-language-javascript',
    java: 'mdi-language-java',
    default: 'mdi-file'
  }
  return icons[fileType?.toLowerCase()] || icons.default
}

const getFileTypeColor = (fileType) => {
  const colors = {
    pdf: 'error',
    doc: 'primary',
    docx: 'primary',
    ppt: 'warning',
    pptx: 'warning',
    zip: 'grey',
    jpg: 'success',
    png: 'success',
    mp4: 'info',
    default: 'primary'
  }
  return colors[fileType?.toLowerCase()] || colors.default
}

const getSubmissionStatusColor = (status) => {
  const colors = {
    submitted: 'info',
    late: 'warning',
    graded: 'success',
    returned: 'primary'
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
    // Get assignment details
    assignment.value = await assignmentStore.getAssignment(assignmentId)
    
    // Get existing submission if any
    const submission = await assignmentStore.getMySubmission(assignmentId)
    existingSubmission.value = submission
    
    if (existingSubmission.value) {
      comments.value = existingSubmission.value.comments || ''
    }
  } catch (error) {
    console.error('Failed to load assignment:', error)
  }
}

const submitAssignment = async () => {
  if (!form.value.validate()) return
  
  submitting.value = true
  try {
    const formData = new FormData()
    files.value.forEach(file => {
      formData.append('files', file)
    })
    formData.append('comments', comments.value)
    
    await assignmentStore.submitAssignment(assignmentId, formData)
    router.push({ name: 'MyAssignments' })
  } catch (error) {
    console.error('Failed to submit assignment:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadAssignment()
})
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}

.attachment-item {
  transition: background-color 0.2s;
}

.attachment-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>