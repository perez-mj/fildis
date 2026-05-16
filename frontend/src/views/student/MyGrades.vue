<!-- frontend/src/views/student/MyGrades.vue -->
<template>
  <v-container fluid class="grades-container">
    <!-- Page Header -->
    <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-light">My Grades</h1>
        <div class="header-accent"></div>
    </div>

    <!-- Statistics Cards - Minimalist -->
    <v-row class="mb-6 stats-row">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="primary">
          <v-card-text class="text-center pa-4">
            <div class="stat-value">{{ summary.overallPercentage || 0 }}%</div>
            <div class="stat-label">Overall Average</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="info">
          <v-card-text class="text-center pa-4">
            <div class="stat-value">{{ summary.totalGraded || 0 }}</div>
            <div class="stat-label">Graded Assignments</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="success">
          <v-card-text class="text-center pa-4">
            <div class="stat-value">{{ passingCount }}</div>
            <div class="stat-label">Passed</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card rounded-xl" elevation="0" variant="tonal" color="error">
          <v-card-text class="text-center pa-4">
            <div class="stat-value">{{ failingCount }}</div>
            <div class="stat-label">Failed</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grades Table -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-xl" elevation="0" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center pa-4">
            <span class="text-h6 font-weight-light">Grade Summary</span>
            <v-select
              v-model="filterCourse"
              :items="courseOptions"
              label="Filter by Course"
              variant="outlined"
              density="compact"
              clearable
              class="course-filter"
              hide-details
            ></v-select>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-data-table
            :headers="headers"
            :items="filteredGrades"
            :loading="gradeStore.loading"
            :items-per-page="10"
            class="grades-table"
            hover
          >
            <template v-slot:item.title="{ item }">
              <div class="font-weight-medium">{{ item.assignmentId?.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.assignmentId?.courseId?.courseCode }} • {{ item.assignmentId?.courseId?.courseName }}
              </div>
            </template>

            <template v-slot:item.score="{ item }">
              <div class="score-cell">
                <span class="score-value">{{ item.grade?.score }}/{{ item.assignmentId?.maxScore }}</span>
                <div class="score-progress">
                  <v-progress-linear
                    :model-value="getPercentage(item.grade?.score, item.assignmentId?.maxScore)"
                    :color="getGradeColor(item.grade?.score, item.assignmentId?.passingScore)"
                    height="4"
                    rounded
                  ></v-progress-linear>
                </div>
                <v-chip
                  :color="getGradeColor(item.grade?.score, item.assignmentId?.passingScore)"
                  size="x-small"
                  variant="light"
                  class="mt-1"
                >
                  {{ getPercentage(item.grade?.score, item.assignmentId?.maxScore) }}%
                </v-chip>
              </div>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.grade?.score >= (item.assignmentId?.passingScore || 50) ? 'success' : 'error'"
                size="small"
                variant="light"
              >
                <v-icon start size="14" :icon="item.grade?.score >= (item.assignmentId?.passingScore || 50) ? 'mdi-check-circle' : 'mdi-close-circle'"></v-icon>
                {{ item.grade?.score >= (item.assignmentId?.passingScore || 50) ? 'Passed' : 'Failed' }}
              </v-chip>
            </template>

            <template v-slot:item.submissionDate="{ item }">
              <div class="text-caption">{{ formatDate(item.submissionDate) }}</div>
            </template>

            <template v-slot:item.gradedAt="{ item }">
              <div class="text-caption">{{ formatDate(item.grade?.gradedAt) }}</div>
            </template>

            <template v-slot:item.feedback="{ item }">
              <v-btn
                v-if="item.grade?.feedback"
                variant="text"
                size="small"
                color="primary"
                @click="viewFeedback(item)"
                prepend-icon="mdi-message-text-outline"
              >
                View
              </v-btn>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </template>

            <template v-slot:no-data>
              <div class="text-center pa-8">
                <v-icon size="56" color="grey-lighten-1" class="mb-4">mdi-chart-line</v-icon>
                <h3 class="text-h6 font-weight-light mb-2">No grades available</h3>
                <p class="text-body-2 text-medium-emphasis">
                  You don't have any graded assignments yet.
                </p>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Feedback Dialog -->
    <v-dialog v-model="feedbackDialog" max-width="550">
      <v-card class="rounded-xl">
        <v-card-title class="text-h6 font-weight-light pa-4">
          Assignment Feedback
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" size="small" variant="text" @click="feedbackDialog = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <div class="feedback-section mb-3">
            <div class="feedback-label">Assignment</div>
            <div class="feedback-value font-weight-medium">{{ selectedGrade?.assignmentId?.title }}</div>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="feedback-section mb-3">
            <div class="feedback-label">Score</div>
            <div class="feedback-value">
              <span class="font-weight-bold">{{ selectedGrade?.grade?.score }}</span> / {{ selectedGrade?.assignmentId?.maxScore }}
              <v-chip :color="getGradeColor(selectedGrade?.grade?.score, selectedGrade?.assignmentId?.passingScore)" size="x-small" class="ml-2">
                {{ getPercentage(selectedGrade?.grade?.score, selectedGrade?.assignmentId?.maxScore) }}%
              </v-chip>
            </div>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="feedback-section mb-3">
            <div class="feedback-label">Feedback</div>
            <div class="feedback-value feedback-text">{{ selectedGrade?.grade?.feedback || 'No feedback provided.' }}</div>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="feedback-section mb-3">
            <div class="feedback-label">Graded By</div>
            <div class="feedback-value">{{ selectedGrade?.grade?.gradedBy?.firstName }} {{ selectedGrade?.grade?.gradedBy?.lastName }}</div>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="feedback-section">
            <div class="feedback-label">Graded On</div>
            <div class="feedback-value">{{ formatDate(selectedGrade?.grade?.gradedAt) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="feedbackDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGradeStore } from '@/stores/gradeStore'
import { format } from 'date-fns'

const gradeStore = useGradeStore()

const filterCourse = ref(null)
const feedbackDialog = ref(false)
const selectedGrade = ref(null)

const summary = computed(() => gradeStore.summary)
const grades = computed(() => gradeStore.grades)

const passingCount = computed(() => {
  return grades.value.filter(g => 
    g.grade?.score >= (g.assignmentId?.passingScore || 50)
  ).length
})

const failingCount = computed(() => {
  return grades.value.filter(g => 
    g.grade?.score < (g.assignmentId?.passingScore || 50)
  ).length
})

const courseOptions = computed(() => {
  const courses = new Map()
  grades.value.forEach(grade => {
    const courseId = grade.assignmentId?.courseId?._id
    const courseName = grade.assignmentId?.courseId?.courseName
    if (courseId && courseName && !courses.has(courseId)) {
      courses.set(courseId, { title: courseName, value: courseId })
    }
  })
  return Array.from(courses.values())
})

const filteredGrades = computed(() => {
  if (!filterCourse.value) return grades.value
  return grades.value.filter(g => 
    g.assignmentId?.courseId?._id === filterCourse.value
  )
})

const headers = [
  { title: 'Assignment', key: 'title', sortable: true },
  { title: 'Score', key: 'score', sortable: true, align: 'start' },
  { title: 'Status', key: 'status', sortable: true, align: 'center' },
  { title: 'Submitted', key: 'submissionDate', sortable: true },
  { title: 'Graded', key: 'gradedAt', sortable: true },
  { title: 'Feedback', key: 'feedback', sortable: false, align: 'center' }
]

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy')
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1)
}

const getGradeColor = (score, passingScore) => {
  if (!score) return 'grey'
  if (score >= 90) return 'success'
  if (score >= (passingScore || 50)) return 'primary'
  return 'error'
}

const viewFeedback = (grade) => {
  selectedGrade.value = grade
  feedbackDialog.value = true
}

const loadGrades = async () => {
  await gradeStore.fetchMyGrades()
}

onMounted(() => {
  loadGrades()
})
</script>

<style scoped>
.grades-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 8px;
}

.header-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

/* Statistics Cards */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-value {
  font-size: 2rem;
  font-weight: 300;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.7;
  margin-top: 4px;
}

/* Course Filter */
.course-filter {
  max-width: 250px;
}

/* Grades Table */
.grades-table :deep(.v-data-table__th) {
  font-weight: 500;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-cell {
  min-width: 120px;
}

.score-value {
  font-weight: 500;
  font-size: 0.9rem;
}

.score-progress {
  max-width: 100px;
  margin-top: 4px;
}

/* Feedback Section */
.feedback-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  margin-bottom: 4px;
}

.feedback-value {
  font-size: 0.95rem;
}

.feedback-text {
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 600px) {
  .stat-value {
    font-size: 1.5rem;
  }
  
  .course-filter {
    max-width: 100%;
    margin-top: 12px;
  }
  
  .score-cell {
    min-width: auto;
  }
}
</style>