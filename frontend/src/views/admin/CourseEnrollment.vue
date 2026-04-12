<!-- frontend/src/views/admin/CourseEnrollment.vue -->
 <template>
  <v-container fluid>

    <v-row>
      <!-- Select Course -->
      <v-col cols="12" md="4">
        <v-card elevation="2">
          <v-card-title class="bg-primary text-white pa-4">
            Select Course
          </v-card-title>
          <v-card-text class="pa-4">
            <v-select
              v-model="selectedCourseId"
              :items="courses"
              item-title="courseName"
              item-value="_id"
              label="Choose a course"
              placeholder="Select a course"
              return-object
              clearable
              @update:model-value="onCourseSelect"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    <div>
                      <strong>{{ item.raw.courseCode }}</strong> - {{ item.raw.courseName }}
                    </div>
                  </template>
                  <template v-slot:subtitle>
                    Teacher: {{ item.raw.teacher?.firstName }} {{ item.raw.teacher?.lastName }}
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
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3 pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <span class="text-h5">{{ selectedCourse.courseName }}</span>
                <v-chip class="ml-3" color="primary" size="small">{{ selectedCourse.courseCode }}</v-chip>
              </div>
              <v-chip :color="selectedCourse.isActive ? 'success' : 'error'">
                {{ selectedCourse.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey">Department</div>
                <div class="text-body-1">{{ selectedCourse.department }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey">Teacher</div>
                <div class="text-body-1">
                  {{ selectedCourse.teacher?.firstName }} {{ selectedCourse.teacher?.lastName }}
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey">Enrollment Status</div>
                <div class="text-body-1">
                  {{ selectedCourse.students?.length || 0 }} / {{ selectedCourse.maxStudents }} students
                  <v-progress-linear
                    :model-value="(selectedCourse.students?.length || 0) / selectedCourse.maxStudents * 100"
                    :color="getProgressColor(selectedCourse.students?.length || 0, selectedCourse.maxStudents)"
                    height="8"
                    class="mt-2"
                  ></v-progress-linear>
                </div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-subtitle-2 text-grey">Schedule</div>
                <div class="text-body-2">
                  {{ formatDate(selectedCourse.startDate) }} to {{ formatDate(selectedCourse.endDate) }}
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
        <v-card elevation="2">
          <v-card-title class="bg-success text-white pa-4">
            Enroll New Student
          </v-card-title>
          <v-card-text class="pa-4">
            <v-select
              v-model="selectedStudentId"
              :items="availableStudents"
              item-title="fullName"
              item-value="_id"
              label="Select Student"
              placeholder="Choose a student to enroll"
              return-object
              :disabled="isCourseFull"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:title>
                    {{ item.raw.firstName }} {{ item.raw.lastName }}
                  </template>
                  <template v-slot:subtitle>
                    ID: {{ item.raw.studentId }} | {{ item.raw.email }}
                  </template>
                </v-list-item>
              </template>
            </v-select>
            
            <v-alert
              v-if="isCourseFull"
              type="warning"
              variant="tonal"
              class="mt-4"
            >
              This course has reached maximum capacity ({{ selectedCourse.maxStudents }} students)
            </v-alert>

            <v-btn
              color="success"
              block
              class="mt-4"
              :disabled="!selectedStudentId || isCourseFull"
              :loading="enrolling"
              @click="enrollStudent"
            >
              <v-icon left>mdi-account-plus</v-icon>
              Enroll Student
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Enrolled Students List -->
      <v-col cols="12" md="7">
        <v-card elevation="2">
          <v-card-title class="bg-info text-white pa-4">
            Enrolled Students ({{ selectedCourse.students?.length || 0 }})
          </v-card-title>
          <v-card-text class="pa-0">
            <v-list>
              <v-list-item
                v-for="student in enrolledStudents"
                :key="student._id"
                :title="`${student.firstName} ${student.lastName}`"
                :subtitle="`ID: ${student.studentId} | ${student.email}`"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>
                <template v-slot:append>
                  <v-btn
                    icon
                    size="small"
                    color="error"
                    variant="text"
                    @click="confirmRemove(student)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
              
              <v-list-item v-if="enrolledStudents.length === 0">
                <div class="text-center pa-4 text-grey">
                  No students enrolled in this course yet
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Remove Student Dialog -->
    <v-dialog v-model="removeDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Remove Student</v-card-title>
        <v-card-text>
          Are you sure you want to remove {{ studentToRemove?.firstName }} {{ studentToRemove?.lastName }} 
          from {{ selectedCourse?.courseName }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="removing" @click="removeStudent">
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUserStore } from '@/stores/userStore'

const courseStore = useCourseStore()
const userStore = useUserStore()

const courses = ref([])
const selectedCourseId = ref(null)
const selectedCourse = ref(null)
const selectedStudentId = ref(null)
const enrolledStudents = ref([])
const enrolling = ref(false)
const removing = ref(false)
const removeDialog = ref(false)
const studentToRemove = ref(null)

const availableStudents = computed(() => {
  if (!selectedCourse.value) return userStore.students
  
  const enrolledIds = selectedCourse.value.students?.map(s => s._id) || []
  return userStore.students.filter(s => !enrolledIds.includes(s._id))
})

const isCourseFull = computed(() => {
  if (!selectedCourse.value) return false
  return (selectedCourse.value.students?.length || 0) >= selectedCourse.value.maxStudents
})

const getProgressColor = (current, max) => {
  const percentage = (current / max) * 100
  if (percentage >= 90) return 'error'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
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

const onCourseSelect = async (course) => {
  if (!course) {
    selectedCourse.value = null
    selectedStudentId.value = null
    enrolledStudents.value = []
    return
  }
  
  selectedCourse.value = course
  selectedStudentId.value = null
  
  // Fetch fresh course data to get populated students
  await courseStore.fetchCourse(course._id)
  selectedCourse.value = courseStore.currentCourse
  enrolledStudents.value = selectedCourse.value?.students || []
}

const enrollStudent = async () => {
  if (!selectedStudentId.value || !selectedCourse.value) return
  
  enrolling.value = true
  try {
    await courseStore.enrollStudent(selectedCourse.value._id, selectedStudentId.value._id)
    
    // Refresh course data
    await courseStore.fetchCourse(selectedCourse.value._id)
    selectedCourse.value = courseStore.currentCourse
    enrolledStudents.value = selectedCourse.value?.students || []
    selectedStudentId.value = null
    
    // Refresh courses list
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
  } catch (error) {
    console.error('Failed to enroll student:', error)
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
    
    // Refresh course data
    await courseStore.fetchCourse(selectedCourse.value._id)
    selectedCourse.value = courseStore.currentCourse
    enrolledStudents.value = selectedCourse.value?.students || []
    
    // Refresh courses list
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
    
    removeDialog.value = false
    studentToRemove.value = null
  } catch (error) {
    console.error('Failed to remove student:', error)
  } finally {
    removing.value = false
  }
}

onMounted(() => {
  loadCourses()
  loadStudents()
})
</script>