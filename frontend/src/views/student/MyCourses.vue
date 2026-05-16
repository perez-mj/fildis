<!-- frontend/src/views/student/MyCourses.vue -->
<template>
  <v-container fluid class="courses-container">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-light">My Courses</h1>
        <div class="header-accent"></div>
        <p class="text-subtitle-1 text-medium-emphasis mt-2">
          {{ courses.length }} course{{ courses.length !== 1 ? 's' : '' }} enrolled
        </p>
      </div>
    </div>

    <!-- Search and Filter - Minimalist -->
    <v-row class="mb-6">
      <v-col cols="12" md="5">
        <v-text-field
          v-model="search"
          label="Search courses"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterDepartment"
          :items="departments"
          label="Department"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterSemester"
          :items="[1,2,3,4,5,6,7,8]"
          label="Semester"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <!-- Courses Grid -->
    <v-row>
      <v-col
        v-for="course in filteredCourses"
        :key="course._id"
        cols="12"
        sm="6"
        lg="4"
        xl="3"
      >
        <v-card class="course-card rounded-xl" elevation="0" variant="outlined">
          <!-- Card Header with gradient accent -->
          <div class="card-header" :style="{ backgroundImage: `linear-gradient(135deg, ${getCourseColor(course.courseCode)}20, transparent)` }">
            <div class="d-flex justify-space-between align-start">
              <div class="course-avatar" :style="{ backgroundColor: getCourseColor(course.courseCode) + '15' }">
                <span :style="{ color: getCourseColor(course.courseCode) }" class="course-initial">
                  {{ getCourseInitial(course.courseCode) }}
                </span>
              </div>
              <v-chip :color="course.isActive ? 'success' : 'error'" size="x-small" variant="light">
                {{ course.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </div>

          <v-card-text class="pa-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-1 course-name">
              {{ course.courseName }}
            </h3>
            <div class="text-caption text-medium-emphasis mb-3">
              {{ course.courseCode }}
            </div>
            
            <v-divider class="my-2"></v-divider>
            
            <div class="course-details">
              <div class="detail-item">
                <v-icon size="14" class="mr-1">mdi-school-outline</v-icon>
                <span class="text-caption">{{ course.teacher?.firstName }} {{ course.teacher?.lastName }}</span>
              </div>
              <div class="detail-item">
                <v-icon size="14" class="mr-1">mdi-domain</v-icon>
                <span class="text-caption">{{ course.department }}</span>
              </div>
              <div class="detail-item">
                <v-icon size="14" class="mr-1">mdi-counter</v-icon>
                <span class="text-caption">Semester {{ course.semester }} • {{ course.credits }} credits</span>
              </div>
              <div class="detail-item">
                <v-icon size="14" class="mr-1">mdi-calendar-outline</v-icon>
                <span class="text-caption">{{ formatDate(course.startDate) }} - {{ formatDate(course.endDate) }}</span>
              </div>
            </div>
            
            <p class="text-caption text-medium-emphasis mt-2 course-description">
              {{ truncateText(course.description, 80) }}
            </p>
          </v-card-text>

          <v-divider></v-divider>
          
          <v-card-actions class="pa-3">
            <v-btn
              color="primary"
              variant="text"
              size="small"
              :to="{ name: 'StudentCourseMaterials', params: { courseId: course._id } }"
              prepend-icon="mdi-folder-open-outline"
            >
              Materials
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              :to="{ name: 'MyAssignments' }"
              prepend-icon="mdi-clipboard-list-outline"
            >
              Assignments
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              size="small"
              :to="{ name: 'MyGrades' }"
              prepend-icon="mdi-chart-line"
            >
              Grades
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="!studentStore.loading && filteredCourses.length === 0">
      <v-col cols="12">
        <v-card class="rounded-xl text-center pa-8" variant="tonal">
          <v-icon size="56" color="grey-lighten-1" class="mb-4">mdi-book-open-page-variant</v-icon>
          <h3 class="text-h6 font-weight-light mb-2">No courses found</h3>
          <p class="text-body-2 text-medium-emphasis">
            {{ search || filterDepartment || filterSemester ? 'Try adjusting your filters' : 'You are not enrolled in any courses yet' }}
          </p>
          <v-btn
            v-if="search || filterDepartment || filterSemester"
            color="primary"
            variant="text"
            @click="clearFilters"
          >
            Clear Filters
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <v-overlay v-model="studentStore.loading" class="align-center justify-center" scrim="primary" opacity="0.1">
      <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'
import { format } from 'date-fns'

const studentStore = useStudentStore()

const search = ref('')
const filterDepartment = ref(null)
const filterSemester = ref(null)

const courses = ref([])

const departments = computed(() => {
  const depts = new Set(courses.value.map(c => c.department))
  return Array.from(depts).sort()
})

const filteredCourses = computed(() => {
  let filtered = courses.value
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(course =>
      course.courseName.toLowerCase().includes(searchLower) ||
      course.courseCode.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower)
    )
  }
  
  if (filterDepartment.value) {
    filtered = filtered.filter(course => course.department === filterDepartment.value)
  }
  
  if (filterSemester.value) {
    filtered = filtered.filter(course => course.semester === filterSemester.value)
  }
  
  return filtered
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy')
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getCourseColor = (courseCode) => {
  const colors = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']
  const index = courseCode.charCodeAt(0) % colors.length
  return colors[index]
}

const getCourseInitial = (courseCode) => {
  return courseCode.charAt(0)
}

const clearFilters = () => {
  search.value = ''
  filterDepartment.value = null
  filterSemester.value = null
}

const loadCourses = async () => {
  try {
    courses.value = await studentStore.fetchEnrolledCourses()
  } catch (error) {
    console.error('Failed to load courses:', error)
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.courses-container {
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

/* Course Card */
.course-card {
  transition: all 0.3s ease;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.15);
  border-color: transparent;
}

.card-header {
  padding: 16px;
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

.course-name {
  line-height: 1.3;
}

.course-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item {
  display: flex;
  align-items: center;
  color: #475569;
}

.course-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 600px) {
  .course-avatar {
    width: 40px;
    height: 40px;
  }
  
  .course-initial {
    font-size: 20px;
  }
}
</style>