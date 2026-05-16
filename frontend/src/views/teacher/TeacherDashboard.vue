<!-- frontend/src/views/teacher/TeacherDashboard.vue -->
<template>
  <div class="teacher-dashboard">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-light mb-2">Dashboard</h1>
        <div class="section-underline"></div>
      </div>

      <!-- Stats Cards -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-book-open-variant" size="28" color="primary" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats?.totalCourses || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Total Courses</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-account-group" size="28" color="success" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats?.totalStudents || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Total Students</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-clock-alert" size="28" color="warning" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats?.pendingGrading || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Pending Grading</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-calendar-clock" size="28" color="info" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats?.upcomingDeadlines || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Upcoming Deadlines</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              Quick Actions
            </v-card-title>
            <v-card-text class="pa-3">
              <div class="d-flex flex-wrap gap-2">
                <v-btn color="primary" variant="text" @click="quickActions.createAssignment = true" rounded="pill">
                  <v-icon start icon="mdi-plus-circle" size="16"></v-icon>
                  Create Assignment
                </v-btn>
                <v-btn color="success" variant="text" @click="quickActions.postAnnouncement = true" rounded="pill">
                  <v-icon start icon="mdi-bullhorn" size="16"></v-icon>
                  Post Announcement
                </v-btn>
                <v-btn color="info" variant="text" to="/teacher/courses" rounded="pill">
                  <v-icon start icon="mdi-book" size="16"></v-icon>
                  View Courses
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- My Courses Section -->
      <div class="mt-6">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h2 class="text-h5 font-weight-light mb-2">My Courses</h2>
            <div class="section-underline-sm"></div>
          </div>
          <v-btn color="primary" variant="text" to="/teacher/courses" append-icon="mdi-arrow-right" rounded="pill">
            View All
          </v-btn>
        </div>

        <v-row>
          <v-col v-for="course in myCourses.slice(0, 3)" :key="course._id" cols="12" md="6" lg="4">
            <v-card variant="outlined" :loading="loading" class="course-card">
              <v-card-item class="pa-4">
                <template v-slot:prepend>
                  <v-avatar :color="getCourseColor(course.courseCode)" variant="tonal" rounded="lg" size="48">
                    <v-icon icon="mdi-book" size="24"></v-icon>
                  </v-avatar>
                </template>
                <v-card-title class="text-h6 font-weight-light pa-0 mb-1">{{ course.courseName }}</v-card-title>
                <v-card-subtitle class="pa-0 text-caption">{{ course.courseCode }}</v-card-subtitle>
              </v-card-item>

              <v-card-text class="pt-0 px-4 pb-0">
                <div class="d-flex ga-3 mb-2">
                  <div class="d-flex align-center">
                    <v-icon size="12" icon="mdi-account-group" class="me-1" color="grey-darken-1"></v-icon>
                    <span class="text-caption">{{ course.students?.length || 0 }} Students</span>
                  </div>
                  <div class="d-flex align-center">
                    <v-icon size="12" icon="mdi-file-document" class="me-1" color="grey-darken-1"></v-icon>
                    <span class="text-caption">{{ course.materials?.length || 0 }} Materials</span>
                  </div>
                </div>
                <p class="text-body-2 text-grey-darken-1">{{ truncateText(course.description, 80) }}</p>
              </v-card-text>

              <v-card-actions class="pa-3 pt-0">
                <v-btn color="primary" variant="text" size="small" :to="`/teacher/courses/${course._id}/materials`" rounded="pill">
                  <v-icon start icon="mdi-folder" size="14"></v-icon>
                  Materials
                </v-btn>
                <v-btn color="success" variant="text" size="small" :to="`/teacher/assignments?course=${course._id}`" rounded="pill">
                  <v-icon start icon="mdi-format-list-checkbox" size="14"></v-icon>
                  Tasks
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <v-col v-if="myCourses.length === 0 && !loading" cols="12">
            <v-card variant="outlined" class="text-center pa-8">
              <v-icon icon="mdi-information" size="48" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
              <div class="text-h6 font-weight-light text-grey-darken-1">No Courses Assigned</div>
              <div class="text-caption text-grey-darken-1 mt-1">You haven't been assigned to any courses yet</div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Recent Submissions & Announcements -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              <v-icon start icon="mdi-clock-alert" size="16"></v-icon>
              Recent Submissions
            </v-card-title>
            <v-list v-if="stats?.recentSubmissions?.length" class="calm-list">
              <v-list-item v-for="submission in stats.recentSubmissions.slice(0, 5)" :key="submission._id" class="calm-list-item">
                <template v-slot:prepend>
                  <v-avatar :color="submission.status === 'graded' ? 'success' : 'warning'" size="32" variant="tonal">
                    <v-icon :icon="submission.status === 'graded' ? 'mdi-check' : 'mdi-clock'" size="16"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">{{ submission.assignmentId?.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ submission.studentId?.firstName }} {{ submission.studentId?.lastName }}
                  • {{ formatRelativeTime(submission.submissionDate) }}
                  <v-chip v-if="submission.isLate" color="error" size="x-small" variant="tonal" class="ml-1">Late</v-chip>
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    v-if="submission.status !== 'graded'"
                    color="primary"
                    size="x-small"
                    variant="text"
                    :to="`/teacher/submissions/${submission._id}/grade`"
                    rounded="pill"
                  >
                    Grade
                  </v-btn>
                  <v-chip v-else color="success" size="x-small" variant="tonal">
                    {{ submission.grade?.score }}/{{ submission.assignmentId?.maxScore }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-6">
              <v-icon icon="mdi-check-circle" size="32" color="success" class="mb-2" opacity="0.5"></v-icon>
              <div class="text-caption text-grey-darken-1">No pending submissions!</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              <v-icon start icon="mdi-bullhorn" size="16"></v-icon>
              Recent Announcements
            </v-card-title>
            <v-list v-if="recentAnnouncements.length" class="calm-list">
              <v-list-item v-for="announcement in recentAnnouncements" :key="announcement._id" class="calm-list-item">
                <template v-slot:prepend>
                  <v-avatar color="info" size="32" variant="tonal">
                    <v-icon icon="mdi-message" size="16"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">{{ announcement.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ formatRelativeTime(announcement.createdAt) }}
                  <span v-if="announcement.courseId" class="text-grey-darken-1">
                    • {{ announcement.courseId.courseCode }}
                  </span>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-6">
              <v-icon icon="mdi-bullhorn-off" size="32" color="grey-lighten-1" class="mb-2" opacity="0.5"></v-icon>
              <div class="text-caption text-grey-darken-1">No recent announcements</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Quick Action Dialogs -->
    <v-dialog v-model="quickActions.createAssignment" max-width="800px" scrollable>
      <CreateAssignmentDialog 
        :course-id="myCourses[0]?._id" 
        @close="quickActions.createAssignment = false" 
        @created="onAssignmentCreated" 
      />
    </v-dialog>

    <v-dialog v-model="quickActions.postAnnouncement" max-width="600px" scrollable>
      <PostAnnouncementDialog 
        :course-id="myCourses[0]?._id" 
        @close="quickActions.postAnnouncement = false" 
        @posted="onAnnouncementPosted" 
      />
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
  const colors = ['primary', 'secondary', 'info', 'warning']
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
  if (diffMins < 60) return `${diffMins} min ago`
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
.section-underline {
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline:hover {
  width: 64px;
}

.section-underline-sm {
  width: 40px;
  height: 2px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline-sm:hover {
  width: 44px;
}

.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.stat-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.course-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.course-card:hover {
  transform: translateY(-2px);
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

.gap-2 {
  gap: 8px;
}
</style>