<!-- frontend/src/views/admin/TeacherAssignment.vue -->
<template>
  <div class="teacher-assignment">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-light mb-2">Teacher Assignment</h1>
        <div class="section-underline"></div>
        <p class="text-body-2 text-grey-darken-1 mt-2">Assign teachers to courses</p>
      </div>

      <!-- Filters -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="filters.search"
                label="Search courses"
                prepend-inner-icon="mdi-magnify"
                clearable
                placeholder="Course name or code"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="filters.department"
                label="Department"
                clearable
                :items="departments"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="filters.assignment"
                label="Assignment Status"
                clearable
                :items="assignmentStatusOptions"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Unassigned Courses Section -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-light">Courses Without Teacher</h2>
          <v-chip color="warning" size="x-small" variant="tonal">
            <v-icon start icon="mdi-account-alert" size="12"></v-icon>
            Needs Attention
          </v-chip>
        </div>
        
        <v-card variant="outlined">
          <v-data-table
            :headers="unassignedHeaders"
            :items="filteredUnassignedCourses"
            :loading="courseStore.loading"
            :items-per-page="5"
            class="calm-data-table"
          >
            <template v-slot:item.courseCode="{ item }">
              <v-chip color="primary" size="x-small" variant="tonal">{{ item.courseCode }}</v-chip>
            </template>

            <template v-slot:item.teacherName="{ item }">
              <span class="text-caption text-grey-darken-1">Not Assigned</span>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                color="primary"
                size="x-small"
                variant="text"
                @click="openAssignDialog(item)"
                rounded="pill"
              >
                <v-icon start icon="mdi-account-plus" size="12"></v-icon>
                Assign
              </v-btn>
            </template>

            <template v-slot:no-data>
              <div class="text-center pa-4">
                <span class="text-caption text-grey-darken-1">All courses have teachers assigned</span>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>

      <!-- All Courses Section -->
      <div>
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-light">All Courses</h2>
          <v-chip color="success" size="x-small" variant="tonal">
            <v-icon start icon="mdi-check-circle" size="12"></v-icon>
            {{ assignedCourses.length }} Assigned
          </v-chip>
        </div>

        <v-card variant="outlined">
          <v-data-table
            :headers="headers"
            :items="filteredCourses"
            :loading="courseStore.loading"
            :search="filters.search"
            :items-per-page="10"
            class="calm-data-table"
          >
            <template v-slot:item.courseCode="{ item }">
              <v-chip color="primary" size="x-small" variant="tonal">{{ item.courseCode }}</v-chip>
            </template>

            <template v-slot:item.courseName="{ item }">
              <div>
                <div class="text-body-2">{{ item.courseName }}</div>
                <div class="text-caption text-grey-darken-1">{{ item.department }}</div>
              </div>
            </template>

            <template v-slot:item.teacherName="{ item }">
              <div v-if="item.teacher" class="d-flex align-center">
                <v-avatar size="28" color="primary" variant="tonal" class="mr-2">
                  <v-icon size="14">mdi-teacher</v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-2">{{ item.teacher.firstName }} {{ item.teacher.lastName }}</div>
                  <div class="text-caption text-grey-darken-1">{{ item.teacher.email }}</div>
                </div>
              </div>
              <span v-else class="text-caption text-grey-darken-1">Not Assigned</span>
            </template>

            <template v-slot:item.enrolledCount="{ item }">
              <v-chip size="x-small" :color="getEnrollmentColor(item)" variant="tonal">
                {{ item.students?.length || 0 }} / {{ item.maxStudents }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                color="primary"
                size="x-small"
                variant="text"
                @click="openAssignDialog(item)"
                rounded="pill"
              >
                <v-icon start icon="mdi-pencil" size="12"></v-icon>
                {{ item.teacher ? 'Change' : 'Assign' }}
              </v-btn>
            </template>

            <template v-slot:no-data>
              <div class="text-center pa-6">
                <v-icon icon="mdi-book-open-variant" size="32" color="grey-lighten-1" class="mb-2" opacity="0.5"></v-icon>
                <div class="text-caption text-grey-darken-1">No courses found</div>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </div>
    </v-container>

    <!-- Assign Teacher Dialog -->
    <v-dialog v-model="assignDialog" max-width="600px">
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">Assign Teacher</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="assignDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <div class="mb-4">
            <div class="text-caption text-grey-darken-1 mb-2">Course Information</div>
            <v-divider class="mb-2"></v-divider>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-1 font-weight-light">{{ selectedCourse?.courseName }}</div>
                <div class="text-caption text-grey-darken-1">{{ selectedCourse?.courseCode }}</div>
              </div>
              <v-chip :color="selectedCourse?.isActive ? 'success' : 'grey'" size="x-small" variant="tonal">
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
            variant="outlined"
            :loading="userStore.loading"
          >
            <template v-slot:item="{ item, props }">
              <v-list-item v-bind="props">
                <template v-slot:prepend>
                  <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                    <v-icon size="16">mdi-teacher</v-icon>
                  </v-avatar>
                </template>
                <template v-slot:title>
                  <span class="text-body-2">{{ item.raw.firstName }} {{ item.raw.lastName }}</span>
                </template>
                <template v-slot:subtitle>
                  <span class="text-caption text-grey-darken-1">{{ item.raw.email }}</span>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <v-alert
            v-if="selectedTeacherId && selectedCourse?.teacher?._id === selectedTeacherId._id"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <span class="text-caption">This teacher is already assigned to this course</span>
          </v-alert>

          <v-alert
            v-if="selectedTeacherId && selectedCourse?.teacher && selectedCourse.teacher._id !== selectedTeacherId._id"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon icon="mdi-account-switch" size="14" class="mr-2"></v-icon>
              <span class="text-caption">
                Changing from {{ selectedCourse.teacher.firstName }} {{ selectedCourse.teacher.lastName }}
                to {{ selectedTeacherId.firstName }} {{ selectedTeacherId.lastName }}
              </span>
            </div>
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="assignDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :loading="assigning" 
            :disabled="!selectedTeacherId || selectedTeacherId?._id === selectedCourse?.teacher?._id"
            @click="assignTeacher"
            rounded="pill"
          >
            {{ selectedCourse?.teacher ? 'Update' : 'Assign' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUserStore } from '@/stores/userStore'
import { inject } from 'vue'

const courseStore = useCourseStore()
const userStore = useUserStore()
const snackbar = inject('snackbar')

const assignDialog = ref(false)
const selectedCourse = ref(null)
const selectedTeacherId = ref(null)
const assigning = ref(false)

const filters = ref({
  search: '',
  department: null,
  assignment: null
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
  { title: 'Code', key: 'courseCode', sortable: true, width: '100' },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Enrolled', key: 'enrolledCount', sortable: true, width: '100' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center', width: '100' }
]

const unassignedHeaders = [
  { title: 'Code', key: 'courseCode', sortable: true, width: '100' },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center', width: '100' }
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
    snackbar.value = { show: true, text: 'Failed to load data', color: 'error' }
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
    await courseStore.fetchCourses()
    
    snackbar.value = {
      show: true,
      text: `Teacher assigned to ${selectedCourse.value.courseName}`,
      color: 'success'
    }
  } catch (error) {
    console.error('Failed to assign teacher:', error)
    snackbar.value = {
      show: true,
      text: error.response?.data?.message || 'Failed to assign teacher',
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
.section-underline {
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline:hover {
  width: 64px;
}

.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.border-top {
  border-top: 1px solid #E2E8F0;
}

.calm-data-table :deep(.v-data-table__th) {
  font-weight: 500;
  color: #64748B;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.calm-data-table :deep(td) {
  padding: 10px 12px;
}

.calm-data-table :deep(tr:hover) {
  background-color: rgba(99, 102, 241, 0.04);
}
</style>