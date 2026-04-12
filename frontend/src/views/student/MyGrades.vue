<!-- frontend/src/views/student/MyGrades.vue -->
 <template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <v-chip color="primary" size="large">
            <v-icon start>mdi-chart-line</v-icon>
            Overall Average: {{ summary.overallPercentage }}%
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg" elevation="2" color="primary" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h3 font-weight-bold">{{ summary.totalGraded }}</div>
            <div class="text-subtitle-2">Graded Assignments</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg" elevation="2" color="success" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h3 font-weight-bold">{{ summary.averageGrade }}</div>
            <div class="text-subtitle-2">Average Score</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg" elevation="2" color="info" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h3 font-weight-bold">{{ passingCount }}</div>
            <div class="text-subtitle-2">Passed Assignments</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="rounded-lg" elevation="2" color="warning" variant="tonal">
          <v-card-text class="text-center">
            <div class="text-h3 font-weight-bold">{{ failingCount }}</div>
            <div class="text-subtitle-2">Failed Assignments</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Grades Table -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg" elevation="2">
          <v-card-title class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">Grade Summary</span>
            <v-select
              v-model="filterCourse"
              :items="courseOptions"
              label="Filter by Course"
              variant="outlined"
              density="compact"
              clearable
              style="max-width: 300px"
              hide-details
            ></v-select>
          </v-card-title>
          <v-divider></v-divider>
          
          <v-data-table
            :headers="headers"
            :items="filteredGrades"
            :loading="gradeStore.loading"
            :items-per-page="10"
            class="elevation-0"
          >
            <template v-slot:item.title="{ item }">
              <div class="font-weight-medium">{{ item.assignmentId?.title }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ item.assignmentId?.courseId?.courseCode }}
              </div>
            </template>

            <template v-slot:item.score="{ item }">
              <div class="d-flex align-center">
                <span class="font-weight-bold">{{ item.grade?.score }}/{{ item.assignmentId?.maxScore }}</span>
                <v-chip
                  :color="getGradeColor(item.grade?.score, item.assignmentId?.passingScore)"
                  size="x-small"
                  class="ml-2"
                >
                  {{ getPercentage(item.grade?.score, item.assignmentId?.maxScore) }}%
                </v-chip>
              </div>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                :color="item.grade?.score >= (item.assignmentId?.passingScore || 50) ? 'success' : 'error'"
                size="small"
              >
                {{ item.grade?.score >= (item.assignmentId?.passingScore || 50) ? 'Passed' : 'Failed' }}
              </v-chip>
            </template>

            <template v-slot:item.submissionDate="{ item }">
              {{ formatDate(item.submissionDate) }}
            </template>

            <template v-slot:item.gradedAt="{ item }">
              {{ formatDate(item.grade?.gradedAt) }}
            </template>

            <template v-slot:item.feedback="{ item }">
              <v-btn
                v-if="item.grade?.feedback"
                variant="text"
                size="small"
                color="primary"
                @click="viewFeedback(item)"
              >
                View Feedback
              </v-btn>
              <span v-else class="text-caption text-medium-emphasis">No feedback</span>
            </template>

            <template v-slot:no-data>
              <div class="text-center pa-8">
                <v-icon size="64" color="grey" class="mb-4">mdi-grade</v-icon>
                <h3 class="text-h6 mb-2">No grades available</h3>
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
    <v-dialog v-model="feedbackDialog" max-width="600">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">
          Assignment Feedback
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-4">
          <div class="mb-3">
            <div class="text-subtitle-2 font-weight-medium">Assignment</div>
            <div>{{ selectedGrade?.assignmentId?.title }}</div>
          </div>
          <div class="mb-3">
            <div class="text-subtitle-2 font-weight-medium">Score</div>
            <div>{{ selectedGrade?.grade?.score }}/{{ selectedGrade?.assignmentId?.maxScore }}</div>
          </div>
          <div class="mb-3">
            <div class="text-subtitle-2 font-weight-medium">Feedback</div>
            <div class="text-body-1">{{ selectedGrade?.grade?.feedback || 'No feedback provided.' }}</div>
          </div>
          <div class="mb-3">
            <div class="text-subtitle-2 font-weight-medium">Graded By</div>
            <div>{{ selectedGrade?.grade?.gradedBy?.firstName }} {{ selectedGrade?.grade?.gradedBy?.lastName }}</div>
          </div>
          <div>
            <div class="text-subtitle-2 font-weight-medium">Graded On</div>
            <div>{{ formatDate(selectedGrade?.grade?.gradedAt) }}</div>
          </div>
        </v-card-text>
        <v-card-actions>
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
  { title: 'Score', key: 'score', sortable: true, align: 'center' },
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
  if (score >= (passingScore || 50)) return 'info'
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