<!-- frontend/src/views/admin/CourseEnrollment.vue -->
<template>
  <div class="course-enrollment">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-light mb-2">Course Enrollment</h1>
        <div class="section-underline"></div>
      </div>

      <v-row>
        <!-- Select Course -->
        <v-col cols="12" md="4">
          <v-card variant="outlined">
            <v-card-title class="pa-3 border-bottom">
              <span class="text-subtitle-1 font-weight-light">Select Course</span>
            </v-card-title>
            <v-card-text class="pa-4">
              <v-select
                v-model="selectedCourseId"
                :items="courses"
                item-title="courseName"
                item-value="_id"
                label="Choose a course"
                placeholder="Select a course"
                clearable
                variant="outlined"
                @update:model-value="onCourseSelect"
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      <div class="text-body-2 font-weight-medium">
                        <strong>{{ item.raw.courseCode }}</strong> - {{ item.raw.courseName }}
                      </div>
                    </template>
                    <template v-slot:subtitle>
                      <span class="text-caption text-grey-darken-1">
                        Teacher: {{ item.raw.teacher?.firstName }} {{ item.raw.teacher?.lastName }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div>
                    <strong>{{ item.raw.courseCode }}</strong> - {{ item.raw.courseName }}
                  </div>
                </template>
              </v-select>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Course Info -->
        <v-col cols="12" md="8" v-if="selectedCourse">
          <v-card variant="outlined">
            <v-card-title class="pa-3 border-bottom">
              <div class="d-flex justify-space-between align-center flex-wrap">
                <div>
                  <span class="text-subtitle-1 font-weight-light">{{ selectedCourse.courseName }}</span>
                  <v-chip class="ml-2" color="primary" size="x-small" variant="tonal">
                    {{ selectedCourse.courseCode }}
                  </v-chip>
                </div>
                <v-chip :color="selectedCourse.isActive ? 'success' : 'grey'" size="x-small" variant="tonal">
                  {{ selectedCourse.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
              </div>
            </v-card-title>
            <v-card-text class="pa-4">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1">Department</div>
                  <div class="text-body-2">{{ selectedCourse.department || '—' }}</div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1">Teacher</div>
                  <div class="text-body-2">
                    {{ selectedCourse.teacher?.firstName }} {{ selectedCourse.teacher?.lastName || 'Not Assigned' }}
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="text-caption text-grey-darken-1">Enrollment Status</div>
                  <div class="text-body-2 mb-2">
                    {{ selectedCourse.students?.length || 0 }} / {{ selectedCourse.maxStudents || 50 }} students
                  </div>
                  <v-progress-linear
                    :model-value="(selectedCourse.students?.length || 0) / (selectedCourse.maxStudents || 50) * 100"
                    :color="getProgressColor((selectedCourse.students?.length || 0), (selectedCourse.maxStudents || 50))"
                    height="3"
                    rounded
                  ></v-progress-linear>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-caption text-grey-darken-1">Schedule</div>
                  <div class="text-body-2 text-grey-darken-1">
                    {{ formatDate(selectedCourse.startDate) }} — {{ formatDate(selectedCourse.endDate) }}
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="selectedCourse" class="mt-4">
        <!-- Enroll New Student -->
        <v-col cols="12" md="5">
          <v-card variant="outlined">
            <v-card-title class="pa-3 border-bottom">
              <span class="text-subtitle-1 font-weight-light">Enroll New Student</span>
            </v-card-title>
            <v-card-text class="pa-4">
              <v-select
                v-model="selectedStudentId"
                :items="availableStudents"
                item-title="displayName"
                item-value="_id"
                label="Select Student"
                placeholder="Choose a student to enroll"
                variant="outlined"
                :disabled="isCourseFull"
                clearable
              >
                <template v-slot:item="{ item, props }">
                  <v-list-item v-bind="props">
                    <template v-slot:title>
                      <span class="text-body-2">{{ item.raw.firstName }} {{ item.raw.lastName }}</span>
                    </template>
                    <template v-slot:subtitle>
                      <span class="text-caption text-grey-darken-1">
                        ID: {{ item.raw.studentId || 'N/A' }} • {{ item.raw.email }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <span class="text-body-2">{{ item.raw.firstName }} {{ item.raw.lastName }}</span>
                </template>
              </v-select>
              
              <v-alert
                v-if="isCourseFull"
                type="warning"
                variant="tonal"
                density="compact"
                class="mt-4"
              >
                <span class="text-caption">Course has reached max capacity ({{ selectedCourse.maxStudents }} students)</span>
              </v-alert>

              <v-btn
                color="success"
                block
                class="mt-4"
                :disabled="!selectedStudentId || isCourseFull"
                :loading="enrolling"
                @click="enrollStudent"
                rounded="pill"
              >
                <v-icon start icon="mdi-account-plus" size="16"></v-icon>
                Enroll Student
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Enrolled Students List -->
        <v-col cols="12" md="7">
          <v-card variant="outlined">
            <v-card-title class="pa-3 border-bottom">
              <span class="text-subtitle-1 font-weight-light">
                Enrolled Students ({{ selectedCourse.students?.length || 0 }})
              </span>
            </v-card-title>
            <v-list v-if="enrolledStudents.length" class="calm-list">
              <v-list-item v-for="student in enrolledStudents" :key="student._id" class="calm-list-item">
                <template v-slot:prepend>
                  <v-avatar size="32" color="primary" variant="tonal">
                    <v-icon icon="mdi-account" size="16"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ student.firstName }} {{ student.lastName }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey-darken-1">
                  ID: {{ student.studentId || 'N/A' }} • {{ student.email }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <v-btn
                    icon="mdi-delete"
                    size="x-small"
                    color="error"
                    variant="text"
                    @click="confirmRemove(student)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-6">
              <v-icon icon="mdi-account-group" size="32" color="grey-lighten-1" class="mb-2" opacity="0.5"></v-icon>
              <div class="text-caption text-grey-darken-1">No students enrolled yet</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Remove Student Dialog -->
    <v-dialog v-model="removeDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-light pa-4 border-bottom">Remove Student</v-card-title>
        <v-card-text class="pa-4">
          Remove <strong>{{ studentToRemove?.firstName }} {{ studentToRemove?.lastName }}</strong> from 
          <strong>{{ selectedCourse?.courseName }}</strong>?
          <div class="text-error text-caption mt-2">This action cannot be undone.</div>
        </v-card-text>
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="removeDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="removeStudent" rounded="pill">Remove</v-btn>
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

const courses = ref([])
const selectedCourseId = ref(null)
const selectedCourse = ref(null)
const selectedStudentId = ref(null)
const enrolledStudents = ref([])
const enrolling = ref(false)
const removing = ref(false)
const removeDialog = ref(false)
const studentToRemove = ref(null)

// Transform students to have displayName for the select
const availableStudents = computed(() => {
  if (!selectedCourse.value) return userStore.students
  
  const enrolledIds = selectedCourse.value.students?.map(s => s._id) || []
  const available = userStore.students.filter(s => !enrolledIds.includes(s._id))
  
  // Add displayName property for the select's item-title
  return available.map(student => ({
    ...student,
    displayName: `${student.firstName} ${student.lastName}`
  }))
})

const isCourseFull = computed(() => {
  if (!selectedCourse.value) return false
  return (selectedCourse.value.students?.length || 0) >= (selectedCourse.value.maxStudents || 50)
})

const getProgressColor = (current, max) => {
  const percentage = (current / max) * 100
  if (percentage >= 90) return 'error'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const loadCourses = async () => {
  try {
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
  } catch (error) {
    console.error('Failed to load courses:', error)
  }
}

const loadStudents = async () => {
  try {
    await userStore.fetchStudents()
  } catch (error) {
    console.error('Failed to load students:', error)
  }
}

const onCourseSelect = async (courseId) => {
  if (!courseId) {
    selectedCourse.value = null
    selectedStudentId.value = null
    enrolledStudents.value = []
    return
  }
  
  // Find the course by ID
  const course = courses.value.find(c => c._id === courseId)
  if (!course) return
  
  selectedCourse.value = course
  selectedStudentId.value = null
  
  await courseStore.fetchCourse(course._id)
  selectedCourse.value = courseStore.currentCourse || course
  enrolledStudents.value = selectedCourse.value?.students || []
}

const enrollStudent = async () => {
  if (!selectedStudentId.value || !selectedCourse.value) return
  
  enrolling.value = true
  try {
    await courseStore.enrollStudent(selectedCourse.value._id, selectedStudentId.value)
    
    await courseStore.fetchCourse(selectedCourse.value._id)
    selectedCourse.value = courseStore.currentCourse
    enrolledStudents.value = selectedCourse.value?.students || []
    selectedStudentId.value = null
    
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
    
    snackbar.value = { show: true, text: 'Student enrolled successfully!', color: 'success' }
  } catch (error) {
    console.error('Failed to enroll student:', error)
    snackbar.value = { show: true, text: 'Failed to enroll student', color: 'error' }
  } finally {
    enrolling.value = false
  }
}

const confirmRemove = (student) => {
  studentToRemove.value = student
  removeDialog.value = true
}

const removeStudent = async () => {
  if (!studentToRemove.value || !selectedCourse.value) return
  
  removing.value = true
  try {
    await courseStore.removeStudent(selectedCourse.value._id, studentToRemove.value._id)
    
    await courseStore.fetchCourse(selectedCourse.value._id)
    selectedCourse.value = courseStore.currentCourse
    enrolledStudents.value = selectedCourse.value?.students || []
    
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
    
    removeDialog.value = false
    studentToRemove.value = null
    
    snackbar.value = { show: true, text: 'Student removed successfully!', color: 'success' }
  } catch (error) {
    console.error('Failed to remove student:', error)
    snackbar.value = { show: true, text: 'Failed to remove student', color: 'error' }
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  loadCourses()
  loadStudents()
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

.calm-list {
  background: transparent;
}

.calm-list-item {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.calm-list-item:hover {
  transform: translateX(4px);
  background-color: rgba(99, 102, 241, 0.04);
}
</style>