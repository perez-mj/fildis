<!-- frontend/src/views/teacher/ManageAssignments.vue -->
<template>
  <div class="manage-assignments">
    <v-container fluid>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between flex-wrap">
                <div>
                  <div class="text-overline">Assignment Management</div>
                  <h1 class="text-h4">Assignments</h1>
                  <p class="text-subtitle-1 mb-0">Create and manage course assignments</p>
                </div>
                <v-btn color="primary" @click="openCreateDialog" class="mt-2 mt-sm-0">
                  <v-icon start icon="mdi-plus-circle"></v-icon>
                  Create Assignment
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Course Filter -->
      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedCourseId"
            :items="courseOptions"
            label="Filter by Course"
            prepend-inner-icon="mdi-book"
            density="comfortable"
            variant="outlined"
            clearable
            @update:model-value="filterAssignments"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="Search Assignments"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Assignments Tabs -->
      <v-row>
        <v-col cols="12">
          <v-tabs v-model="activeTab" color="primary" align-tabs="start">
            <v-tab value="active">
              <v-icon start icon="mdi-play-circle"></v-icon>
              Active
              <v-chip v-if="activeAssignments.length" size="x-small" class="ml-2">{{ activeAssignments.length }}</v-chip>
            </v-tab>
            <v-tab value="upcoming">
              <v-icon start icon="mdi-calendar-clock"></v-icon>
              Upcoming
              <v-chip v-if="upcomingAssignments.length" size="x-small" class="ml-2">{{ upcomingAssignments.length }}</v-chip>
            </v-tab>
            <v-tab value="past">
              <v-icon start icon="mdi-calendar-check"></v-icon>
              Past
              <v-chip v-if="pastAssignments.length" size="x-small" class="ml-2">{{ pastAssignments.length }}</v-chip>
            </v-tab>
            <v-tab value="all">
              <v-icon start icon="mdi-format-list-checkbox"></v-icon>
              All Assignments
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <!-- Assignments List -->
      <v-row class="mt-4">
        <v-col v-for="assignment in filteredAssignments" :key="assignment._id" cols="12">
          <v-card :loading="loading" hover class="assignment-card">
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar :color="getAssignmentStatusColor(assignment)" variant="flat" rounded="lg">
                  <v-icon :icon="getAssignmentIcon(assignment)"></v-icon>
                </v-avatar>
              </template>
              
              <v-card-title class="text-h6">
                {{ assignment.title }}
                <v-chip 
                  :color="getAssignmentStatusColor(assignment)" 
                  size="small" 
                  class="ml-2"
                >
                  {{ getAssignmentStatus(assignment) }}
                </v-chip>
              </v-card-title>
              
              <v-card-subtitle>
                <div class="d-flex flex-wrap ga-3 mt-1">
                  <div class="d-flex align-center">
                    <v-icon size="small" icon="mdi-book" class="me-1"></v-icon>
                    <span>{{ getCourseName(assignment.courseId) }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="small" icon="mdi-calendar" class="me-1"></v-icon>
                    <span>Due: {{ formatDateTime(assignment.dueDate) }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="small" icon="mdi-star" class="me-1"></v-icon>
                    <span>Max Score: {{ assignment.maxScore }}</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="small" icon="mdi-account-group" class="me-1"></v-icon>
                    <span>{{ assignment.submissions?.length || 0 }} submissions</span>
                  </div>
                </div>
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <p class="text-body-2 text-medium-emphasis">{{ truncateText(assignment.description, 150) }}</p>
              
              <div class="mt-3">
                <v-progress-linear
                  v-if="assignment.submissions?.length"
                  :model-value="(gradedCount(assignment) / assignment.submissions.length) * 100"
                  :color="getGradingProgressColor(gradedCount(assignment) / assignment.submissions.length)"
                  height="8"
                  rounded
                >
                  <template v-slot:default="{ value }">
                    <span class="text-caption">{{ Math.round(value) }}% Graded</span>
                  </template>
                </v-progress-linear>
              </div>

              <v-chip-group v-if="assignment.attachments?.length" class="mt-3">
                <v-chip size="x-small" color="info" variant="outlined" prepend-icon="mdi-paperclip">
                  {{ assignment.attachments.length }} attachment(s)
                </v-chip>
              </v-chip-group>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-3">
              <v-btn
                color="primary"
                variant="text"
                size="small"
                :to="`/teacher/assignments/${assignment._id}/submissions`"
                prepend-icon="mdi-account-check"
              >
                View Submissions ({{ pendingSubmissionsCount(assignment) }} pending)
              </v-btn>
              <v-btn
                color="info"
                variant="text"
                size="small"
                @click="viewGradingSummary(assignment)"
                prepend-icon="mdi-chart-bar"
              >
                Grading Summary
              </v-btn>
              <v-btn
                color="warning"
                variant="text"
                size="small"
                @click="editAssignment(assignment)"
                prepend-icon="mdi-pencil"
              >
                Edit
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="error"
                variant="text"
                size="small"
                icon="mdi-delete"
                @click="confirmDelete(assignment)"
              ></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col v-if="filteredAssignments.length === 0 && !loading" cols="12">
          <v-empty-state
            headline="No Assignments Found"
            :title="selectedCourseId ? 'No assignments for this course' : 'No assignments created yet'"
            :text="selectedCourseId ? 'Create an assignment for this course' : 'Click the Create Assignment button to get started'"
          >
            <template v-slot:actions>
              <v-btn color="primary" @click="openCreateDialog" prepend-icon="mdi-plus-circle">
                Create Assignment
              </v-btn>
            </template>
          </v-empty-state>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Assignment Dialog -->
    <v-dialog v-model="showAssignmentDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-primary">
          <span class="text-white">{{ editingAssignment ? 'Edit Assignment' : 'Create New Assignment' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="closeDialog" color="white"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-form ref="assignmentForm" v-model="formValid">
            <v-row>
              <v-col cols="12" md="8">
                <v-text-field
                  v-model="formData.title"
                  label="Assignment Title"
                  :rules="[v => !!v || 'Title is required']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="formData.courseId"
                  :items="courseOptions"
                  label="Course"
                  :rules="[v => !!v || 'Course is required']"
                  variant="outlined"
                  required
                  :disabled="!!editingAssignment"
                ></v-select>
              </v-col>
            </v-row>

            <v-textarea
              v-model="formData.description"
              label="Description"
              :rules="[v => !!v || 'Description is required']"
              rows="4"
              variant="outlined"
            ></v-textarea>

            <v-textarea
              v-model="formData.instructions"
              label="Instructions (optional)"
              rows="3"
              variant="outlined"
              hint="Provide detailed instructions for students"
            ></v-textarea>

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.maxScore"
                  label="Max Score"
                  type="number"
                  :rules="[v => v && v > 0 || 'Max score must be greater than 0']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.passingScore"
                  label="Passing Score"
                  type="number"
                  :rules="[v => v && v >= 0 || 'Passing score must be 0 or greater']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="formData.isActive"
                  label="Assignment Active"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.availableFrom"
                  label="Available From"
                  type="datetime-local"
                  :rules="[v => !!v || 'Available from date is required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.dueDate"
                  label="Due Date"
                  type="datetime-local"
                  :rules="[v => !!v || 'Due date is required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.availableUntil"
                  label="Available Until"
                  type="datetime-local"
                  hint="Optional - leave empty for no end date"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.allowedFileTypes"
                  label="Allowed File Types (comma-separated)"
                  placeholder="pdf, doc, docx, jpg, png"
                  variant="outlined"
                  hint="Leave empty for default types"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.maxFileSize"
                  label="Max File Size (MB)"
                  type="number"
                  variant="outlined"
                  hint="Leave empty for default (10MB)"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Attachments Upload -->
            <v-card variant="outlined" class="pa-3 mt-2">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-subtitle-2">Assignment Attachments (Optional)</span>
                <v-btn size="small" color="primary" variant="text" @click="addAttachment">
                  <v-icon start icon="mdi-plus"></v-icon>
                  Add File
                </v-btn>
              </div>
              
              <div v-for="(file, index) in formData.attachments" :key="index" class="mb-2">
                <v-file-input
                  v-model="formData.attachments[index]"
                  :label="`Attachment ${index + 1}`"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
                  variant="outlined"
                  density="compact"
                >
                  <template v-slot:append>
                    <v-btn icon="mdi-close" size="small" variant="text" @click="removeAttachment(index)"></v-btn>
                  </template>
                </v-file-input>
              </div>
              
              <v-alert type="info" variant="tonal" class="mt-2">
                <div class="text-caption">
                  Attachments will be uploaded to Google Drive and shared with students.
                </div>
              </v-alert>
            </v-card>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveAssignment" :disabled="!formValid">
            {{ editingAssignment ? 'Update' : 'Create' }} Assignment
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Grading Summary Dialog -->
    <v-dialog v-model="showSummaryDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-info">
          <span class="text-white">Grading Summary</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showSummaryDialog = false" color="white"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="text-center mb-4">
            <h3 class="text-h6">{{ summaryAssignment?.title }}</h3>
            <p class="text-caption text-medium-emphasis">{{ getCourseName(summaryAssignment?.courseId) }}</p>
          </div>

          <v-row>
            <v-col cols="6">
              <v-card color="primary" variant="tonal" class="text-center pa-3">
                <v-icon icon="mdi-file-document" size="32"></v-icon>
                <div class="text-h4 font-weight-bold mt-1">{{ summaryData?.totalSubmissions || 0 }}</div>
                <div class="text-caption">Total Submissions</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card color="success" variant="tonal" class="text-center pa-3">
                <v-icon icon="mdi-check-circle" size="32"></v-icon>
                <div class="text-h4 font-weight-bold mt-1">{{ summaryData?.graded || 0 }}</div>
                <div class="text-caption">Graded</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card color="warning" variant="tonal" class="text-center pa-3">
                <v-icon icon="mdi-clock" size="32"></v-icon>
                <div class="text-h4 font-weight-bold mt-1">{{ summaryData?.pending || 0 }}</div>
                <div class="text-caption">Pending</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card color="info" variant="tonal" class="text-center pa-3">
                <v-icon icon="mdi-chart-line" size="32"></v-icon>
                <div class="text-h4 font-weight-bold mt-1">{{ summaryData?.averageScore?.toFixed(1) || 0 }}</div>
                <div class="text-caption">Average Score</div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex justify-space-between">
            <div>
              <div class="text-caption text-medium-emphasis">Highest Score</div>
              <div class="text-h6 font-weight-bold text-success">{{ summaryData?.highestScore || 0 }}</div>
            </div>
            <div>
              <div class="text-caption text-medium-emphasis">Lowest Score</div>
              <div class="text-h6 font-weight-bold text-error">{{ summaryData?.lowestScore || 0 }}</div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showSummaryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Delete Assignment</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ assignmentToDelete?.title }}"?
          <br>
          <span class="text-error">This will also delete all student submissions. This action cannot be undone.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteAssignment">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'
import { inject } from 'vue'

const route = useRoute()
const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const formValid = ref(false)
const activeTab = ref('active')
const selectedCourseId = ref(null)
const searchQuery = ref('')
const showAssignmentDialog = ref(false)
const showSummaryDialog = ref(false)
const showDeleteDialog = ref(false)
const editingAssignment = ref(null)
const summaryAssignment = ref(null)
const summaryData = ref(null)
const assignmentToDelete = ref(null)

const assignmentForm = ref(null)
const assignments = ref([])

const formData = ref({
  title: '',
  description: '',
  instructions: '',
  courseId: null,
  maxScore: 100,
  passingScore: 60,
  availableFrom: '',
  dueDate: '',
  availableUntil: '',
  isActive: true,
  allowedFileTypes: '',
  maxFileSize: null,
  attachments: []
})

// ==================== TIMEZONE HELPER FUNCTIONS FOR PHILIPPINES (UTC+8) ====================

/**
 * Convert UTC date string from database to LOCAL datetime-local input format
 * Used when editing assignments to populate the form
 */
const utcToLocalDateTimeInput = (utcDateString) => {
  if (!utcDateString) return ''
  const date = new Date(utcDateString)
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Convert LOCAL datetime from form input to UTC for storage in database
 * Used when creating/updating assignments
 */
const localDateTimeToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null
  const date = new Date(localDateTimeString)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Format Date object to LOCAL datetime-local input format
 * Used for setting default dates in create form
 */
const formatDateToLocalInput = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Format UTC date to LOCAL display format (e.g., "Jan 15, 2024, 7:00 PM")
 * Used for displaying dates in the UI
 */
const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Get current date/time in Philippine timezone
 */
const getCurrentPhilippineTime = () => {
  return new Date()
}

/**
 * Create a new date with added hours (in local time)
 */
const addHoursToLocalDate = (date, hours) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

/**
 * Create a new date with added days (in local time)
 */
const addDaysToLocalDate = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

// ==================== END OF TIMEZONE HELPER FUNCTIONS ====================

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const allAssignments = computed(() => {
  return assignments.value
})

const activeAssignments = computed(() => {
  const now = getCurrentPhilippineTime()
  return allAssignments.value.filter(a => 
    new Date(a.dueDate) > now && a.isActive
  )
})

const upcomingAssignments = computed(() => {
  const now = getCurrentPhilippineTime()
  const twoWeeks = addDaysToLocalDate(now, 14)
  return allAssignments.value.filter(a => 
    new Date(a.dueDate) > now && 
    new Date(a.dueDate) <= twoWeeks &&
    a.isActive
  )
})

const pastAssignments = computed(() => {
  const now = getCurrentPhilippineTime()
  return allAssignments.value.filter(a => new Date(a.dueDate) < now)
})

const filteredAssignments = computed(() => {
  let filtered = allAssignments.value
  
  if (activeTab.value === 'active') filtered = activeAssignments.value
  else if (activeTab.value === 'upcoming') filtered = upcomingAssignments.value
  else if (activeTab.value === 'past') filtered = pastAssignments.value
  
  if (selectedCourseId.value) {
    filtered = filtered.filter(a => {
      const courseId = typeof a.courseId === 'object' ? a.courseId._id : a.courseId
      return courseId === selectedCourseId.value
    })
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const getCourseName = (courseId) => {
  if (!courseId) return 'Unknown'
  const id = typeof courseId === 'object' ? courseId._id : courseId
  const course = teacherStore.courses.find(c => c._id === id)
  return course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course'
}

const getAssignmentStatus = (assignment) => {
  const now = getCurrentPhilippineTime()
  const dueDate = new Date(assignment.dueDate)
  
  if (!assignment.isActive) return 'Inactive'
  if (dueDate < now) return 'Overdue'
  const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) return 'Due Soon'
  return 'Active'
}

const getAssignmentStatusColor = (assignment) => {
  const status = getAssignmentStatus(assignment)
  const colors = {
    'Active': 'success',
    'Due Soon': 'warning',
    'Overdue': 'error',
    'Inactive': 'grey'
  }
  return colors[status] || 'primary'
}

const getAssignmentIcon = (assignment) => {
  const status = getAssignmentStatus(assignment)
  const icons = {
    'Active': 'mdi-play-circle',
    'Due Soon': 'mdi-clock-alert',
    'Overdue': 'mdi-alert-circle',
    'Inactive': 'mdi-pause-circle'
  }
  return icons[status] || 'mdi-format-list-checkbox'
}

const gradedCount = (assignment) => {
  return assignment.submissions?.filter(s => s.status === 'graded').length || 0
}

const pendingSubmissionsCount = (assignment) => {
  return assignment.submissions?.filter(s => s.status === 'submitted' || s.status === 'late').length || 0
}

const getGradingProgressColor = (ratio) => {
  if (ratio >= 0.8) return 'success'
  if (ratio >= 0.5) return 'warning'
  return 'error'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const loadAssignments = async () => {
  loading.value = true
  try {
    if (teacherStore.courses.length === 0) {
      await teacherStore.fetchMyCourses()
    }
    
    const allAssignmentsList = []
    
    for (const course of teacherStore.courses) {
      const courseDetails = await teacherService.getMyCourses()
      const fullCourse = courseDetails.find(c => c._id === course._id)
      
      if (fullCourse && fullCourse.assignments && fullCourse.assignments.length > 0) {
        for (const assignment of fullCourse.assignments) {
          try {
            const submissions = await teacherService.getAssignmentSubmissions(assignment._id)
            allAssignmentsList.push({
              ...assignment,
              submissions: submissions || []
            })
          } catch (err) {
            console.error(`Failed to get submissions for assignment ${assignment._id}:`, err)
            allAssignmentsList.push({
              ...assignment,
              submissions: []
            })
          }
        }
      }
    }
    
    assignments.value = allAssignmentsList
    
    if (route.query.course) {
      selectedCourseId.value = route.query.course
    }
  } catch (error) {
    console.error('Failed to load assignments:', error)
    snackbar.value = { 
      show: true, 
      text: 'Failed to load assignments', 
      color: 'error' 
    }
  } finally {
    loading.value = false
  }
}

const filterAssignments = () => {
  // This is handled by computed property
}

const openCreateDialog = () => {
  editingAssignment.value = null
  
  // Get current Philippine time
  const now = getCurrentPhilippineTime()
  
  // Set available from to 1 hour from now
  const availableFrom = addHoursToLocalDate(now, 1)
  
  // Set due date to 7 days from available from
  const dueDate = addDaysToLocalDate(availableFrom, 7)
  
  formData.value = {
    title: '',
    description: '',
    instructions: '',
    courseId: selectedCourseId.value || teacherStore.courses[0]?._id || null,
    maxScore: 100,
    passingScore: 60,
    availableFrom: formatDateToLocalInput(availableFrom),
    dueDate: formatDateToLocalInput(dueDate),
    availableUntil: '',
    isActive: true,
    allowedFileTypes: '',
    maxFileSize: null,
    attachments: []
  }
  showAssignmentDialog.value = true
}

const editAssignment = (assignment) => {
  editingAssignment.value = assignment
  
  // Convert UTC dates from database to LOCAL for form display
  formData.value = {
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions || '',
    courseId: typeof assignment.courseId === 'object' ? assignment.courseId._id : assignment.courseId,
    maxScore: assignment.maxScore,
    passingScore: assignment.passingScore,
    availableFrom: utcToLocalDateTimeInput(assignment.availableFrom),
    dueDate: utcToLocalDateTimeInput(assignment.dueDate),
    availableUntil: assignment.availableUntil ? utcToLocalDateTimeInput(assignment.availableUntil) : '',
    isActive: assignment.isActive,
    allowedFileTypes: assignment.allowedFileTypes?.join(', ') || '',
    maxFileSize: assignment.maxFileSize ? assignment.maxFileSize / (1024 * 1024) : null,
    attachments: []
  }
  showAssignmentDialog.value = true
}

const addAttachment = () => {
  formData.value.attachments.push(null)
}

const removeAttachment = (index) => {
  formData.value.attachments.splice(index, 1)
}

const saveAssignment = async () => {
  const isValid = await assignmentForm.value?.validate()
  if (!isValid) return
  
  saving.value = true
  try {
    const submitData = new FormData()
    submitData.append('title', formData.value.title)
    submitData.append('description', formData.value.description)
    submitData.append('instructions', formData.value.instructions || '')
    submitData.append('maxScore', formData.value.maxScore.toString())
    submitData.append('passingScore', formData.value.passingScore.toString())
    
    // Convert local datetime to UTC for storage
    if (formData.value.availableFrom) {
      const availableFromUTC = localDateTimeToUTC(formData.value.availableFrom)
      if (availableFromUTC) submitData.append('availableFrom', availableFromUTC)
    }
    
    if (formData.value.dueDate) {
      const dueDateUTC = localDateTimeToUTC(formData.value.dueDate)
      if (dueDateUTC) submitData.append('dueDate', dueDateUTC)
    }
    
    if (formData.value.availableUntil) {
      const availableUntilUTC = localDateTimeToUTC(formData.value.availableUntil)
      if (availableUntilUTC) submitData.append('availableUntil', availableUntilUTC)
    }
    
    submitData.append('isActive', formData.value.isActive.toString())
    
    if (formData.value.allowedFileTypes) {
      submitData.append('allowedFileTypes', formData.value.allowedFileTypes)
    }
    if (formData.value.maxFileSize) {
      submitData.append('maxFileSize', (formData.value.maxFileSize * 1024 * 1024).toString())
    }
    
    formData.value.attachments.forEach((file) => {
      if (file && file instanceof File) {
        submitData.append('attachments', file)
      }
    })
    
    if (editingAssignment.value) {
      await teacherService.updateAssignment(editingAssignment.value._id, Object.fromEntries(submitData))
      snackbar.value = { show: true, text: 'Assignment updated successfully!', color: 'success' }
    } else {
      await teacherService.createAssignment(formData.value.courseId, submitData)
      snackbar.value = { show: true, text: 'Assignment created successfully!', color: 'success' }
    }
    
    closeDialog()
    await loadAssignments()
    await teacherStore.fetchMyCourses()
  } catch (error) {
    console.error('Failed to save assignment:', error)
    snackbar.value = { 
      show: true, 
      text: error.response?.data?.message || 'Failed to save assignment', 
      color: 'error' 
    }
  } finally {
    saving.value = false
  }
}

const viewGradingSummary = async (assignment) => {
  try {
    const summary = await teacherService.getGradingSummary(assignment._id)
    summaryAssignment.value = assignment
    summaryData.value = summary
    showSummaryDialog.value = true
  } catch (error) {
    console.error('Failed to load summary:', error)
    snackbar.value = { show: true, text: 'Failed to load grading summary', color: 'error' }
  }
}

const confirmDelete = (assignment) => {
  assignmentToDelete.value = assignment
  showDeleteDialog.value = true
}

const deleteAssignment = async () => {
  deleting.value = true
  try {
    await teacherService.deleteAssignment(assignmentToDelete.value._id)
    assignments.value = assignments.value.filter(a => a._id !== assignmentToDelete.value._id)
    showDeleteDialog.value = false
    snackbar.value = { show: true, text: 'Assignment deleted successfully', color: 'success' }
  } catch (error) {
    console.error('Failed to delete assignment:', error)
    snackbar.value = { show: true, text: 'Failed to delete assignment', color: 'error' }
  } finally {
    deleting.value = false
  }
}

const closeDialog = () => {
  showAssignmentDialog.value = false
  editingAssignment.value = null
}

onMounted(() => {
  loadAssignments()
})
</script>

<style scoped>
.assignment-card {
  transition: all 0.3s ease;
}

.assignment-card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>