<!-- frontend/src/views/admin/ManageCourses.vue -->
<template>
  <div class="manage-courses">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap mb-6">
        <div>
          <h1 class="text-h4 font-weight-light mb-2">Manage Courses</h1>
          <div class="section-underline"></div>
        </div>
        <v-btn color="primary" @click="openCreateDialog" rounded="pill" class="mt-3 mt-sm-0">
          <v-icon start icon="mdi-plus" size="16"></v-icon>
          Create Course
        </v-btn>
      </div>

      <!-- Courses Table -->
      <v-card variant="outlined">
        <v-card-text>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search courses"
            density="comfortable"
            hide-details
            variant="underlined"
            clearable
          ></v-text-field>
        </v-card-text>
        <v-data-table
          :headers="headers"
          :items="courses"
          :search="search"
          :loading="courseStore.loading"
          :items-per-page="10"
          class="calm-data-table"
        >
          <template v-slot:item.courseCode="{ item }">
            <v-chip color="primary" size="x-small" variant="tonal">{{ item.courseCode }}</v-chip>
          </template>

          <template v-slot:item.credits="{ item }">
            <span class="text-caption">{{ item.credits }} credits</span>
          </template>

          <template v-slot:item.teacherName="{ item }">
            <span class="text-body-2" v-if="item.teacher">
              {{ item.teacher.firstName }} {{ item.teacher.lastName }}
            </span>
            <span v-else class="text-caption text-grey-darken-1">Not Assigned</span>
          </template>

          <template v-slot:item.enrolledCount="{ item }">
            <div class="d-flex align-center">
              <span class="text-body-2 mr-2">{{ item.students?.length || 0 }} / {{ item.maxStudents || 50 }}</span>
              <v-progress-linear
                :model-value="((item.students?.length || 0) / (item.maxStudents || 50)) * 100"
                :color="getProgressColor((item.students?.length || 0), (item.maxStudents || 50))"
                height="3"
                rounded
                style="width: 60px"
              ></v-progress-linear>
            </div>
          </template>

          <template v-slot:item.isActive="{ item }">
            <v-chip :color="item.isActive ? 'success' : 'grey'" size="x-small" variant="tonal">
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </template>

          <template v-slot:item.actions="{ item }">
            <v-btn
              size="x-small"
              color="primary"
              variant="text"
              icon="mdi-pencil"
              @click="editCourse(item)"
            ></v-btn>
            <v-btn
              size="x-small"
              color="error"
              variant="text"
              icon="mdi-delete"
              @click="confirmDelete(item)"
            ></v-btn>
          </template>

          <template v-slot:no-data>
            <div class="text-center pa-6">
              <v-icon icon="mdi-book-open-variant" size="48" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
              <div class="text-h6 font-weight-light text-grey-darken-1">No courses found</div>
              <div class="text-caption text-grey-darken-1 mt-1">Click Create Course to get started</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Course Form Dialog -->
    <v-dialog v-model="dialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">{{ editingCourse ? 'Edit Course' : 'Create Course' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4" style="max-height: 65vh; overflow-y: auto;">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.courseCode"
                  label="Course Code"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.courseName"
                  label="Course Name"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  rows="3"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.credits"
                  label="Credits"
                  type="number"
                  min="1"
                  max="6"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.department"
                  label="Department"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.semester"
                  label="Semester"
                  type="number"
                  min="1"
                  max="8"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.teacher"
                  :items="teachers"
                  item-title="fullName"
                  item-value="_id"
                  label="Assign Teacher"
                  variant="outlined"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.maxStudents"
                  label="Max Students"
                  type="number"
                  min="1"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.startDate"
                  label="Start Date"
                  type="date"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.endDate"
                  label="End Date"
                  type="date"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  label="Course Active"
                  color="primary"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="primary" :loading="courseStore.loading" @click="saveCourse" rounded="pill">
            {{ editingCourse ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-light pa-4 border-bottom">Delete Course</v-card-title>
        <v-card-text class="pa-4">
          Delete <strong>{{ deleteItem?.courseName }}</strong>?
          <div class="text-error text-caption mt-2">This also removes all materials and assignments.</div>
        </v-card-text>
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="courseStore.loading" @click="deleteCourse" rounded="pill">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUserStore } from '@/stores/userStore'
import { inject } from 'vue'

const courseStore = useCourseStore()
const userStore = useUserStore()
const snackbar = inject('snackbar')

const courses = ref([])
const teachers = ref([])
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const editingCourse = ref(null)
const deleteItem = ref(null)

const formData = ref({
  courseCode: '',
  courseName: '',
  description: '',
  credits: 3,
  department: '',
  semester: 1,
  teacher: null,
  maxStudents: 50,
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
  isActive: true
})

const headers = [
  { title: 'Code', key: 'courseCode', sortable: true },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Credits', key: 'credits', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Enrolled', key: 'enrolledCount', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const getProgressColor = (current, max) => {
  const percentage = (current / max) * 100
  if (percentage >= 90) return 'error'
  if (percentage >= 70) return 'warning'
  return 'success'
}

const loadCourses = async () => {
  try {
    await courseStore.fetchCourses()
    courses.value = courseStore.courses
  } catch (error) {
    console.error('Failed to load courses:', error)
  }
}

const loadTeachers = async () => {
  try {
    await userStore.fetchTeachers()
    teachers.value = userStore.teachers.map(t => ({
      ...t,
      fullName: `${t.firstName} ${t.lastName}`
    }))
  } catch (error) {
    console.error('Failed to load teachers:', error)
  }
}

const openCreateDialog = () => {
  editingCourse.value = null
  formData.value = {
    courseCode: '',
    courseName: '',
    description: '',
    credits: 3,
    department: '',
    semester: 1,
    teacher: null,
    maxStudents: 50,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
    isActive: true
  }
  dialog.value = true
}

const editCourse = (course) => {
  editingCourse.value = course
  formData.value = {
    courseCode: course.courseCode,
    courseName: course.courseName,
    description: course.description,
    credits: course.credits,
    department: course.department,
    semester: course.semester,
    teacher: course.teacher?._id || course.teacher,
    maxStudents: course.maxStudents,
    startDate: course.startDate?.split('T')[0] || '',
    endDate: course.endDate?.split('T')[0] || '',
    isActive: course.isActive
  }
  dialog.value = true
}

const saveCourse = async () => {
  if (!valid.value) return
  
  try {
    if (editingCourse.value) {
      await courseStore.updateCourse(editingCourse.value._id, formData.value)
      snackbar.value = { show: true, text: 'Course updated!', color: 'success' }
    } else {
      await courseStore.createCourse(formData.value)
      snackbar.value = { show: true, text: 'Course created!', color: 'success' }
    }
    dialog.value = false
    await loadCourses()
  } catch (error) {
    console.error('Failed to save course:', error)
    snackbar.value = { show: true, text: 'Failed to save course', color: 'error' }
  }
}

const confirmDelete = (course) => {
  deleteItem.value = course
  deleteDialog.value = true
}

const deleteCourse = async () => {
  try {
    await courseStore.deleteCourse(deleteItem.value._id)
    deleteDialog.value = false
    await loadCourses()
    snackbar.value = { show: true, text: 'Course deleted', color: 'success' }
  } catch (error) {
    console.error('Failed to delete course:', error)
    snackbar.value = { show: true, text: 'Failed to delete course', color: 'error' }
  }
}

onMounted(() => {
  loadCourses()
  loadTeachers()
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

.calm-data-table :deep(tr:hover) {
  background-color: rgba(99, 102, 241, 0.04);
}
</style>