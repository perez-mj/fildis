<!-- frontend/src/views/teacher/AssignmentSubmissions.vue -->
 <template>
  <div class="assignment-submissions">
    <v-container fluid>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between flex-wrap">
                <div class="d-flex align-center">
                  <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    @click="$router.back()"
                    class="mr-3"
                  ></v-btn>
                  <div>
                    <div class="text-overline">Assignment Submissions</div>
                    <h1 class="text-h4">{{ assignment?.title }}</h1>
                    <div class="text-subtitle-1">{{ getCourseName() }}</div>
                  </div>
                </div>
                <div class="d-flex ga-2 mt-2 mt-sm-0">
                  <v-chip color="info" variant="flat">
                    <v-icon start icon="mdi-star" size="small"></v-icon>
                    Max Score: {{ assignment?.maxScore }}
                  </v-chip>
                  <v-chip :color="getDueDateColor()" variant="flat">
                    <v-icon start icon="mdi-calendar" size="small"></v-icon>
                    Due: {{ formatDateTime(assignment?.dueDate) }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Stats Cards -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="text-center pa-3" color="info" variant="tonal">
            <v-icon icon="mdi-file-document" size="32"></v-icon>
            <div class="text-h5 font-weight-bold mt-1">{{ submissions.length }}</div>
            <div class="text-caption">Total Submissions</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="text-center pa-3" color="warning" variant="tonal">
            <v-icon icon="mdi-clock" size="32"></v-icon>
            <div class="text-h5 font-weight-bold mt-1">{{ pendingSubmissions.length }}</div>
            <div class="text-caption">Pending Grading</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="text-center pa-3" color="success" variant="tonal">
            <v-icon icon="mdi-check-circle" size="32"></v-icon>
            <div class="text-h5 font-weight-bold mt-1">{{ gradedSubmissions.length }}</div>
            <div class="text-caption">Graded</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="text-center pa-3" color="error" variant="tonal">
            <v-icon icon="mdi-alert-circle" size="32"></v-icon>
            <div class="text-h5 font-weight-bold mt-1">{{ lateSubmissions.length }}</div>
            <div class="text-caption">Late Submissions</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-row class="mt-2">
        <v-col cols="12" md="4">
          <v-select
            v-model="statusFilter"
            :items="statusFilters"
            label="Filter by Status"
            prepend-inner-icon="mdi-filter"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-select>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="searchQuery"
            label="Search by Student Name"
            prepend-inner-icon="mdi-magnify"
            density="comfortable"
            variant="outlined"
            clearable
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="d-flex justify-end">
          <v-btn color="primary" variant="outlined" @click="exportSubmissions" prepend-icon="mdi-download">
            Export to CSV
          </v-btn>
        </v-col>
      </v-row>

      <!-- Submissions Table -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-data-table
              :headers="headers"
              :items="filteredSubmissions"
              :loading="loading"
              :items-per-page="10"
              hover
              class="elevation-1"
            >
              <template v-slot:item.student="{ item }">
                <div class="d-flex align-center">
                  <v-avatar size="32" class="mr-2" :color="getAvatarColor(item.studentId?.firstName)">
                    <span class="text-caption">{{ getInitials(item.studentId) }}</span>
                  </v-avatar>
                  <div>
                    <div>{{ item.studentId?.firstName }} {{ item.studentId?.lastName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.studentId?.studentId }}</div>
                  </div>
                </div>
              </template>

              <template v-slot:item.submissionDate="{ item }">
                <div>
                  <div>{{ formatDateTime(item.submissionDate) }}</div>
                  <v-chip v-if="item.isLate" color="error" size="x-small" class="mt-1">
                    Late
                  </v-chip>
                </div>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small">
                  {{ item.status.toUpperCase() }}
                </v-chip>
              </template>

              <template v-slot:item.files="{ item }">
                <v-btn
                  v-if="item.submittedFiles?.length"
                  size="small"
                  variant="text"
                  color="info"
                  prepend-icon="mdi-paperclip"
                  @click="viewFiles(item)"
                >
                  {{ item.submittedFiles.length }} file(s)
                </v-btn>
                <span v-else class="text-caption text-medium-emphasis">No files</span>
              </template>

              <template v-slot:item.grade="{ item }">
                <div v-if="item.grade">
                  <div class="font-weight-bold">{{ item.grade.score }}/{{ assignment?.maxScore }}</div>
                  <div class="text-caption text-medium-emphasis">{{ item.grade.feedback?.substring(0, 30) }}...</div>
                </div>
                <span v-else class="text-caption text-medium-emphasis">Not graded</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status !== 'graded'"
                  color="primary"
                  size="small"
                  variant="text"
                  :to="`/teacher/submissions/${item._id}/grade`"
                  prepend-icon="mdi-check-circle"
                >
                  Grade
                </v-btn>
                <v-btn
                  v-else
                  color="warning"
                  size="small"
                  variant="text"
                  :to="`/teacher/submissions/${item._id}/grade`"
                  prepend-icon="mdi-pencil"
                >
                  Regrade
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- View Files Dialog -->
    <v-dialog v-model="showFilesDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-info">
          <span class="text-white">Submitted Files</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showFilesDialog = false" color="white"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="mb-3">
            <strong>Student:</strong> {{ currentFilesSubmission?.studentId?.firstName }} {{ currentFilesSubmission?.studentId?.lastName }}
          </div>
          <v-list>
            <v-list-item v-for="(file, index) in currentFiles" :key="index">
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
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'

const route = useRoute()
const teacherStore = useTeacherStore()

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
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
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

const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-US', {
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
  const csvData = filteredSubmissions.value.map(s => ({
    'Student Name': `${s.studentId?.firstName} ${s.studentId?.lastName}`,
    'Student ID': s.studentId?.studentId,
    'Submission Date': formatDateTime(s.submissionDate),
    'Status': s.status.toUpperCase(),
    'Late': s.isLate ? 'Yes' : 'No',
    'Score': s.grade?.score || 'Not graded',
    'Feedback': s.grade?.feedback || 'No feedback'
  }))
  
  const csv = convertToCSV(csvData)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${assignment.value?.title}_submissions.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const convertToCSV = (data) => {
  const headers = Object.keys(data[0])
  const csvRows = [headers.join(',')]
  
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header]
      return `"${String(val).replace(/"/g, '""')}"`
    })
    csvRows.push(values.join(','))
  }
  
  return csvRows.join('\n')
}

const loadData = async () => {
  const assignmentId = route.params.assignmentId
  loading.value = true
  try {
    // Find assignment in teacherStore courses
    for (const course of teacherStore.courses) {
      const assignmentData = course.assignments?.find(a => a._id === assignmentId)
      if (assignmentData) {
        assignment.value = assignmentData
        break
      }
    }
    
    const submissionsData = await teacherService.getAssignmentSubmissions(assignmentId)
    submissions.value = submissionsData
  } catch (error) {
    console.error('Failed to load submissions:', error)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (teacherStore.courses.length === 0) {
    await teacherStore.fetchMyCourses()
  }
  await loadData()
})
</script>