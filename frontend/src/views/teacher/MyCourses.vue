<!-- frontend/src/views/teacher/MyCourses.vue -->
<template>
  <div class="my-courses">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4 flex-wrap">
            <h1 class="text-h4 font-weight-bold">My Courses</h1>
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              placeholder="Search courses..."
              density="compact"
              hide-details
              class="search-field"
              style="max-width: 300px"
            ></v-text-field>
          </div>
        </v-col>
      </v-row>

      <v-row>
        <v-col v-for="course in filteredCourses" :key="course._id" cols="12" md="6" lg="4" xl="3">
          <v-card :loading="loading" hover class="course-card" elevation="2">
            <v-img
              :src="getCourseImage(course.courseCode)"
              height="140"
              cover
              class="course-header"
            >
              <div class="d-flex justify-end pa-2">
                <v-chip :color="getStatusColor(course)" size="small" class="status-chip">
                  {{ course.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </div>
            </v-img>

            <v-card-item>
              <v-card-title class="text-h6">{{ course.courseName }}</v-card-title>
              <v-card-subtitle class="d-flex align-center">
                <v-icon icon="mdi-barcode" size="small" class="me-1"></v-icon>
                {{ course.courseCode }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text>
              <div class="d-flex ga-3 mb-3 flex-wrap">
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-account-group" class="me-1"></v-icon>
                  <span class="text-caption">{{ course.students?.length || 0 }} / {{ course.maxStudents || 50 }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-file-document" class="me-1"></v-icon>
                  <span class="text-caption">{{ course.materials?.length || 0 }} materials</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="small" icon="mdi-format-list-checkbox" class="me-1"></v-icon>
                  <span class="text-caption">{{ course.assignments?.length || 0 }} assignments</span>
                </div>
              </div>
              
              <v-divider class="my-2"></v-divider>
              
              <p class="text-body-2 text-medium-emphasis mt-2">
                {{ truncateText(course.description, 100) }}
              </p>

              <div class="mt-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>Enrollment Progress</span>
                  <span>{{ Math.round((course.students?.length || 0) / (course.maxStudents || 50) * 100) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="(course.students?.length || 0) / (course.maxStudents || 50) * 100"
                  :color="getProgressColor((course.students?.length || 0) / (course.maxStudents || 50))"
                  height="6"
                  rounded
                ></v-progress-linear>
              </div>

              <div class="mt-3" v-if="course.endDate">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-end" size="small" class="me-1"></v-icon>
                  <span class="text-caption">Ends: {{ formatDate(course.endDate) }}</span>
                </div>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-3">
              <v-btn
                color="primary"
                variant="text"
                size="small"
                :to="`/teacher/courses/${course._id}/materials`"
                prepend-icon="mdi-folder"
              >
                Materials
              </v-btn>
              <v-btn
                color="success"
                variant="text"
                size="small"
                :to="`/teacher/assignments?course=${course._id}`"
                prepend-icon="mdi-format-list-checkbox"
              >
                Assignments
              </v-btn>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn color="grey" variant="text" size="small" v-bind="props" icon="mdi-dots-vertical">
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item :to="`/teacher/announcements?course=${course._id}`">
                    <v-list-item-title>
                      <v-icon start icon="mdi-bullhorn" size="small"></v-icon>
                      Post Announcement
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="quickCreateAssignment(course)">
                    <v-list-item-title>
                      <v-icon start icon="mdi-plus-circle" size="small"></v-icon>
                      Create Assignment
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col v-if="filteredCourses.length === 0 && !loading" cols="12">
          <v-empty-state
            headline="No Courses Found"
            :title="searchQuery ? 'No matching courses' : 'You haven\'t been assigned to any courses yet'"
            :text="searchQuery ? 'Try a different search term' : 'Contact the administrator to get assigned to courses.'"
            image="https://cdn.jsdelivr.net/npm/@mdi/svg@6.7.96/svg/bookshelf.svg"
          >
            <template v-slot:actions v-if="!searchQuery">
              <v-btn color="primary" variant="text" to="/teacher/dashboard">
                Go to Dashboard
              </v-btn>
            </template>
          </v-empty-state>
        </v-col>
      </v-row>
    </v-container>

    <!-- Quick Create Assignment Dialog -->
    <v-dialog v-model="showAssignmentDialog" max-width="800px">
      <CreateAssignmentDialog :course-id="selectedCourse?._id" @close="showAssignmentDialog = false" @created="onAssignmentCreated" />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'
import CreateAssignmentDialog from '@/components/teacher/CreateAssignmentDialog.vue'

const router = useRouter()
const teacherStore = useTeacherStore()

const loading = ref(false)
const searchQuery = ref('')
const showAssignmentDialog = ref(false)
const selectedCourse = ref(null)

const courses = computed(() => teacherStore.courses)

const filteredCourses = computed(() => {
  if (!searchQuery.value) return courses.value
  const query = searchQuery.value.toLowerCase()
  return courses.value.filter(course => 
    course.courseName.toLowerCase().includes(query) ||
    course.courseCode.toLowerCase().includes(query) ||
    course.description?.toLowerCase().includes(query)
  )
})

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getCourseImage = (code) => {
  const images = [
    'https://picsum.photos/id/20/400/200',
    'https://picsum.photos/id/26/400/200',
    'https://picsum.photos/id/30/400/200',
    'https://picsum.photos/id/42/400/200',
    'https://picsum.photos/id/44/400/200'
  ]
  const index = (code?.charCodeAt(0) || 0) % images.length
  return images[index]
}

const getStatusColor = (course) => {
  if (!course.isActive) return 'error'
  if (new Date(course.endDate) < new Date()) return 'warning'
  return 'success'
}

const getProgressColor = (ratio) => {
  if (ratio >= 0.9) return 'error'
  if (ratio >= 0.7) return 'warning'
  return 'success'
}

const quickCreateAssignment = (course) => {
  selectedCourse.value = course
  showAssignmentDialog.value = true
}

const onAssignmentCreated = () => {
  showAssignmentDialog.value = false
  teacherStore.fetchMyCourses() // Refresh to update assignment count
}

const loadCourses = async () => {
  loading.value = true
  try {
    await teacherStore.fetchMyCourses()
  } catch (error) {
    console.error('Failed to load courses:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.course-card {
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.course-header {
  position: relative;
}

.status-chip {
  backdrop-filter: blur(4px);
  background-color: rgba(0, 0, 0, 0.7) !important;
  color: white !important;
}

.search-field {
  max-width: 300px;
}

@media (max-width: 600px) {
  .search-field {
    margin-top: 12px;
    max-width: 100%;
  }
}
</style>