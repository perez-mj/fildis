<!-- frontend/src/views/admin/TeacherAssignment.vue -->
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">Teacher Assignment</h1>
            <div class="text-subtitle-1 text-grey mt-1">
              Assign teachers to courses or change existing assignments
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="mb-4">
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="filters.search"
                  label="Search courses"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  placeholder="Course name or code"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.department"
                  label="Department"
                  clearable
                  :items="departments"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="filters.assignment"
                  label="Assignment Status"
                  clearable
                  :items="assignmentStatusOptions"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Courses Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3 pa-4">
            <div class="d-flex justify-space-between align-center">
              <span>Courses Without Teacher ({{ unassignedCourses.length }})</span>
              <v-chip color="warning">
                <v-icon left size="small">mdi-account-alert</v-icon>
                Needs Attention
              </v-chip>
            </div>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-data-table
              :headers="unassignedHeaders"
              :items="filteredUnassignedCourses"
              :loading="courseStore.loading"
              items-per-page="5"
              class="elevation-0"
            >
              <template v-slot:item.courseCode="{ item }">
                <v-chip color="primary" size="small">{{ item.courseCode }}</v-chip>
              </template>

              <template v-slot:item.teacherName="{ item }">
                <span class="text-grey">Not Assigned</span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="openAssignDialog(item)"
                >
                  <v-icon left size="small">mdi-account-plus</v-icon>
                  Assign Teacher
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3 pa-4">
            <div class="d-flex justify-space-between align-center">
              <span>All Courses ({{ filteredCourses.length }} total)</span>
              <v-chip color="success">
                <v-icon left size="small">mdi-check-circle</v-icon>
                {{ assignedCourses.length }} Assigned
              </v-chip>
            </div>
          </v-card-title>
          <v-card-text class="pa-0">
            <v-data-table
              :headers="headers"
              :items="filteredCourses"
              :loading="courseStore.loading"
              :search="filters.search"
              items-per-page="10"
              class="elevation-0"
            >
              <template v-slot:item.courseCode="{ item }">
                <v-chip color="primary" size="small">{{ item.courseCode }}</v-chip>
              </template>

              <template v-slot:item.courseName="{ item }">
                <div>
                  <div class="font-weight-medium">{{ item.courseName }}</div>
                  <div class="text-caption text-grey">{{ item.department }}</div>
                </div>
              </template>

              <template v-slot:item.teacherName="{ item }">
                <div v-if="item.teacher">
                  <div class="d-flex align-center">
                    <v-avatar size="32" color="info" class="mr-2">
                      <v-icon size="20">mdi-teacher</v-icon>
                    </v-avatar>
                    <div>
                      <div>{{ item.teacher.firstName }} {{ item.teacher.lastName }}</div>
                      <div class="text-caption text-grey">{{ item.teacher.email }}</div>
                    </div>
                  </div>
                </div>
                <span v-else class="text-grey">Not Assigned</span>
              </template>

              <template v-slot:item.enrolledCount="{ item }">
                <v-chip size="small" :color="getEnrollmentColor(item)">
                  {{ item.students?.length || 0 }} / {{ item.maxStudents }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  color="primary"
                  size="small"
                  variant="text"
                  @click="openAssignDialog(item)"
                >
                  <v-icon left size="small">mdi-pencil</v-icon>
                  {{ item.teacher ? 'Change' : 'Assign' }}
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Assign Teacher Dialog -->
    <v-dialog v-model="assignDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          Assign Teacher to Course
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="mb-4">
            <div class="text-subtitle-2 text-grey">Course Information</div>
            <v-divider class="my-2"></v-divider>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6">{{ selectedCourse?.courseName }}</div>
                <div class="text-caption text-grey">{{ selectedCourse?.courseCode }}</div>
              </div>
              <v-chip :color="selectedCourse?.isActive ? 'success' : 'error'" size="small">
                {{ selectedCourse?.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </div>

          <v-select
            v-model="selectedTeacherId"
            :items="availableTeachers"
            item-title="fullName"
            item-value="_id"
            label="Select Teacher"
            placeholder="Choose a teacher to assign"
            return-object
            :loading="userStore.loading"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar size="36" color="info" class="mr-2">
                    <v-icon>mdi-teacher</v-icon>
                  </v-avatar>
                </template>
                <template v-slot:title>
                  {{ item.raw.firstName }} {{ item.raw.lastName }}
                </template>
                <template v-slot:subtitle>
                  {{ item.raw.email }} • {{ item.raw.department || 'No department' }}
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <div class="d-flex align-center">
                <v-avatar size="28" color="info" class="mr-2">
                  <v-icon size="16">mdi-teacher</v-icon>
                </v-avatar>
                <div>
                  <div>{{ item.raw.firstName }} {{ item.raw.lastName }}</div>
                  <div class="text-caption">{{ item.raw.email }}</div>
                </div>
              </div>
            </template>
          </v-select>

          <v-alert
            v-if="selectedTeacherId && selectedCourse?.teacher?._id === selectedTeacherId._id"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            This teacher is already assigned to this course
          </v-alert>

          <v-alert
            v-if="selectedTeacherId && selectedCourse?.teacher && selectedCourse.teacher._id !== selectedTeacherId._id"
            type="warning"
            variant="tonal"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon left>mdi-account-switch</v-icon>
              <span class="ml-2">
                Changing teacher from {{ selectedCourse.teacher.firstName }} {{ selectedCourse.teacher.lastName }}
                to {{ selectedTeacherId.firstName }} {{ selectedTeacherId.lastName }}
              </span>
            </div>
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="assignDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :loading="assigning" 
            :disabled="!selectedTeacherId || selectedTeacherId?._id === selectedCourse?.teacher?._id"
            @click="assignTeacher"
          >
            {{ selectedCourse?.teacher ? 'Update Assignment' : 'Assign Teacher' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbar.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUserStore } from '@/stores/userStore'

const courseStore = useCourseStore()
const userStore = useUserStore()

const assignDialog = ref(false)
const selectedCourse = ref(null)
const selectedTeacherId = ref(null)
const assigning = ref(false)

const filters = ref({
  search: '',
  department: null,
  assignment: null
})

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const departments = computed(() => {
  const depts = [...new Set(courseStore.courses.map(c => c.department))]
  return depts.sort()
})

const assignmentStatusOptions = [
  { title: 'All Courses', value: null },
  { title: 'Assigned', value: 'assigned' },
  { title: 'Unassigned', value: 'unassigned' }
]

const headers = [
  { title: 'Course Code', key: 'courseCode', sortable: true, width: '120' },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Enrolled', key: 'enrolledCount', sortable: true, width: '120' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center', width: '120' }
]

const unassignedHeaders = [
  { title: 'Course Code', key: 'courseCode', sortable: true, width: '120' },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center', width: '150' }
]

const availableTeachers = computed(() => {
  return userStore.teachers.map(t => ({
    ...t,
    fullName: `${t.firstName} ${t.lastName}`
  }))
})

const unassignedCourses = computed(() => {
  return courseStore.courses.filter(c => !c.teacher)
})

const assignedCourses = computed(() => {
  return courseStore.courses.filter(c => c.teacher)
})

const filteredUnassignedCourses = computed(() => {
  let courses = unassignedCourses.value
  
  if (filters.value.department) {
    courses = courses.filter(c => c.department === filters.value.department)
  }
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    courses = courses.filter(c => 
      c.courseCode.toLowerCase().includes(search) || 
      c.courseName.toLowerCase().includes(search)
    )
  }
  
  return courses
})

const filteredCourses = computed(() => {
  let courses = courseStore.courses
  
  if (filters.value.department) {
    courses = courses.filter(c => c.department === filters.value.department)
  }
  if (filters.value.assignment === 'assigned') {
    courses = courses.filter(c => c.teacher)
  } else if (filters.value.assignment === 'unassigned') {
    courses = courses.filter(c => !c.teacher)
  }
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    courses = courses.filter(c => 
      c.courseCode.toLowerCase().includes(search) || 
      c.courseName.toLowerCase().includes(search)
    )
  }
  
  return courses
})

const getEnrollmentColor = (course) => {
  const percentage = (course.students?.length || 0) / course.maxStudents * 100
  if (percentage >= 90) return 'error'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const loadData = async () => {
  try {
    await Promise.all([
      courseStore.fetchCourses(),
      userStore.fetchTeachers()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
    snackbar.value = {
      show: true,
      message: 'Failed to load data',
      color: 'error'
    }
  }
}

const openAssignDialog = (course) => {
  selectedCourse.value = course
  selectedTeacherId.value = course.teacher || null
  assignDialog.value = true
}

const assignTeacher = async () => {
  if (!selectedTeacherId.value || !selectedCourse.value) return
  
  assigning.value = true
  try {
    await courseStore.updateCourse(selectedCourse.value._id, {
      teacher: selectedTeacherId.value._id
    })
    
    assignDialog.value = false
    
    // Refresh courses
    await courseStore.fetchCourses()
    
    snackbar.value = {
      show: true,
      message: `Teacher assigned to ${selectedCourse.value.courseName} successfully`,
      color: 'success'
    }
  } catch (error) {
    console.error('Failed to assign teacher:', error)
    snackbar.value = {
      show: true,
      message: error.response?.data?.message || 'Failed to assign teacher',
      color: 'error'
    }
  } finally {
    assigning.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.v-data-table :deep(td) {
  padding: 12px 16px;
}

.v-data-table :deep(.v-data-table-header th) {
  font-weight: 600;
  background-color: #f5f5f5;
}
</style>