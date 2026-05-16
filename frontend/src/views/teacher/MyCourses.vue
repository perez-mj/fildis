<!-- frontend/src/views/teacher/MyCourses.vue -->
<template>
  <div class="my-courses">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-light mb-2">My Courses</h1>
            <div class="section-underline"></div>
          </div>
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search courses..."
            density="comfortable"
            hide-details
            class="search-field mt-3 mt-sm-0"
            variant="outlined"
            clearable
          ></v-text-field>
        </div>
      </div>

      <!-- Courses Grid -->
      <v-row>
        <v-col v-for="course in filteredCourses" :key="course._id" cols="12" md="6" lg="4" xl="3">
          <v-card variant="outlined" class="course-card" :loading="loading">
            <div class="course-header" :style="{ backgroundImage: `url(${getCourseImage(course.courseCode)})` }">
              <div class="overlay"></div>
              <div class="d-flex justify-end pa-3">
                <v-chip :color="getStatusColor(course)" size="x-small" variant="tonal">
                  {{ course.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </div>
            </div>

            <v-card-item class="pa-4">
              <v-card-title class="text-h6 font-weight-light pa-0 mb-1">{{ course.courseName }}</v-card-title>
              <v-card-subtitle class="pa-0 d-flex align-center">
                <v-icon icon="mdi-barcode" size="12" class="me-1"></v-icon>
                <span class="text-caption">{{ course.courseCode }}</span>
              </v-card-subtitle>
            </v-card-item>

            <v-card-text class="pt-0 px-4 pb-0">
              <div class="d-flex ga-3 mb-3">
                <div class="d-flex align-center">
                  <v-icon size="12" icon="mdi-account-group" class="me-1" color="grey-darken-1"></v-icon>
                  <span class="text-caption">{{ course.students?.length || 0 }} / {{ course.maxStudents || 50 }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon size="12" icon="mdi-file-document" class="me-1" color="grey-darken-1"></v-icon>
                  <span class="text-caption">{{ course.materials?.length || 0 }} materials</span>
                </div>
              </div>
              
              <p class="text-body-2 text-grey-darken-1 mt-2">
                {{ truncateText(course.description, 100) }}
              </p>

              <div class="mt-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="text-grey-darken-1">Enrollment</span>
                  <span>{{ Math.round((course.students?.length || 0) / (course.maxStudents || 50) * 100) }}%</span>
                </div>
                <v-progress-linear
                  :model-value="(course.students?.length || 0) / (course.maxStudents || 50) * 100"
                  :color="getProgressColor((course.students?.length || 0) / (course.maxStudents || 50))"
                  height="3"
                  rounded
                ></v-progress-linear>
              </div>

              <div class="mt-2" v-if="course.endDate">
                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-end" size="12" class="me-1" color="grey-darken-1"></v-icon>
                  <span class="text-caption text-grey-darken-1">Ends: {{ formatDate(course.endDate) }}</span>
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
                rounded="pill"
              >
                Materials
              </v-btn>
              <v-btn
                color="success"
                variant="text"
                size="small"
                :to="`/teacher/assignments?course=${course._id}`"
                prepend-icon="mdi-format-list-checkbox"
                rounded="pill"
              >
                Tasks
              </v-btn>
              <v-menu location="bottom">
                <template v-slot:activator="{ props }">
                  <v-btn color="grey" variant="text" size="small" v-bind="props" icon="mdi-dots-vertical"></v-btn>
                </template>
                <v-list density="compact" variant="outlined" class="calm-menu">
                  <v-list-item :to="`/teacher/announcements?course=${course._id}`" rounded="lg">
                    <v-list-item-title class="text-caption">
                      <v-icon start icon="mdi-bullhorn" size="14"></v-icon>
                      Post Announcement
                    </v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="quickCreateAssignment(course)" rounded="lg">
                    <v-list-item-title class="text-caption">
                      <v-icon start icon="mdi-plus-circle" size="14"></v-icon>
                      Create Assignment
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Empty State -->
        <v-col v-if="filteredCourses.length === 0 && !loading" cols="12">
          <v-card variant="outlined" class="text-center pa-8">
            <v-icon icon="mdi-book-open-variant" size="64" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
            <div class="text-h6 font-weight-light text-grey-darken-1">
              {{ searchQuery ? 'No matching courses' : 'No courses assigned yet' }}
            </div>
            <div class="text-caption text-grey-darken-1 mt-1">
              {{ searchQuery ? 'Try a different search term' : 'Contact the administrator to get assigned to courses' }}
            </div>
            <v-btn v-if="!searchQuery" color="primary" variant="outlined" to="/teacher/dashboard" class="mt-4" rounded="pill">
              Go to Dashboard
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Quick Create Assignment Dialog -->
    <v-dialog v-model="showAssignmentDialog" max-width="800px" scrollable>
      <CreateAssignmentDialog 
        :course-id="selectedCourse?._id" 
        @close="showAssignmentDialog = false" 
        @created="onAssignmentCreated" 
      />
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
  if (!course.isActive) return 'grey'
  if (course.endDate && new Date(course.endDate) < new Date()) return 'warning'
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
  teacherStore.fetchMyCourses()
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
.section-underline {
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline:hover {
  width: 64px;
}

.course-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.course-card:hover {
  transform: translateY(-2px);
}

.course-header {
  height: 120px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.course-header .overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%);
}

.search-field {
  max-width: 300px;
}

.calm-menu {
  border-radius: 12px !important;
}

@media (max-width: 600px) {
  .search-field {
    max-width: 100%;
  }
}
</style>