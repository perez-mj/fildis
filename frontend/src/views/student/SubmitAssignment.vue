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
                {{ existingSubmission.status.toUpperCase() }}
              </v-chip>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Submitted On</div>
              <div class="text-body-2">{{ formatDate(existingSubmission.submissionDate) }}</div>
            </div>

            <div class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Submitted Files</div>
              <v-list density="compact">
                <v-list-item
                  v-for="file in existingSubmission.submittedFiles"
                  :key="file._id"
                  :href="file.webViewLink"
                  target="_blank"
                >
                  <template v-slot:prepend>
                    <v-icon size="24">mdi-file</v-icon>
                  </template>
                  <v-list-item-title>{{ file.originalFileName }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>

            <div v-if="existingSubmission.comments" class="mb-2">
              <div class="text-subtitle-2 font-weight-medium">Your Comments</div>
              <div class="text-body-2">{{ existingSubmission.comments }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Submission Form -->
      <v-col cols="12" lg="7">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="text-h6 font-weight-bold">
            {{ existingSubmission ? 'Update Submission' : 'Submit Assignment' }}
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-alert
              v-if="!canSubmit"
              type="warning"
              variant="tonal"
              class="mb-4"
            >
              This assignment is not available for submission. The submission period is
              {{ formatDate(assignment?.availableFrom) }} to {{ formatDate(assignment?.availableUntil) }}.
            </v-alert>

            <v-form ref="form" v-model="valid">
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
                :disabled="!canSubmit"
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
                :disabled="!canSubmit"
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
                  :disabled="!valid || !canSubmit"
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
  const availableFrom = new Date(assignment.value.availableFrom)
  const availableUntil = new Date(assignment.value.availableUntil)
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

const getSubmissionStatusColor = (status) => {
  const colors = {
    submitted: 'info',
    late: 'warning',
    graded: 'success'
  }
  return colors[status] || 'grey'
}

const loadAssignment = async () => {
  try {
    assignment.value = await assignmentStore.getAssignment(assignmentId)
    // Check for existing submission
    const submissions = await assignmentStore.getMySubmissions()
    existingSubmission.value = submissions.find(s => s.assignmentId === assignmentId)
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
</style>