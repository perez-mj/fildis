<!-- frontend/src/views/student/StudentDashboard.vue -->
<template>
  <v-container fluid class="dashboard-container">
    <!-- Page Header -->
    <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-light">Dashboard</h1>
        <div class="header-accent"></div>
    </div>

    <!-- Stats Cards - Minimalist -->
    <v-row class="stats-row">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="primary">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="stat-value">{{ dashboardStats.enrolledCourses || 0 }}</div>
                <div class="stat-label">Enrolled Courses</div>
              </div>
              <v-icon size="36" color="primary" class="stat-icon">mdi-book-open-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="warning">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="stat-value">{{ dashboardStats.pendingAssignments || 0 }}</div>
                <div class="stat-label">Pending Tasks</div>
              </div>
              <v-icon size="36" color="warning" class="stat-icon">mdi-clipboard-list-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="success">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="stat-value">{{ gradeStats.totalGraded || 0 }}</div>
                <div class="stat-label">Completed Tasks</div>
              </div>
              <v-icon size="36" color="success" class="stat-icon">mdi-check-circle-outline</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="info">
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="stat-value">{{ gradeStats.overallPercentage || 0 }}%</div>
                <div class="stat-label">Overall Average</div>
              </div>
              <v-icon size="36" color="info" class="stat-icon">mdi-chart-line</v-icon>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Grid -->
    <v-row class="mt-2">
      <!-- Upcoming Deadlines -->
      <v-col cols="12" lg="6">
        <v-card class="section-card rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center pa-4">
            <div>
              <span class="text-h6 font-weight-light">Upcoming Deadlines</span>
              <div class="section-accent"></div>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'MyAssignments' }"
              append-icon="mdi-arrow-right"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-0">
            <div v-if="dashboardStats.upcomingDeadlines?.length" class="deadlines-list">
              <div
                v-for="deadline in dashboardStats.upcomingDeadlines.slice(0, 5)"
                :key="deadline._id"
                class="deadline-item"
                @click="navigateToAssignment(deadline._id)"
              >
                <div class="deadline-icon" :class="getDeadlineClass(deadline.dueDate)">
                  <v-icon size="20" :color="getDeadlineColor(deadline.dueDate)">mdi-calendar-clock</v-icon>
                </div>
                <div class="deadline-content">
                  <div class="deadline-title">{{ deadline.title }}</div>
                  <div class="deadline-course">{{ deadline.courseId?.courseCode }} • {{ deadline.courseId?.courseName }}</div>
                  <div class="deadline-date" :class="getDeadlineClass(deadline.dueDate)">
                    Due: {{ formatDate(deadline.dueDate) }}
                  </div>
                </div>
                <div class="deadline-badge">
                  <v-chip :color="getDeadlineChipColor(deadline.dueDate)" size="small" variant="light">
                    {{ getDaysRemaining(deadline.dueDate) }}
                  </v-chip>
                </div>
              </div>
            </div>
            <div v-else class="empty-state pa-8 text-center">
              <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-calendar-check</v-icon>
              <p class="text-body-2 text-medium-emphasis mb-0">No upcoming deadlines. Great job!</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Grades -->
      <v-col cols="12" lg="6">
        <v-card class="section-card rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center pa-4">
            <div>
              <span class="text-h6 font-weight-light">Recent Grades</span>
              <div class="section-accent"></div>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'MyGrades' }"
              append-icon="mdi-arrow-right"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-0">
            <div v-if="dashboardStats.recentGrades?.length" class="grades-list">
              <div
                v-for="grade in dashboardStats.recentGrades.slice(0, 5)"
                :key="grade._id"
                class="grade-item"
              >
                <div class="grade-icon" :class="getGradeClass(grade.grade?.score)">
                  <v-icon size="20" :color="getGradeColor(grade.grade?.score)">mdi-grade</v-icon>
                </div>
                <div class="grade-content">
                  <div class="grade-title">{{ grade.assignmentId?.title }}</div>
                  <div class="grade-course">{{ grade.assignmentId?.courseId?.courseName }}</div>
                  <div class="grade-score">
                    Score: {{ grade.grade?.score }}/{{ grade.assignmentId?.maxScore }}
                    ({{ getPercentage(grade.grade?.score, grade.assignmentId?.maxScore) }}%)
                  </div>
                </div>
                <div class="grade-badge">
                  <v-chip :color="getGradeColor(grade.grade?.score)" size="small" variant="light">
                    {{ grade.grade?.score >= (grade.assignmentId?.passingScore || 50) ? 'Passed' : 'Failed' }}
                  </v-chip>
                </div>
              </div>
            </div>
            <div v-else class="empty-state pa-8 text-center">
              <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-chart-line</v-icon>
              <p class="text-body-2 text-medium-emphasis mb-0">No grades available yet</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- My Courses Section -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card class="section-card rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center pa-4">
            <div>
              <span class="text-h6 font-weight-light">My Courses</span>
              <div class="section-accent"></div>
            </div>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'StudentCourses' }"
              append-icon="mdi-arrow-right"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
            <v-row v-if="enrolledCourses.length">
              <v-col
                v-for="course in enrolledCourses.slice(0, 4)"
                :key="course._id"
                cols="12"
                sm="6"
                lg="3"
              >
                <v-card
                  class="course-card rounded-xl"
                  elevation="0"
                  variant="outlined"
                  @click="navigateToCourse(course._id)"
                >
                  <div class="course-card-header" :style="{ backgroundImage: `linear-gradient(135deg, ${getCourseColor(course.courseCode)}20, transparent)` }">
                    <div class="course-avatar" :style="{ backgroundColor: getCourseColor(course.courseCode) + '15' }">
                      <span :style="{ color: getCourseColor(course.courseCode) }" class="course-initial">
                        {{ getCourseInitial(course.courseCode) }}
                      </span>
                    </div>
                    <v-chip size="x-small" variant="light" class="course-code-chip">
                      {{ course.courseCode }}
                    </v-chip>
                  </div>
                  <v-card-text class="pa-3">
                    <h3 class="text-subtitle-1 font-weight-medium mb-1 course-name">
                      {{ truncateText(course.courseName, 40) }}
                    </h3>
                    <div class="text-caption text-medium-emphasis mb-2">
                      {{ course.teacher?.firstName }} {{ course.teacher?.lastName }}
                    </div>
                    <div class="d-flex gap-2 text-caption text-medium-emphasis">
                      <span><v-icon size="12" class="mr-1">mdi-counter</v-icon>{{ course.credits }} credits</span>
                      <span><v-icon size="12" class="mr-1">mdi-domain</v-icon>{{ course.department }}</span>
                    </div>
                  </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions class="pa-2">
                    <v-btn variant="text" color="primary" size="small" block>
                      View Materials
                      <v-icon end size="16">mdi-chevron-right</v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <div v-else class="empty-state text-center pa-8">
              <v-icon size="56" color="grey-lighten-1" class="mb-4">mdi-book-open-page-variant</v-icon>
              <p class="text-body-1 text-medium-emphasis mb-2">No courses enrolled yet</p>
              <p class="text-caption text-medium-emphasis">Please contact your administrator for enrollment</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Overlay -->
    <v-overlay v-model="studentStore.loading" class="align-center justify-center" scrim="primary" opacity="0.1">
      <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useStudentStore } from '@/stores/studentStore'
import { useGradeStore } from '@/stores/gradeStore'
import { format } from 'date-fns'

const router = useRouter()
const authStore = useAuthStore()
const studentStore = useStudentStore()
const gradeStore = useGradeStore()

const enrolledCourses = ref([])
const dashboardStats = ref({
  enrolledCourses: 0,
  pendingAssignments: 0,
  upcomingDeadlines: [],
  recentGrades: []
})

const gradeStats = reactive({
  totalGraded: 0,
  averageGrade: 0,
  totalScore: 0,
  totalMaxScore: 0,
  overallPercentage: 0
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getDaysRemaining = (dueDate) => {
  if (!dueDate) return 'No due date'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  return `${days} days`
}

const getDeadlineColor = (dueDate) => {
  if (!dueDate) return 'grey'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return '#ef4444'
  if (days <= 2) return '#f59e0b'
  return '#6366f1'
}

const getDeadlineClass = (dueDate) => {
  if (!dueDate) return ''
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'deadline-overdue'
  if (days <= 2) return 'deadline-urgent'
  return ''
}

const getDeadlineChipColor = (dueDate) => {
  if (!dueDate) return 'grey'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'error'
  if (days <= 2) return 'warning'
  return 'success'
}

const getGradeColor = (score) => {
  if (!score) return '#94a3b8'
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

const getGradeClass = (score) => {
  if (!score) return ''
  if (score >= 90) return 'grade-excellent'
  if (score >= 75) return 'grade-good'
  if (score >= 60) return 'grade-average'
  return 'grade-poor'
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1)
}

const getCourseColor = (courseCode) => {
  const colors = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
  const index = courseCode ? courseCode.charCodeAt(0) % colors.length : 0
  return colors[index]
}

const getCourseInitial = (courseCode) => {
  return courseCode ? courseCode.charAt(0) : 'C'
}

const navigateToAssignment = (assignmentId) => {
  router.push({ name: 'SubmitAssignment', params: { assignmentId } })
}

const navigateToCourse = (courseId) => {
  router.push({ name: 'StudentCourseMaterials', params: { courseId } })
}

const loadDashboardData = async () => {
  try {
    enrolledCourses.value = await studentStore.fetchEnrolledCourses()
    const stats = await studentStore.fetchDashboardStats()
    dashboardStats.value = stats
    
    if (gradeStore && typeof gradeStore.fetchMyGrades === 'function') {
      const grades = await gradeStore.fetchMyGrades()
      if (grades && grades.statistics) {
        gradeStats.totalGraded = grades.statistics.totalGraded || 0
        gradeStats.averageGrade = grades.statistics.averageGrade || 0
        gradeStats.totalScore = grades.statistics.totalScore || 0
        gradeStats.totalMaxScore = grades.statistics.totalMaxScore || 0
        gradeStats.overallPercentage = grades.statistics.overallPercentage || 0
      } else if (gradeStore.summary) {
        gradeStats.totalGraded = gradeStore.summary.totalGraded || 0
        gradeStats.averageGrade = gradeStore.summary.averageGrade || 0
        gradeStats.overallPercentage = gradeStore.summary.overallPercentage || 0
      }
    }
  } catch (error) {
    console.error('Failed to load dashboard:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Welcome Section */
.welcome-section {
  margin-bottom: 8px;
}

.welcome-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

/* Stats Cards */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  transition: all 0.2s ease;
  border: none;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
}

.stat-icon {
  opacity: 0.6;
}

/* Section Cards */
.section-card {
  border: 1px solid #e2e8f0;
  transition: box-shadow 0.2s ease;
}

.section-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.section-accent {
  width: 40px;
  height: 2px;
  background: rgb(var(--v-theme-primary));
  border-radius: 2px;
  margin-top: 6px;
}

/* Deadlines List */
.deadlines-list {
  display: flex;
  flex-direction: column;
}

.deadline-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.deadline-item:hover {
  background-color: #f8fafc;
}

.deadline-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.deadline-icon.deadline-overdue {
  background-color: #fef2f2;
}

.deadline-icon.deadline-urgent {
  background-color: #fffbeb;
}

.deadline-content {
  flex: 1;
}

.deadline-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.deadline-course {
  font-size: 0.75rem;
  color: #64748b;
}

.deadline-date {
  font-size: 0.7rem;
  margin-top: 4px;
}

.deadline-date.deadline-overdue {
  color: #ef4444;
}

.deadline-date.deadline-urgent {
  color: #f59e0b;
}

.deadline-badge {
  flex-shrink: 0;
}

/* Grades List */
.grades-list {
  display: flex;
  flex-direction: column;
}

.grade-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.grade-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  flex-shrink: 0;
}

.grade-icon.grade-excellent {
  background-color: #ecfdf5;
}

.grade-icon.grade-good {
  background-color: #eff6ff;
}

.grade-icon.grade-average {
  background-color: #fffbeb;
}

.grade-icon.grade-poor {
  background-color: #fef2f2;
}

.grade-content {
  flex: 1;
}

.grade-title {
  font-weight: 500;
  font-size: 0.9rem;
  margin-bottom: 2px;
}

.grade-course {
  font-size: 0.75rem;
  color: #64748b;
}

.grade-score {
  font-size: 0.7rem;
  margin-top: 4px;
}

.grade-badge {
  flex-shrink: 0;
}

/* Course Cards */
.course-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: transparent;
}

.course-card-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-avatar {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-initial {
  font-size: 24px;
  font-weight: 600;
}

.course-code-chip {
  background: rgba(0, 0, 0, 0.05);
}

.course-name {
  line-height: 1.3;
}

.header-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

/* Empty State */
.empty-state {
  text-align: center;
}

/* Gap Utility */
.gap-2 {
  gap: 8px;
}

/* Responsive */
@media (max-width: 600px) {
  .stat-value {
    font-size: 1.5rem;
  }
  
  .deadline-item, .grade-item {
    padding: 10px 12px;
  }
  
  .deadline-icon, .grade-icon {
    width: 32px;
    height: 32px;
  }
  
  .course-avatar {
    width: 40px;
    height: 40px;
  }
  
  .course-initial {
    font-size: 20px;
  }
}
</style>