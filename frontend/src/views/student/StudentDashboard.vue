<!-- frontend/src/views/student/StudentDashboard.vue -->
<template>
  <v-container fluid>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" md="6" lg="3">
        <v-card class="rounded-lg" elevation="2" color="primary" variant="tonal">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ dashboardStats.enrolledCourses || 0 }}
                </div>
                <div class="text-subtitle-2">Enrolled Courses</div>
              </div>
              <v-icon size="40" color="primary">mdi-book-open-variant</v-icon>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="rounded-lg" elevation="2" color="warning" variant="tonal">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ dashboardStats.pendingAssignments || 0 }}
                </div>
                <div class="text-subtitle-2">Pending Assignments</div>
              </div>
              <v-icon size="40" color="warning">mdi-clipboard-list</v-icon>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="rounded-lg" elevation="2" color="success" variant="tonal">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ gradeStats.totalGraded || 0 }}
                </div>
                <div class="text-subtitle-2">Graded Assignments</div>
              </div>
              <v-icon size="40" color="success">mdi-chart-line</v-icon>
            </div>
          </v-card-item>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="3">
        <v-card class="rounded-lg" elevation="2" color="info" variant="tonal">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h5 font-weight-bold">
                  {{ gradeStats.overallPercentage || 0 }}%
                </div>
                <div class="text-subtitle-2">Overall Average</div>
              </div>
              <v-icon size="40" color="info">mdi-percent</v-icon>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row class="mt-2">
      <!-- Upcoming Deadlines -->
      <v-col cols="12" lg="6">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">Upcoming Deadlines</span>
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'MyAssignments' }"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list v-if="dashboardStats.upcomingDeadlines?.length" lines="two">
              <v-list-item
                v-for="deadline in dashboardStats.upcomingDeadlines.slice(0, 5)"
                :key="deadline._id"
                :to="{ name: 'SubmitAssignment', params: { assignmentId: deadline._id } }"
                class="mb-2 rounded-lg"
                border
              >
                <template v-slot:prepend>
                  <v-icon :color="getDeadlineColor(deadline.dueDate)" size="32">
                    mdi-calendar-clock
                  </v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ deadline.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ deadline.courseId?.courseCode }} - {{ deadline.courseId?.courseName }}
                  <br>
                  Due: {{ formatDate(deadline.dueDate) }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip :color="getDeadlineChipColor(deadline.dueDate)" size="small">
                    {{ getDaysRemaining(deadline.dueDate) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal" class="mt-2">
              No upcoming deadlines. Great job staying on top of your work!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Grades -->
      <v-col cols="12" lg="6">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">Recent Grades</span>
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'MyGrades' }"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-list v-if="dashboardStats.recentGrades?.length" lines="two">
              <v-list-item
                v-for="grade in dashboardStats.recentGrades.slice(0, 5)"
                :key="grade._id"
                class="mb-2 rounded-lg"
                border
              >
                <template v-slot:prepend>
                  <v-icon :color="getGradeColor(grade.grade?.score)" size="32">
                    mdi-grade
                  </v-icon>
                </template>
                <v-list-item-title class="font-weight-medium">
                  {{ grade.assignmentId?.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Score: {{ grade.grade?.score }}/{{ grade.assignmentId?.maxScore }}
                  ({{ getPercentage(grade.grade?.score, grade.assignmentId?.maxScore) }}%)
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-chip :color="getGradeColor(grade.grade?.score)" size="small">
                    {{ grade.grade?.score >= (grade.assignmentId?.passingScore || 50) ? 'Passed' : 'Failed' }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal" class="mt-2">
              No grades available yet. Check back after your assignments are graded.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- My Courses -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">My Courses</span>
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'StudentCourses' }"
            >
              View All
            </v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text>
            <v-row v-if="enrolledCourses.length">
              <v-col
                v-for="course in enrolledCourses.slice(0, 4)"
                :key="course._id"
                cols="12"
                sm="6"
                lg="3"
              >
                <v-card
                  class="rounded-lg course-card"
                  elevation="2"
                  hover
                  :to="{ name: 'StudentCourseMaterials', params: { courseId: course._id } }"
                >
                  <v-card-item>
                    <div class="d-flex justify-space-between align-start">
                      <v-avatar size="48" color="primary" variant="tonal">
                        <span class="text-h6 font-weight-bold">{{ getCourseInitial(course.courseCode) }}</span>
                      </v-avatar>
                      <v-chip size="small" color="info">{{ course.courseCode }}</v-chip>
                    </div>
                    <div class="mt-3">
                      <div class="text-subtitle-1 font-weight-bold mb-1">
                        {{ course.courseName }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        Teacher: {{ course.teacher?.firstName }} {{ course.teacher?.lastName }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ course.credits }} Credits
                      </div>
                    </div>
                  </v-card-item>
                  <v-card-actions>
                    <v-btn
                      variant="text"
                      color="primary"
                      size="small"
                      :to="{ name: 'StudentCourseMaterials', params: { courseId: course._id } }"
                    >
                      View Materials
                    </v-btn>
                    <v-spacer></v-spacer>
                    <v-btn
                      variant="text"
                      color="primary"
                      size="small"
                      :to="{ name: 'MyAssignments' }"
                    >
                      Assignments
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
            <v-alert v-else type="warning" variant="tonal" class="mt-2">
              You are not enrolled in any courses yet. Please contact your administrator.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Overlay -->
    <v-overlay v-model="studentStore.loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useStudentStore } from '@/stores/studentStore'
import { useGradeStore } from '@/stores/gradeStore'
import { format } from 'date-fns'

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

const getDaysRemaining = (dueDate) => {
  if (!dueDate) return 'No due date'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Overdue'
  if (days === 0) return 'Due today'
  if (days === 1) return '1 day left'
  return `${days} days left`
}

const getDeadlineColor = (dueDate) => {
  if (!dueDate) return 'grey'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'error'
  if (days <= 2) return 'warning'
  return 'info'
}

const getDeadlineChipColor = (dueDate) => {
  if (!dueDate) return 'grey'
  const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'error'
  if (days <= 2) return 'warning'
  return 'success'
}

const getGradeColor = (score) => {
  if (!score) return 'grey'
  if (score >= 90) return 'success'
  if (score >= 75) return 'info'
  if (score >= 60) return 'warning'
  return 'error'
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1)
}

const getCourseInitial = (courseCode) => {
  return courseCode ? courseCode.charAt(0) : 'C'
}

const loadDashboardData = async () => {
  try {
    // Load enrolled courses
    enrolledCourses.value = await studentStore.fetchEnrolledCourses()
    
    // Load dashboard stats
    const stats = await studentStore.fetchDashboardStats()
    dashboardStats.value = stats
    
    // Load grades
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
.course-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
</style>