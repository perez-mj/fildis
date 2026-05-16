<!-- frontend/src/views/teacher/GradeSubmission.vue -->
<template>
  <div class="grade-submission">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="d-flex align-center">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="$router.back()"
            class="mr-3"
            color="primary"
          ></v-btn>
          <div>
            <div class="text-overline text-grey-darken-1">Grade Submission</div>
            <h1 class="text-h4 font-weight-light mb-2">{{ submission?.assignmentId?.title || 'Loading...' }}</h1>
            <div class="section-underline"></div>
            <div class="text-subtitle-1 text-grey-darken-1 mt-2">
              Student: {{ submission?.studentId?.firstName }} {{ submission?.studentId?.lastName }}
            </div>
          </div>
        </div>
      </div>

      <v-row>
        <!-- Submission Details -->
        <v-col cols="12" md="7">
          <v-card variant="outlined" :loading="loading">
            <v-card-title class="pa-4 border-bottom">
              <span class="text-subtitle-1 font-weight-medium">Submission Details</span>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <div class="info-row mb-3">
                <v-icon icon="mdi-calendar" size="18" color="grey-darken-1" class="mr-2"></v-icon>
                <span class="text-caption text-grey-darken-1">Submitted On:</span>
                <span class="text-body-2 ml-2">{{ formatDateTime(submission?.submissionDate) }}</span>
              </div>
              
              <div class="info-row mb-3">
                <v-icon icon="mdi-clock" size="18" color="grey-darken-1" class="mr-2"></v-icon>
                <span class="text-caption text-grey-darken-1">Status:</span>
                <v-chip :color="submission?.isLate ? 'error' : 'success'" size="x-small" variant="tonal" class="ml-2">
                  {{ submission?.isLate ? 'Late Submission' : 'On Time' }}
                </v-chip>
              </div>
              
              <div v-if="submission?.comments" class="info-row mb-4">
                <v-icon icon="mdi-comment" size="18" color="grey-darken-1" class="mr-2"></v-icon>
                <span class="text-caption text-grey-darken-1">Student Comments:</span>
                <div class="text-body-2 mt-1 ml-6">{{ submission.comments }}</div>
              </div>

              <!-- Submitted Files -->
              <div class="mt-4">
                <div class="text-subtitle-2 mb-2 d-flex align-center">
                  <v-icon icon="mdi-paperclip" size="16" class="mr-1"></v-icon>
                  Submitted Files
                </div>
                <v-list v-if="submission?.submittedFiles?.length" class="calm-list">
                  <v-list-item v-for="(file, index) in submission.submittedFiles" :key="index" class="calm-list-item">
                    <template v-slot:prepend>
                      <v-icon :icon="getFileIcon(file.fileType)" color="primary" size="20"></v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ file.originalFileName }}</v-list-item-title>
                    <v-list-item-subtitle class="text-caption">{{ formatFileSize(file.fileSize) }}</v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn size="x-small" variant="text" color="primary" :href="file.webViewLink" target="_blank" rounded="pill">
                        View
                      </v-btn>
                      <v-btn size="x-small" variant="text" color="success" :href="file.webContentLink" download rounded="pill">
                        Download
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2">
                  <span class="text-caption">No files submitted for this assignment.</span>
                </v-alert>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Grading Form -->
        <v-col cols="12" md="5">
          <v-card variant="outlined">
            <v-card-title class="pa-4 border-bottom">
              <span class="text-subtitle-1 font-weight-medium">Grade & Feedback</span>
            </v-card-title>
            
            <v-card-text class="pa-4">
              <v-form ref="gradeForm" v-model="formValid">
                <div class="mb-4">
                  <label class="text-caption text-grey-darken-1 mb-1 d-block">Score</label>
                  <div class="d-flex align-center gap-3">
                    <v-text-field
                      v-model="gradeData.score"
                      type="number"
                      :rules="scoreRules"
                      variant="outlined"
                      density="compact"
                      hide-details="auto"
                      :suffix="`/ ${submission?.assignmentId?.maxScore || 100}`"
                      style="flex: 1"
                    ></v-text-field>
                    <v-slider
                      v-model="gradeData.score"
                      :min="0"
                      :max="submission?.assignmentId?.maxScore || 100"
                      :step="1"
                      hide-details
                      style="flex: 2"
                      color="primary"
                      thumb-label="always"
                      thumb-size="16"
                    ></v-slider>
                  </div>
                </div>

                <v-textarea
                  v-model="gradeData.feedback"
                  label="Feedback"
                  placeholder="Provide constructive feedback to the student..."
                  rows="5"
                  variant="outlined"
                  counter="500"
                  class="mb-4"
                ></v-textarea>

                <v-alert
                  v-if="gradeData.score >= (submission?.assignmentId?.passingScore || 60)"
                  type="success"
                  variant="tonal"
                  density="compact"
                  class="mb-2"
                >
                  <v-icon start icon="mdi-check-circle" size="16"></v-icon>
                  This submission is passing!
                </v-alert>
                <v-alert
                  v-else-if="gradeData.score > 0"
                  type="warning"
                  variant="tonal"
                  density="compact"
                  class="mb-2"
                >
                  <v-icon start icon="mdi-alert" size="16"></v-icon>
                  Below passing score.
                </v-alert>
              </v-form>
            </v-card-text>
            
            <v-card-actions class="pa-4 border-top">
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="$router.back()" rounded="pill">Cancel</v-btn>
              <v-btn color="primary" :loading="saving" @click="submitGrade" :disabled="!formValid" rounded="pill">
                Save Grade
              </v-btn>
            </v-card-actions>
          </v-card>

          <!-- Quick Feedback Templates -->
          <v-card variant="outlined" class="mt-4">
            <v-card-title class="text-subtitle-2 pa-3 border-bottom">
              <v-icon start icon="mdi-text-box" size="16"></v-icon>
              Quick Feedback
            </v-card-title>
            <v-card-text class="pa-3">
              <v-chip-group column>
                <v-chip
                  v-for="template in feedbackTemplates"
                  :key="template"
                  size="x-small"
                  color="primary"
                  variant="outlined"
                  @click="gradeData.feedback = template"
                  class="cursor-pointer"
                >
                  {{ truncateText(template, 35) }}
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
  v => (!!v && v !== '') || v === 0 || 'Score is required',
  v => v >= 0 || 'Score must be at least 0',
  v => v <= (submission.value?.assignmentId?.maxScore || 100) || `Max score is ${submission.value?.assignmentId?.maxScore}`
])

const feedbackTemplates = [
  "Great work! Your submission shows good understanding of the concepts.",
  "Good effort, but there are some areas that need improvement.",
  "Please review the assignment instructions carefully. Some requirements were missed.",
  "Excellent work! You've demonstrated mastery of the topic.",
  "Satisfactory work. Keep up the good effort!",
  "Well organized and clearly presented. Good job!",
  "The submission is incomplete. Please review the requirements."
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
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
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

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
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
    snackbar.value = { show: true, text: 'Invalid submission ID', color: 'error' }
    return
  }
  
  loading.value = true
  try {
    if (teacherStore.courses.length === 0) {
      await teacherStore.fetchMyCourses()
    }
    
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
    
    submission.value = allSubmissions.find(s => s._id === submissionId)
    
    if (!submission.value) {
      throw new Error('Submission not found')
    }
    
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
.section-underline {
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline:hover {
  width: 64px;
}

.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.border-top {
  border-top: 1px solid #E2E8F0;
}

.info-row {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
}

.calm-list {
  background: transparent;
}

.calm-list-item {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.calm-list-item:hover {
  transform: translateX(4px);
  background-color: rgba(99, 102, 241, 0.04);
}

.cursor-pointer {
  cursor: pointer;
}
</style>