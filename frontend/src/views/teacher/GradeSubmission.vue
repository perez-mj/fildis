<!-- frontend/src/views/teacher/GradeSubmission.vue -->
<template>
  <div class="grade-submission">
    <v-container fluid>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-arrow-left"
                  variant="text"
                  @click="$router.back()"
                  class="mr-3"
                ></v-btn>
                <div>
                  <div class="text-overline">Grade Submission</div>
                  <h1 class="text-h4">{{ submission?.assignmentId?.title || 'Loading...' }}</h1>
                  <div class="text-subtitle-1">
                    Student: {{ submission?.studentId?.firstName }} {{ submission?.studentId?.lastName }}
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <!-- Submission Details -->
        <v-col cols="12" md="7">
          <v-card :loading="loading">
            <v-card-title class="text-h6 bg-grey-lighten-3 pa-3">
              <v-icon start icon="mdi-file-document"></v-icon>
              Submission Details
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-calendar"></v-icon>
                  </template>
                  <v-list-item-title>Submitted On</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateTime(submission?.submissionDate) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-clock"></v-icon>
                  </template>
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip :color="submission?.isLate ? 'error' : 'success'" size="small">
                      {{ submission?.isLate ? 'Late Submission' : 'On Time' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="submission?.comments">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-comment"></v-icon>
                  </template>
                  <v-list-item-title>Student Comments</v-list-item-title>
                  <v-list-item-subtitle>{{ submission.comments }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>

              <!-- Submitted Files -->
              <div class="mt-4">
                <h3 class="text-subtitle-1 mb-2">Submitted Files</h3>
                <v-list v-if="submission?.submittedFiles?.length">
                  <v-list-item v-for="(file, index) in submission.submittedFiles" :key="index">
                    <template v-slot:prepend>
                      <v-icon :icon="getFileIcon(file.fileType)"></v-icon>
                    </template>
                    <v-list-item-title>{{ file.originalFileName }}</v-list-item-title>
                    <v-list-item-subtitle>{{ formatFileSize(file.fileSize) }}</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn size="small" variant="text" color="primary" :href="file.webViewLink" target="_blank">
                        View
                      </v-btn>
                      <v-btn size="small" variant="text" color="success" :href="file.webContentLink" download>
                        Download
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else type="info" variant="tonal" class="mt-2">
                  No files submitted for this assignment.
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Grading Form -->
        <v-col cols="12" md="5">
          <v-card>
            <v-card-title class="text-h6 bg-grey-lighten-3 pa-3">
              <v-icon start icon="mdi-star"></v-icon>
              Grade & Feedback
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-form ref="gradeForm" v-model="formValid">
                <v-text-field
                  v-model="gradeData.score"
                  label="Score"
                  type="number"
                  :rules="scoreRules"
                  variant="outlined"
                  :suffix="`/ ${submission?.assignmentId?.maxScore || 100}`"
                  class="mb-4"
                >
                  <template v-slot:append>
                    <v-slider
                      v-model="gradeData.score"
                      :min="0"
                      :max="submission?.assignmentId?.maxScore || 100"
                      :step="1"
                      hide-details
                      style="width: 150px"
                      class="ml-2"
                    ></v-slider>
                  </template>
                </v-text-field>

                <v-textarea
                  v-model="gradeData.feedback"
                  label="Feedback"
                  placeholder="Provide constructive feedback to the student..."
                  rows="6"
                  variant="outlined"
                  counter="500"
                  class="mb-4"
                ></v-textarea>

                <v-alert
                  v-if="gradeData.score >= (submission?.assignmentId?.passingScore || 60)"
                  type="success"
                  variant="tonal"
                  class="mb-4"
                >
                  <v-icon start icon="mdi-check-circle"></v-icon>
                  This submission is passing!
                </v-alert>
                <v-alert
                  v-else-if="gradeData.score > 0"
                  type="warning"
                  variant="tonal"
                  class="mb-4"
                >
                  <v-icon start icon="mdi-alert"></v-icon>
                  This submission is below the passing score.
                </v-alert>
              </v-form>
            </v-card-text>
            
            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="$router.back()">Cancel</v-btn>
              <v-btn color="primary" :loading="saving" @click="submitGrade" :disabled="!formValid">
                Save Grade
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Quick Feedback Templates -->
          <v-card class="mt-4">
            <v-card-title class="text-subtitle-2 pa-3">
              <v-icon start icon="mdi-text-box"></v-icon>
              Quick Feedback Templates
            </v-card-title>
            <v-card-text class="pa-3">
              <v-chip-group column>
                <v-chip
                  v-for="template in feedbackTemplates"
                  :key="template"
                  size="small"
                  color="info"
                  variant="outlined"
                  @click="gradeData.feedback = template"
                >
                  {{ template.substring(0, 40) }}...
                </v-chip>
              </v-chip-group>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const loading = ref(false)
const saving = ref(false)
const formValid = ref(false)
const submission = ref(null)
const gradeForm = ref(null)

const gradeData = ref({
  score: 0,
  feedback: ''
})

const scoreRules = computed(() => [
  v => !!v || v === 0 || 'Score is required',
  v => v >= 0 || 'Score must be at least 0',
  v => v <= (submission.value?.assignmentId?.maxScore || 100) || `Score cannot exceed ${submission.value?.assignmentId?.maxScore}`
])

const feedbackTemplates = [
  "Great work! Your submission shows good understanding of the concepts.",
  "Good effort, but there are some areas that need improvement.",
  "Please review the assignment instructions carefully. Some requirements were missed.",
  "Excellent work! You've demonstrated mastery of the topic.",
  "Satisfactory work. Keep up the good effort!",
  "Please improve your submission by adding more details and examples.",
  "Well organized and clearly presented. Good job!",
  "The submission is incomplete. Please review the requirements and resubmit."
]

const getFileIcon = (fileType) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    jpg: 'mdi-file-image-box',
    png: 'mdi-file-image-box',
    zip: 'mdi-folder-zip',
    txt: 'mdi-file-document'
  }
  return icons[fileType] || 'mdi-file'
}

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const submitGrade = async () => {
  if (!gradeForm.value?.validate()) return
  
  saving.value = true
  try {
    await teacherService.gradeSubmission(
      route.params.submissionId,
      gradeData.value.score,
      gradeData.value.feedback
    )
    
    snackbar.value = { 
      show: true, 
      text: 'Submission graded successfully!', 
      color: 'success' 
    }
    
    // Go back after short delay
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    console.error('Failed to grade submission:', error)
    snackbar.value = { 
      show: true, 
      text: error.response?.data?.message || 'Failed to grade submission', 
      color: 'error' 
    }
  } finally {
    saving.value = false
  }
}

const loadSubmission = async () => {
  const submissionId = route.params.submissionId
  
  if (!submissionId) {
    console.error('No submission ID provided')
    snackbar.value = { 
      show: true, 
      text: 'Invalid submission ID', 
      color: 'error' 
    }
    return
  }
  
  loading.value = true
  try {
    // First, get all courses to find which assignment this submission belongs to
    if (teacherStore.courses.length === 0) {
      await teacherStore.fetchMyCourses()
    }
    
    // Get all assignments from all courses
    let allSubmissions = []
    for (const course of teacherStore.courses) {
      if (course.assignments?.length) {
        for (const assignment of course.assignments) {
          try {
            const submissions = await teacherService.getAssignmentSubmissions(assignment._id)
            allSubmissions.push(...submissions)
          } catch (e) {
            console.error(`Failed to get submissions for assignment ${assignment._id}:`, e)
          }
        }
      }
    }
    
    // Find the specific submission
    submission.value = allSubmissions.find(s => s._id === submissionId)
    
    if (!submission.value) {
      throw new Error('Submission not found')
    }
    
    // Populate grade data if already graded
    if (submission.value.grade) {
      gradeData.value.score = submission.value.grade.score
      gradeData.value.feedback = submission.value.grade.feedback || ''
    }
  } catch (error) {
    console.error('Failed to load submission:', error)
    snackbar.value = { 
      show: true, 
      text: error.message || 'Failed to load submission', 
      color: 'error' 
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSubmission()
})
</script>

<style scoped>
.v-list-item {
  min-height: 60px;
}
</style>