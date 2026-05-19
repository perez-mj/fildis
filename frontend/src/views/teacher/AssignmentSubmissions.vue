<!-- frontend/src/views/teacher/AssignmentSubmissions.vue -->
<template>
  <div class="assignment-submissions">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header with accent underline -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="$router.back()"
              class="mr-3"
              color="primary"
            ></v-btn>
            <div>
              <div class="text-overline text-grey-darken-1">Assignment Submissions</div>
              <h1 class="text-h4 font-weight-light mb-2">{{ assignment?.title || 'Loading...' }}</h1>
              <div class="section-underline"></div>
              <div class="text-subtitle-1 text-grey-darken-1 mt-2">{{ getCourseName() }}</div>
            </div>
          </div>
          <div class="d-flex ga-2 mt-3 mt-sm-0">
            <v-chip color="primary" variant="tonal" size="small">
              <v-icon start icon="mdi-star" size="14"></v-icon>
              Max Score: {{ assignment?.maxScore || 0 }}
            </v-chip>
            <v-chip :color="getDueDateColor()" variant="tonal" size="small">
              <v-icon start icon="mdi-calendar" size="14"></v-icon>
              Due: {{ formatDateTime(assignment?.dueDate) }}
            </v-chip>
          </div>
        </div>
      </div>

      <!-- Stats Cards - Minimalist with outlines -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-4 calm-stat-card">
            <v-icon icon="mdi-file-document" size="28" color="primary" class="mb-2"></v-icon>
            <div class="text-h5 font-weight-light mt-1">{{ submissions.length }}</div>
            <div class="text-caption text-grey-darken-1">Total Submissions</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-4 calm-stat-card">
            <v-icon icon="mdi-clock" size="28" color="warning" class="mb-2"></v-icon>
            <div class="text-h5 font-weight-light mt-1">{{ pendingSubmissions.length }}</div>
            <div class="text-caption text-grey-darken-1">Pending Grading</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-4 calm-stat-card">
            <v-icon icon="mdi-check-circle" size="28" color="success" class="mb-2"></v-icon>
            <div class="text-h5 font-weight-light mt-1">{{ gradedSubmissions.length }}</div>
            <div class="text-caption text-grey-darken-1">Graded</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="text-center pa-4 calm-stat-card">
            <v-icon icon="mdi-alert-circle" size="28" color="error" class="mb-2"></v-icon>
            <div class="text-h5 font-weight-light mt-1">{{ lateSubmissions.length }}</div>
            <div class="text-caption text-grey-darken-1">Late Submissions</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-row class="mb-4">
        <v-col cols="12" md="4">
          <v-select
            v-model="statusFilter"
            :items="statusFilters"
            label="Filter by Status"
            prepend-inner-icon="mdi-filter"
            density="comfortable"
            clearable
            variant="outlined"
          ></v-select>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchQuery"
            label="Search by Student Name"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            clearable
            variant="outlined"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="d-flex justify-md-end">
          <v-btn color="primary" variant="outlined" @click="exportSubmissions" prepend-icon="mdi-download" rounded="pill">
            Export to CSV
          </v-btn>
        </v-col>
      </v-row>

      <!-- Submissions Table -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined" class="calm-table-card">
            <v-data-table
              :headers="headers"
              :items="filteredSubmissions"
              :loading="loading"
              :items-per-page="10"
              hover
              class="calm-data-table"
            >
              <template v-slot:item.student="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="32" class="mr-2" :color="getAvatarColor(item.studentId?.firstName)" variant="tonal">
                    <span class="text-caption font-weight-medium">{{ getInitials(item.studentId) }}</span>
                  </v-avatar>
                  <div>
                    <div class="text-body-2">{{ item.studentId?.firstName }} {{ item.studentId?.lastName }}</div>
                    <div class="text-caption text-grey-darken-1">{{ item.studentId?.studentId }}</div>
                  </div>
                </div>
              </template>

              <template v-slot:item.submissionDate="{ item }">
                <div>
                  <div class="text-body-2">{{ formatDateTime(item.submissionDate) }}</div>
                  <v-chip v-if="item.isLate" color="error" size="x-small" variant="tonal" class="mt-1">
                    Late
                  </v-chip>
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small" variant="tonal">
                  {{ item.status?.toUpperCase() || 'SUBMITTED' }}
                </v-chip>
              </template>

              <template v-slot:item.files="{ item }">
                <v-btn
                  v-if="item.submittedFiles?.length"
                  size="small"
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-paperclip"
                  @click="viewFiles(item)"
                  rounded="pill"
                >
                  {{ item.submittedFiles.length }} file(s)
                </v-btn>
                <span v-else class="text-caption text-grey-darken-1">No files</span>
              </template>

              <template v-slot:item.grade="{ item }">
                <div v-if="item.grade">
                  <div class="font-weight-medium">{{ item.grade.score }}/{{ assignment?.maxScore }}</div>
                  <div class="text-caption text-grey-darken-1">{{ truncateText(item.grade.feedback, 30) }}</div>
                </div>
                <span v-else class="text-caption text-grey-darken-1">—</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  :to="`/teacher/submissions/${item._id}/grade`"
                  :prepend-icon="item.status === 'graded' ? 'mdi-pencil' : 'mdi-check-circle'"
                  rounded="pill"
                >
                  {{ item.status === 'graded' ? 'Regrade' : 'Grade' }}
                </v-btn>
              </template>

              <template v-slot:loading>
                <div class="text-center pa-4">
                  <div class="calm-loading-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>
              </template>

              <template v-slot:no-data>
                <div class="text-center pa-8">
                  <v-icon icon="mdi-inbox" size="48" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
                  <div class="text-h6 font-weight-light text-grey-darken-1">No submissions yet</div>
                  <div class="text-caption text-grey-darken-1 mt-1">Students will appear here once they submit</div>
                </div>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- View Files Dialog - Minimalist -->
    <v-dialog v-model="showFilesDialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-light">Submitted Files</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="showFilesDialog = false"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <div class="mb-3 text-caption text-grey-darken-1">
            <strong>Student:</strong> {{ currentFilesSubmission?.studentId?.firstName }} {{ currentFilesSubmission?.studentId?.lastName }}
          </div>
          <v-list class="calm-list">
            <v-list-item v-for="(file, index) in currentFiles" :key="index" class="calm-list-item">
              <template v-slot:prepend>
                <v-icon :icon="getFileIcon(file.fileType)" color="primary" size="24"></v-icon>
              </template>
              <v-list-item-title class="text-body-2">{{ file.originalFileName }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ formatFileSize(file.fileSize) }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn size="small" variant="text" color="primary" :href="file.webViewLink" target="_blank" rounded="pill">
                  View
                </v-btn>
                <v-btn size="small" variant="text" color="success" :href="file.webContentLink" download rounded="pill">
                  Download
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
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
const assignment = ref(null)
const submissions = ref([])
const statusFilter = ref(null)
const searchQuery = ref('')
const showFilesDialog = ref(false)
const currentFilesSubmission = ref(null)

const statusFilters = [
  { title: 'All', value: null },
  { title: 'Pending Grading', value: 'pending' },
  { title: 'Graded', value: 'graded' },
  { title: 'Submitted', value: 'submitted' },
  { title: 'Late', value: 'late' }
]

const headers = [
  { title: 'Student', key: 'student', sortable: true },
  { title: 'Submission Date', key: 'submissionDate', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Files', key: 'files', sortable: false },
  { title: 'Grade', key: 'grade', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const pendingSubmissions = computed(() => {
  return submissions.value.filter(s => s.status === 'submitted' || s.status === 'late')
})

const gradedSubmissions = computed(() => {
  return submissions.value.filter(s => s.status === 'graded')
})

const lateSubmissions = computed(() => {
  return submissions.value.filter(s => s.isLate)
})

const filteredSubmissions = computed(() => {
  let filtered = submissions.value
  
  if (statusFilter.value === 'pending') {
    filtered = filtered.filter(s => s.status === 'submitted' || s.status === 'late')
  } else if (statusFilter.value === 'graded') {
    filtered = filtered.filter(s => s.status === 'graded')
  } else if (statusFilter.value === 'submitted') {
    filtered = filtered.filter(s => s.status === 'submitted')
  } else if (statusFilter.value === 'late') {
    filtered = filtered.filter(s => s.isLate)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(s => 
      s.studentId?.firstName?.toLowerCase().includes(query) ||
      s.studentId?.lastName?.toLowerCase().includes(query) ||
      `${s.studentId?.firstName} ${s.studentId?.lastName}`.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const currentFiles = computed(() => {
  return currentFilesSubmission.value?.submittedFiles || []
})

const getCourseName = () => {
  const course = teacherStore.courses.find(c => c._id === assignment.value?.courseId)
  return course ? `${course.courseCode} - ${course.courseName}` : 'Unknown Course'
}

const getDueDateColor = () => {
  if (!assignment.value?.dueDate) return 'grey'
  const dueDate = new Date(assignment.value.dueDate)
  const now = new Date()
  if (dueDate < now) return 'error'
  const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) return 'warning'
  return 'success'
}

const getStatusColor = (status) => {
  const colors = {
    submitted: 'warning',
    late: 'error',
    graded: 'success',
    returned: 'info'
  }
  return colors[status] || 'grey'
}

const getAvatarColor = (name) => {
  const colors = ['primary', 'secondary', 'info', 'warning']
  const index = name?.charCodeAt(0) || 0
  return colors[index % colors.length]
}

const getInitials = (user) => {
  if (!user) return '?'
  return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`
}

const getFileIcon = (fileType) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    jpg: 'mdi-file-image-box',
    png: 'mdi-file-image-box',
    zip: 'mdi-folder-zip'
  }
  return icons[fileType] || 'mdi-file'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
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

const viewFiles = (submission) => {
  currentFilesSubmission.value = submission
  showFilesDialog.value = true
}

const exportSubmissions = () => {
  if (filteredSubmissions.value.length === 0) {
    snackbar.value = { show: true, text: 'No submissions to export', color: 'warning' }
    return
  }
  
  const csvData = filteredSubmissions.value.map(s => ({
    'Student Name': `${s.studentId?.firstName} ${s.studentId?.lastName}`,
    'Student ID': s.studentId?.studentId,
    'Email': s.studentId?.email,
    'Submission Date': formatDateTime(s.submissionDate),
    'Status': s.status?.toUpperCase() || 'SUBMITTED',
    'Late': s.isLate ? 'Yes' : 'No',
    'Score': s.grade?.score || 'Not graded',
    'Feedback': s.grade?.feedback || 'No feedback'
  }))
  
  const csv = convertToCSV(csvData)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${assignment.value?.title || 'assignment'}_submissions.csv`
  a.click()
  window.URL.revokeObjectURL(url)
  
  snackbar.value = { show: true, text: 'Export started!', color: 'success' }
}

const convertToCSV = (data) => {
  if (data.length === 0) return ''
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header] || ''
      return `"${String(val).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

const loadData = async () => {
  const assignmentId = route.params.assignmentId
  
  if (!assignmentId) {
    console.error('No assignment ID provided')
    snackbar.value = { 
      show: true, 
      text: 'Invalid assignment ID', 
      color: 'error' 
    }
    return
  }
  
  loading.value = true
  try {
    if (teacherStore.courses.length === 0) {
      await teacherStore.fetchMyCourses()
    }
    
    for (const course of teacherStore.courses) {
      const foundAssignment = course.assignments?.find(a => a._id === assignmentId)
      if (foundAssignment) {
        assignment.value = foundAssignment
        break
      }
    }
    
    if (!assignment.value) {
      throw new Error('Assignment not found')
    }
    
    const submissionsData = await teacherService.getAssignmentSubmissions(assignmentId)
    submissions.value = submissionsData || []
    
  } catch (error) {
    console.error('Failed to load submissions:', error)
    snackbar.value = { 
      show: true, 
      text: error.message || 'Failed to load submissions', 
      color: 'error' 
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
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

.calm-stat-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.calm-stat-card:hover {
  transform: translateY(-2px);
}

.calm-table-card {
  overflow: hidden;
}

.calm-list {
  background: transparent;
}

.calm-list-item {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.calm-list-item:hover {
  transform: translateX(4px);
}

.calm-loading-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.calm-loading-dots .dot {
  width: 8px;
  height: 8px;
  background-color: rgb(var(--v-theme-primary));
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.calm-loading-dots .dot:nth-child(1) { animation-delay: -0.32s; }
.calm-loading-dots .dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
  40% { transform: scale(1); opacity: 1; }
}

:deep(.calm-data-table .v-data-table__th) {
  font-weight: 500;
  color: #64748B;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

:deep(.calm-data-table tr:hover) {
  background-color: rgba(99, 102, 241, 0.04);
}
</style>