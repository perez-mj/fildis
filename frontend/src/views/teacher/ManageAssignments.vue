<!-- frontend/src/views/teacher/ManageAssignments.vue -->
<template>
  <div class="manage-assignments">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap mb-6">
        <div>
          <h1 class="text-h4 font-weight-light mb-2">Assignments</h1>
          <div class="section-underline"></div>
        </div>
        <v-btn color="primary" @click="openCreateDialog" rounded="pill" class="mt-3 mt-sm-0">
          <v-icon start icon="mdi-plus-circle"></v-icon>
          Create Assignment
        </v-btn>
      </div>

      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedCourseId"
            :items="courseOptions"
            label="Filter by Course"
            prepend-inner-icon="mdi-book"
            density="comfortable"
            clearable
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="searchQuery"
            label="Search Assignments"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            clearable
            variant="outlined"
          ></v-text-field>
        </v-col>
      </v-row>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" align-tabs="start" class="calm-tabs mb-4">
        <v-tab value="active" rounded="pill">
          <v-icon start icon="mdi-play-circle" size="18"></v-icon>
          Active
          <v-chip v-if="activeAssignments.length" size="x-small" class="ml-2" color="primary" variant="tonal">
            {{ activeAssignments.length }}
          </v-chip>
        </v-tab>
        <v-tab value="upcoming" rounded="pill">
          <v-icon start icon="mdi-calendar-clock" size="18"></v-icon>
          Upcoming
        </v-tab>
        <v-tab value="past" rounded="pill">
          <v-icon start icon="mdi-calendar-check" size="18"></v-icon>
          Past
        </v-tab>
        <v-tab value="all" rounded="pill">
          <v-icon start icon="mdi-format-list-checkbox" size="18"></v-icon>
          All
        </v-tab>
      </v-tabs>

      <!-- Assignments List -->
      <v-row>
        <v-col v-for="assignment in filteredAssignments" :key="assignment._id" cols="12">
          <v-card variant="outlined" :loading="loading" class="assignment-card">
            <v-card-item class="pa-4">
              <template v-slot:prepend>
                <v-avatar :color="getAssignmentStatusColor(assignment)" variant="tonal" rounded="lg" size="48">
                  <v-icon :icon="getAssignmentIcon(assignment)" size="24"></v-icon>
                </v-avatar>
              </template>
              
              <v-card-title class="text-h6 font-weight-light pa-0 mb-1">
                {{ assignment.title }}
                <v-chip 
                  :color="getAssignmentStatusColor(assignment)" 
                  size="x-small" 
                  variant="tonal"
                  class="ml-2"
                >
                  {{ getAssignmentStatus(assignment) }}
                </v-chip>
              </v-card-title>
              
              <v-card-subtitle class="pa-0">
                <div class="d-flex flex-wrap ga-3 mt-1">
                  <span class="text-caption d-flex align-center">
                    <v-icon size="12" icon="mdi-book" class="me-1"></v-icon>
                    {{ getCourseName(assignment.courseId) }}
                  </span>
                  <span class="text-caption d-flex align-center">
                    <v-icon size="12" icon="mdi-calendar" class="me-1"></v-icon>
                    Due: {{ formatDateTime(assignment.dueDate) }}
                  </span>
                  <span class="text-caption d-flex align-center">
                    <v-icon size="12" icon="mdi-star" class="me-1"></v-icon>
                    Score: {{ assignment.maxScore }}
                  </span>
                  <span class="text-caption d-flex align-center">
                    <v-icon size="12" icon="mdi-account-group" class="me-1"></v-icon>
                    {{ assignment.submissions?.length || 0 }} submissions
                  </span>
                  <span v-if="assignment.attachments?.length" class="text-caption d-flex align-center">
                    <v-icon size="12" icon="mdi-attachment" class="me-1"></v-icon>
                    {{ assignment.attachments.length }} attachment(s)
                  </span>
                </div>
              </v-card-subtitle>
            </v-card-item>

            <v-card-text class="pt-0 px-4 pb-2">
              <p class="text-body-2 text-grey-darken-1">{{ truncateText(assignment.description, 120) }}</p>
              
              <!-- Show attachments in card -->
              <div v-if="assignment.attachments?.length" class="mt-2">
                <div class="d-flex flex-wrap gap-2">
                  <a
                    v-for="(attachment, idx) in assignment.attachments.slice(0, 3)"
                    :key="idx"
                    :href="attachment.webViewLink"
                    target="_blank"
                    class="attachment-link text-caption"
                  >
                    <v-icon size="14" class="mr-1">mdi-file</v-icon>
                    {{ attachment.originalFileName || attachment.fileName }}
                  </a>
                  <span v-if="assignment.attachments.length > 3" class="text-caption text-grey">
                    +{{ assignment.attachments.length - 3 }} more
                  </span>
                </div>
              </div>
              
              <div v-if="assignment.submissions?.length" class="mt-3">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-caption text-grey-darken-1">Grading Progress</span>
                  <span class="text-caption font-weight-medium">{{ Math.round((gradedCount(assignment) / assignment.submissions.length) * 100) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="(gradedCount(assignment) / assignment.submissions.length) * 100"
                  :color="getGradingProgressColor(gradedCount(assignment) / assignment.submissions.length)"
                  height="3"
                  rounded
                ></v-progress-linear>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-3">
              <v-btn
                color="primary"
                variant="text"
                size="small"
                :to="`/teacher/assignments/${assignment._id}/submissions`"
                prepend-icon="mdi-account-check"
                rounded="pill"
              >
                Submissions ({{ pendingSubmissionsCount(assignment) }})
              </v-btn>
              <v-btn
                color="info"
                variant="text"
                size="small"
                @click="viewGradingSummary(assignment)"
                prepend-icon="mdi-chart-bar"
                rounded="pill"
              >
                Summary
              </v-btn>
              <v-btn
                color="warning"
                variant="text"
                size="small"
                @click="editAssignment(assignment)"
                prepend-icon="mdi-pencil"
                rounded="pill"
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

        <!-- Empty State -->
        <v-col v-if="filteredAssignments.length === 0 && !loading" cols="12">
          <v-card variant="outlined" class="text-center pa-8">
            <v-icon icon="mdi-format-list-checkbox" size="64" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
            <div class="text-h6 font-weight-light text-grey-darken-1">
              {{ selectedCourseId ? 'No assignments for this course' : 'No assignments yet' }}
            </div>
            <div class="text-caption text-grey-darken-1 mt-1">
              {{ selectedCourseId ? 'Create an assignment for this course' : 'Click Create Assignment to get started' }}
            </div>
            <v-btn color="primary" variant="outlined" @click="openCreateDialog" class="mt-4" rounded="pill">
              Create Assignment
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Create/Edit Assignment Dialog (FIXED) -->
    <v-dialog v-model="showAssignmentDialog" max-width="900px" scrollable>
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">{{ editingAssignment ? 'Edit Assignment' : 'Create Assignment' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeDialog"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4" style="max-height: 70vh;">
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
              rows="3"
              variant="outlined"
            ></v-textarea>

            <v-textarea
              v-model="formData.instructions"
              label="Instructions (optional)"
              rows="2"
              variant="outlined"
              hint="Provide detailed instructions for students"
            ></v-textarea>

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.maxScore"
                  label="Max Score"
                  type="number"
                  :rules="[v => v && v > 0 || 'Must be > 0']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.passingScore"
                  label="Passing Score"
                  type="number"
                  :rules="[v => v && v >= 0 || 'Must be ≥ 0']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="formData.isActive"
                  label="Active"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.availableFrom"
                  label="Available From"
                  type="datetime-local"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.dueDate"
                  label="Due Date"
                  type="datetime-local"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.availableUntil"
                  label="Available Until (Optional)"
                  type="datetime-local"
                  variant="outlined"
                  hint="Leave empty if no end date"
                  persistent-hint
                ></v-text-field>
              </v-col>
            </v-row>

            <v-text-field
              v-model="formData.allowedFileTypes"
              label="Allowed File Types"
              placeholder="pdf, doc, docx, jpg, png"
              variant="outlined"
              hint="Comma-separated, leave empty for defaults"
            ></v-text-field>

            <v-divider class="my-4"></v-divider>
            
            <div class="text-subtitle-2 mb-2">Assignment Attachments</div>
            <v-file-input
              v-model="attachmentFiles"
              label="Upload attachments (optional)"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.png,.zip,.py,.js,.java,.rar"
              prepend-icon="mdi-attachment"
              variant="outlined"
              show-size
              counter
              hint="Upload reference materials or resources for students (max 5 files)"
              persistent-hint
            ></v-file-input>

            <!-- Display existing attachments when editing -->
            <div v-if="editingAssignment && existingAttachments.length > 0" class="mt-4">
              <div class="text-subtitle-2 mb-2">Existing Attachments</div>
              <div class="existing-attachments">
                <div v-for="(attachment, index) in existingAttachments" :key="index" class="d-flex align-center mb-2 pa-2" style="background: #f5f5f5; border-radius: 8px;">
                  <v-icon size="20" class="mr-2" color="primary">mdi-file-document</v-icon>
                  <a :href="attachment.webViewLink" target="_blank" class="text-caption flex-grow-1 text-decoration-none">
                    {{ attachment.originalFileName || attachment.fileName }}
                  </a>
                  <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removeExistingAttachment(index)"></v-btn>
                </div>
              </div>
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialog" rounded="pill">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="saveAssignment" :disabled="!formValid" rounded="pill">
            {{ editingAssignment ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Grading Summary Dialog -->
    <v-dialog v-model="showSummaryDialog" max-width="500px">
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">Grading Summary</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showSummaryDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="text-center mb-4">
            <h3 class="text-subtitle-1 font-weight-medium">{{ summaryAssignment?.title }}</h3>
            <p class="text-caption text-grey-darken-1">{{ getCourseName(summaryAssignment?.courseId) }}</p>
          </div>

          <v-row>
            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon icon="mdi-file-document" size="24" color="primary"></v-icon>
                <div class="text-h5 font-weight-light mt-1">{{ summaryData?.totalSubmissions || 0 }}</div>
                <div class="text-caption text-grey-darken-1">Submissions</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon icon="mdi-check-circle" size="24" color="success"></v-icon>
                <div class="text-h5 font-weight-light mt-1">{{ summaryData?.graded || 0 }}</div>
                <div class="text-caption text-grey-darken-1">Graded</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon icon="mdi-clock" size="24" color="warning"></v-icon>
                <div class="text-h5 font-weight-light mt-1">{{ summaryData?.pending || 0 }}</div>
                <div class="text-caption text-grey-darken-1">Pending</div>
              </v-card>
            </v-col>
            <v-col cols="6">
              <v-card variant="outlined" class="text-center pa-3">
                <v-icon icon="mdi-chart-line" size="24" color="info"></v-icon>
                <div class="text-h5 font-weight-light mt-1">{{ summaryData?.averageScore?.toFixed(1) || 0 }}</div>
                <div class="text-caption text-grey-darken-1">Average</div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex justify-space-between">
            <div>
              <div class="text-caption text-grey-darken-1">Highest</div>
              <div class="text-h5 font-weight-light text-success">{{ summaryData?.highestScore || 0 }}</div>
            </div>
            <div>
              <div class="text-caption text-grey-darken-1">Lowest</div>
              <div class="text-h5 font-weight-light text-error">{{ summaryData?.lowestScore || 0 }}</div>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showSummaryDialog = false" rounded="pill">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-light pa-4">Delete Assignment</v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          Delete <strong>"{{ assignmentToDelete?.title }}"</strong>?
          <div class="text-error text-caption mt-2">This also deletes all student submissions. Cannot be undone.</div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteAssignment" rounded="pill">Delete</v-btn>
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
const attachmentFiles = ref([])
const existingAttachments = ref([])

// FIXED: Added missing availableUntil field
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
  maxFileSize: null
})

// Timezone helper functions
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

const localDateTimeToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null
  const date = new Date(localDateTimeString)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

const formatDateToLocalInput = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
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

const getCurrentPhilippineTime = () => new Date()
const addHoursToLocalDate = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)
const addDaysToLocalDate = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const allAssignments = computed(() => assignments.value)

const activeAssignments = computed(() => {
  const now = getCurrentPhilippineTime()
  return allAssignments.value.filter(a => new Date(a.dueDate) > now && a.isActive)
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
  const colors = { 'Active': 'success', 'Due Soon': 'warning', 'Overdue': 'error', 'Inactive': 'grey' }
  return colors[status] || 'primary'
}

const getAssignmentIcon = (assignment) => {
  const status = getAssignmentStatus(assignment)
  const icons = { 'Active': 'mdi-play-circle', 'Due Soon': 'mdi-clock-alert', 'Overdue': 'mdi-alert-circle', 'Inactive': 'mdi-pause-circle' }
  return icons[status] || 'mdi-format-list-checkbox'
}

const gradedCount = (assignment) => assignment.submissions?.filter(s => s.status === 'graded').length || 0
const pendingSubmissionsCount = (assignment) => assignment.submissions?.filter(s => s.status === 'submitted' || s.status === 'late').length || 0
const getGradingProgressColor = (ratio) => ratio >= 0.8 ? 'success' : ratio >= 0.5 ? 'warning' : 'error'
const truncateText = (text, length) => text && text.length > length ? text.substring(0, length) + '...' : text || ''

const loadAssignments = async () => {
  loading.value = true
  try {
    if (teacherStore.courses.length === 0) {
      await teacherStore.fetchMyCourses()
    }
    
    const allAssignmentsList = []
    for (const course of teacherStore.courses) {
      try {
        const response = await teacherService.getAssignments(course._id)
        const courseAssignments = response.data || []
        
        for (const assignment of courseAssignments) {
          try {
            const submissions = await teacherService.getAssignmentSubmissions(assignment._id)
            allAssignmentsList.push({ 
              ...assignment, 
              submissions: submissions || [],
              courseId: course 
            })
          } catch (err) {
            allAssignmentsList.push({ 
              ...assignment, 
              submissions: [],
              courseId: course 
            })
          }
        }
      } catch (error) {
        console.error(`Failed to load assignments for course ${course._id}:`, error)
      }
    }
    assignments.value = allAssignmentsList
    
    if (route.query.course) selectedCourseId.value = route.query.course
  } catch (error) {
    console.error('Failed to load assignments:', error)
    snackbar.value = { show: true, text: 'Failed to load assignments', color: 'error' }
  } finally {
    loading.value = false
  }
}

const removeExistingAttachment = (index) => {
  existingAttachments.value.splice(index, 1)
}

// FIXED: Added availableUntil to form data
const openCreateDialog = () => {
  editingAssignment.value = null
  const now = getCurrentPhilippineTime()
  const availableFrom = addHoursToLocalDate(now, 1)
  const dueDate = addDaysToLocalDate(availableFrom, 7)
  const availableUntil = addDaysToLocalDate(dueDate, 30)
  
  formData.value = {
    title: '', 
    description: '', 
    instructions: '', 
    courseId: selectedCourseId.value || teacherStore.courses[0]?._id || null,
    maxScore: 100, 
    passingScore: 60, 
    availableFrom: formatDateToLocalInput(availableFrom),
    dueDate: formatDateToLocalInput(dueDate), 
    availableUntil: formatDateToLocalInput(availableUntil),
    isActive: true,
    allowedFileTypes: '', 
    maxFileSize: null
  }
  attachmentFiles.value = []
  existingAttachments.value = []
  showAssignmentDialog.value = true
}

// FIXED: Added availableUntil handling
const editAssignment = (assignment) => {
  editingAssignment.value = assignment
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
    maxFileSize: assignment.maxFileSize ? assignment.maxFileSize / (1024 * 1024) : null
  }
  existingAttachments.value = assignment.attachments || []
  attachmentFiles.value = []
  showAssignmentDialog.value = true
}

// FIXED: Improved save function with better FormData handling
const saveAssignment = async () => {
  const isValid = await assignmentForm.value?.validate()
  if (!isValid) return
  
  saving.value = true
  try {
    const formDataToSend = new FormData()
    
    // Add basic fields
    formDataToSend.append('title', formData.value.title)
    formDataToSend.append('description', formData.value.description)
    formDataToSend.append('instructions', formData.value.instructions || '')
    formDataToSend.append('maxScore', formData.value.maxScore.toString())
    formDataToSend.append('passingScore', formData.value.passingScore.toString())
    formDataToSend.append('isActive', formData.value.isActive.toString())
    formDataToSend.append('availableFrom', localDateTimeToUTC(formData.value.availableFrom))
    formDataToSend.append('dueDate', localDateTimeToUTC(formData.value.dueDate))
    
    // Add availableUntil only if it has a value
    if (formData.value.availableUntil) {
      formDataToSend.append('availableUntil', localDateTimeToUTC(formData.value.availableUntil))
    }
    
    // Add allowed file types
    if (formData.value.allowedFileTypes) {
      const fileTypes = formData.value.allowedFileTypes.split(',').map(t => t.trim()).join(',')
      formDataToSend.append('allowedFileTypes', fileTypes)
    }
    
    // Add max file size
    if (formData.value.maxFileSize) {
      formDataToSend.append('maxFileSize', (formData.value.maxFileSize * 1024 * 1024).toString())
    }
    
    // Add new attachments
    attachmentFiles.value.forEach(file => {
      formDataToSend.append('attachments', file)
    })
    
    // For edit: specify which attachments to keep
    if (editingAssignment.value && existingAttachments.value.length > 0) {
      const keepAttachmentIds = existingAttachments.value.map(a => a.googleDriveFileId)
      formDataToSend.append('keepAttachments', JSON.stringify(keepAttachmentIds))
    } else if (editingAssignment.value && existingAttachments.value.length === 0) {
      // If no existing attachments, send empty array to remove all
      formDataToSend.append('keepAttachments', JSON.stringify([]))
    }
    
    if (editingAssignment.value) {
      await teacherService.updateAssignment(editingAssignment.value._id, formDataToSend)
      snackbar.value = { show: true, text: 'Assignment updated successfully!', color: 'success' }
    } else {
      await teacherService.createAssignment(formData.value.courseId, formDataToSend)
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
    const response = await teacherService.getGradingSummary(assignment._id)
    summaryAssignment.value = assignment
    // Fix: Extract the data from the response
    summaryData.value = response.data || response
    showSummaryDialog.value = true
  } catch (error) {
    console.error('Failed to load summary:', error)
    snackbar.value = { show: true, text: 'Failed to load summary', color: 'error' }
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
  attachmentFiles.value = []
  existingAttachments.value = []
  formValid.value = false
}

onMounted(() => {
  loadAssignments()
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

.assignment-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.assignment-card:hover {
  transform: translateX(4px);
}

.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.border-top {
  border-top: 1px solid #E2E8F0;
}

.calm-tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
}

.attachment-link {
  text-decoration: none;
  color: #1976d2;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  transition: background 0.2s;
}

.attachment-link:hover {
  background: #e3f2fd;
  text-decoration: underline;
}

.gap-2 {
  gap: 8px;
}
</style>