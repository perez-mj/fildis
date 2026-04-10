<!-- frontend/src/views/admin/ManageCourses.vue -->
 <template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4 font-weight-bold">Manage Courses</h1>
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            Create Course
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Courses Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search courses"
              density="compact"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="courses"
            :search="search"
            :loading="courseStore.loading"
            items-per-page="10"
            class="elevation-0"
          >
            <template v-slot:item.courseCode="{ item }">
              <v-chip color="primary" size="small">{{ item.courseCode }}</v-chip>
            </template>

            <template v-slot:item.credits="{ item }">
              <v-chip size="small">{{ item.credits }} credits</v-chip>
            </template>

            <template v-slot:item.teacherName="{ item }">
              <span v-if="item.teacher">
                {{ item.teacher.firstName }} {{ item.teacher.lastName }}
              </span>
              <span v-else class="text-grey">Not Assigned</span>
            </template>

            <template v-slot:item.enrolledCount="{ item }">
              {{ item.students?.length || 0 }} / {{ item.maxStudents }}
            </template>

            <template v-slot:item.isActive="{ item }">
              <v-chip :color="item.isActive ? 'success' : 'error'" size="small">
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                size="small"
                color="primary"
                variant="text"
                @click="editCourse(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                color="error"
                variant="text"
                @click="confirmDelete(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Course Form Dialog -->
    <v-dialog v-model="dialog" max-width="700px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ editingCourse ? 'Edit Course' : 'Create New Course' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.courseCode"
                  label="Course Code"
                  :rules="[v => !!v || 'Course code is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.courseName"
                  label="Course Name"
                  :rules="[v => !!v || 'Course name is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="formData.description"
                  label="Description"
                  rows="3"
                  :rules="[v => !!v || 'Description is required']"
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
                  :rules="[v => !!v || 'Credits are required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.department"
                  label="Department"
                  :rules="[v => !!v || 'Department is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="formData.semester"
                  label="Semester"
                  type="number"
                  min="1"
                  max="8"
                  :rules="[v => !!v || 'Semester is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.teacher"
                  :items="teachers"
                  item-title="fullName"
                  item-value="_id"
                  label="Assign Teacher"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.maxStudents"
                  label="Maximum Students"
                  type="number"
                  min="1"
                  :rules="[v => !!v || 'Maximum students is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-date-input
                  v-model="formData.startDate"
                  label="Start Date"
                  :rules="[v => !!v || 'Start date is required']"
                  required
                ></v-date-input>
              </v-col>
              <v-col cols="12" md="6">
                <v-date-input
                  v-model="formData.endDate"
                  label="End Date"
                  :rules="[v => !!v || 'End date is required']"
                  required
                ></v-date-input>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  label="Course Active"
                  color="success"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="courseStore.loading" @click="saveCourse">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteItem?.courseName }}"?
          This will also remove all related materials and assignments.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="courseStore.loading" @click="deleteCourse">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCourseStore } from '@/stores/courseStore'
import { useUserStore } from '@/stores/userStore'

const courseStore = useCourseStore()
const userStore = useUserStore()

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
  { title: 'Course Code', key: 'courseCode', sortable: true },
  { title: 'Course Name', key: 'courseName', sortable: true },
  { title: 'Credits', key: 'credits', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Teacher', key: 'teacherName', sortable: true },
  { title: 'Enrolled', key: 'enrolledCount', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

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
    } else {
      await courseStore.createCourse(formData.value)
    }
    dialog.value = false
    await loadCourses()
  } catch (error) {
    console.error('Failed to save course:', error)
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
  } catch (error) {
    console.error('Failed to delete course:', error)
  }
}

onMounted(() => {
  loadCourses()
  loadTeachers()
})
</script>