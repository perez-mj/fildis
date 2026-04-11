<!-- frontend/src/views/student/MyCourses.vue -->
 <template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">My Courses</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              View all your enrolled courses and access learning materials
            </p>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Search and Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
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
          label="Filter by Department"
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
          label="Filter by Semester"
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
        <v-card class="rounded-lg" elevation="2" hover>
          <v-card-item>
            <div class="d-flex justify-space-between align-start">
              <v-avatar size="56" :color="getCourseColor(course.courseCode)" variant="tonal">
                <span class="text-h5 font-weight-bold">{{ getCourseInitial(course.courseCode) }}</span>
              </v-avatar>
              <v-chip :color="course.isActive ? 'success' : 'error'" size="small">
                {{ course.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
            
            <div class="mt-3">
              <div class="text-h6 font-weight-bold mb-1">
                {{ course.courseName }}
              </div>
              <div class="text-caption text-medium-emphasis mb-2">
                {{ course.courseCode }}
              </div>
              <v-divider class="my-2"></v-divider>
              <div class="text-body-2 mb-1">
                <v-icon size="16" class="mr-1">mdi-school</v-icon>
                Teacher: {{ course.teacher?.firstName }} {{ course.teacher?.lastName }}
              </div>
              <div class="text-body-2 mb-1">
                <v-icon size="16" class="mr-1">mdi-domain</v-icon>
                Department: {{ course.department }}
              </div>
              <div class="text-body-2 mb-1">
                <v-icon size="16" class="mr-1">mdi-counter</v-icon>
                Semester: {{ course.semester }} | Credits: {{ course.credits }}
              </div>
              <div class="text-body-2 mb-2">
                <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
                {{ formatDate(course.startDate) }} - {{ formatDate(course.endDate) }}
              </div>
              <v-divider class="my-2"></v-divider>
              <div class="text-caption text-medium-emphasis mb-2">
                {{ course.description }}
              </div>
            </div>
          </v-card-item>

          <v-divider></v-divider>
          
          <v-card-actions class="pa-4">
            <v-btn
              color="primary"
              variant="text"
              :to="{ name: 'StudentCourseMaterials', params: { courseId: course._id } }"
              prepend-icon="mdi-folder-open"
            >
              Materials
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              :to="{ name: 'MyAssignments' }"
              prepend-icon="mdi-clipboard-list"
            >
              Assignments
            </v-btn>
            <v-btn
              color="primary"
              variant="text"
              :to="{ name: 'MyGrades' }"
              prepend-icon="mdi-grade"
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
        <v-card class="rounded-lg text-center pa-8" variant="tonal">
          <v-icon size="64" color="grey" class="mb-4">mdi-book-open-page-variant</v-icon>
          <h3 class="text-h6 mb-2">No courses found</h3>
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
    <v-overlay v-model="studentStore.loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
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

const getCourseColor = (courseCode) => {
  const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'purple', 'orange']
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