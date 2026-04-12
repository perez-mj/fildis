<!-- frontend/src/views/teacher/TeacherDashboard.vue -->
<template>
  <div class="teacher-dashboard">
    <v-container fluid>

      <!-- Stats Cards -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card :loading="loading" class="text-center pa-4" color="info" variant="tonal" hover>
            <v-icon size="48" icon="mdi-book-open-variant" color="info"></v-icon>
            <h3 class="text-h4 mt-2 font-weight-bold">{{ stats?.totalCourses || 0 }}</h3>
            <p class="text-subtitle-1 mb-0 text-medium-emphasis">Total Courses</p>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card :loading="loading" class="text-center pa-4" color="success" variant="tonal" hover>
            <v-icon size="48" icon="mdi-account-group" color="success"></v-icon>
            <h3 class="text-h4 mt-2 font-weight-bold">{{ stats?.totalStudents || 0 }}</h3>
            <p class="text-subtitle-1 mb-0 text-medium-emphasis">Total Students</p>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card :loading="loading" class="text-center pa-4" color="warning" variant="tonal" hover>
            <v-icon size="48" icon="mdi-clock-alert" color="warning"></v-icon>
            <h3 class="text-h4 mt-2 font-weight-bold">{{ stats?.pendingGrading || 0 }}</h3>
            <p class="text-subtitle-1 mb-0 text-medium-emphasis">Pending Grading</p>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card :loading="loading" class="text-center pa-4" color="error" variant="tonal" hover>
            <v-icon size="48" icon="mdi-calendar-clock" color="error"></v-icon>
            <h3 class="text-h4 mt-2 font-weight-bold">{{ stats?.upcomingDeadlines || 0 }}</h3>
            <p class="text-subtitle-1 mb-0 text-medium-emphasis">Upcoming Deadlines</p>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">Quick Actions</v-card-title>
            <v-card-text>
              <v-btn-group divided>
                <v-btn color="primary" variant="text" @click="quickActions.createAssignment = true">
                  <v-icon start icon="mdi-plus-circle"></v-icon>
                  Create Assignment
                </v-btn>
                <v-btn color="success" variant="text" @click="quickActions.postAnnouncement = true">
                  <v-icon start icon="mdi-bullhorn"></v-icon>
                  Post Announcement
                </v-btn>
                <v-btn color="info" variant="text" to="/teacher/courses">
                  <v-icon start icon="mdi-book"></v-icon>
                  View Courses
                </v-btn>
              </v-btn-group>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- My Courses Section -->
      <v-row class="mt-4">
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
            <h2 class="text-h5 font-weight-bold">My Courses</h2>
            <v-btn color="primary" variant="text" to="/teacher/courses" prepend-icon="mdi-arrow-right">
              View All Courses
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="course in myCourses.slice(0, 3)" :key="course._id" cols="12" md="6" lg="4">
          <v-card :loading="loading" hover class="course-card" elevation="2">
            <v-card-item>
              <template v-slot:prepend>
                <v-avatar :color="getCourseColor(course.courseCode)" variant="flat" rounded="lg">
                  <v-icon icon="mdi-book"></v-icon>
                </v-avatar>
              </template>
              <v-card-title class="text-h6">{{ course.courseName }}</v-card-title>
              <v-card-subtitle>{{ course.courseCode }}</v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <div class="d-flex ga-4 mb-3 flex-wrap">
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-account-group" class="me-1"></v-icon>
                  <span class="text-body-2">{{ course.students?.length || 0 }} Students</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-file-document" class="me-1"></v-icon>
                  <span class="text-body-2">{{ course.materials?.length || 0 }} Materials</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-format-list-checkbox" class="me-1"></v-icon>
                  <span class="text-body-2">{{ course.assignments?.length || 0 }} Assignments</span>
                </div>
              </div>
              <p class="text-body-2 text-medium-emphasis">{{ truncateText(course.description, 100) }}</p>
            </v-card-text>

            <v-card-actions class="pt-0">
              <v-btn color="primary" variant="text" size="small" :to="`/teacher/courses/${course._id}/materials`">
                <v-icon start icon="mdi-folder" size="small"></v-icon>
                Materials
              </v-btn>
              <v-btn color="success" variant="text" size="small" :to="`/teacher/assignments?course=${course._id}`">
                <v-icon start icon="mdi-format-list-checkbox" size="small"></v-icon>
                Assignments
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col v-if="myCourses.length === 0 && !loading" cols="12">
          <v-alert type="info" variant="tonal" class="text-center">
            <v-icon icon="mdi-information" size="large" class="mb-2"></v-icon>
            <h3 class="text-h6">No Courses Assigned</h3>
            <p class="mb-0">You haven't been assigned to any courses yet. Contact the administrator.</p>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Recent Submissions & Announcements -->
      <v-row class="mt-4">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon start icon="mdi-clock-alert"></v-icon>
              Recent Submissions
            </v-card-title>
            <v-divider></v-divider>
            <v-list v-if="stats?.recentSubmissions?.length" lines="two">
              <v-list-item v-for="submission in stats.recentSubmissions.slice(0, 5)" :key="submission._id">
                <template v-slot:prepend>
                  <v-avatar :color="submission.status === 'graded' ? 'success' : 'warning'" size="36">
                    <v-icon :icon="submission.status === 'graded' ? 'mdi-check' : 'mdi-clock'"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ submission.assignmentId?.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ submission.studentId?.firstName }} {{ submission.studentId?.lastName }}
                  • {{ formatRelativeTime(submission.submissionDate) }}
                  <v-chip v-if="submission.isLate" color="error" size="x-small" class="ml-2">Late</v-chip>
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    v-if="submission.status !== 'graded'"
                    color="primary"
                    size="small"
                    variant="text"
                    :to="`/teacher/submissions/${submission._id}/grade`"
                  >
                    Grade
                  </v-btn>
                  <v-chip v-else color="success" size="small">
                    {{ submission.grade?.score }}/{{ submission.assignmentId?.maxScore }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-8">
              <v-icon icon="mdi-check-circle" size="48" color="success" class="mb-2"></v-icon>
              <p class="mb-0">No pending submissions!</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="text-h6 d-flex align-center">
              <v-icon start icon="mdi-bullhorn"></v-icon>
              Recent Announcements
            </v-card-title>
            <v-divider></v-divider>
            <v-list v-if="recentAnnouncements.length" lines="two">
              <v-list-item v-for="announcement in recentAnnouncements" :key="announcement._id">
                <template v-slot:prepend>
                  <v-avatar color="info" size="36">
                    <v-icon icon="mdi-message"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ announcement.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatRelativeTime(announcement.createdAt) }}
                  <span v-if="announcement.courseId" class="text-caption">
                    • {{ announcement.courseId.courseCode }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-8">
              <v-icon icon="mdi-bullhorn-off" size="48" color="grey" class="mb-2"></v-icon>
              <p class="mb-0">No recent announcements</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Quick Action Dialogs -->
    <v-dialog v-model="quickActions.createAssignment" max-width="800px">
      <CreateAssignmentDialog :course-id="myCourses[0]?._id" @close="quickActions.createAssignment = false" @created="onAssignmentCreated" />
    </v-dialog>

    <v-dialog v-model="quickActions.postAnnouncement" max-width="600px">
      <PostAnnouncementDialog :course-id="myCourses[0]?._id" @close="quickActions.postAnnouncement = false" @posted="onAnnouncementPosted" />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherStore } from '@/stores/teacherStore'
import CreateAssignmentDialog from '@/components/teacher/CreateAssignmentDialog.vue'
import PostAnnouncementDialog from '@/components/teacher/PostAnnouncementDialog.vue'

const authStore = useAuthStore()
const teacherStore = useTeacherStore()

const loading = ref(false)
const recentAnnouncements = ref([])

const quickActions = ref({
  createAssignment: false,
  postAnnouncement: false
})

const stats = computed(() => teacherStore.stats)
const myCourses = computed(() => teacherStore.courses)

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getCourseColor = (code) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error']
  const index = code?.charCodeAt(0) || 0
  return colors[index % colors.length]
}

const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const loadAnnouncements = async () => {
  try {
    const { default: teacherService } = await import('@/services/teacherService')
    const announcements = await teacherService.getMyAnnouncements()
    recentAnnouncements.value = announcements.slice(0, 5)
  } catch (error) {
    console.error('Failed to load announcements:', error)
  }
}

const onAssignmentCreated = () => {
  quickActions.value.createAssignment = false
  teacherStore.fetchStats()
}

const onAnnouncementPosted = () => {
  quickActions.value.postAnnouncement = false
  loadAnnouncements()
}

const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      teacherStore.fetchStats(),
      teacherStore.fetchMyCourses(),
      loadAnnouncements()
    ])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.course-card {
  transition: all 0.3s ease;
  height: 100%;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
</style>