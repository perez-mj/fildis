<!-- frontend/src/views/admin/ManageStudents.vue -->
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4 font-weight-bold">Manage Students</h1>
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            Add Student
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Students Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search students"
              density="compact"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="students"
            :search="search"
            :loading="userStore.loading"
            items-per-page="10"
            class="elevation-0"
          >
            <template v-slot:item.fullName="{ item }">
              {{ item.firstName }} {{ item.lastName }}
            </template>

            <template v-slot:item.studentId="{ item }">
              <v-chip color="info" size="small">{{ item.studentId || 'N/A' }}</v-chip>
            </template>

            <template v-slot:item.enrollmentDate="{ item }">
              {{ formatDate(item.enrollmentDate) }}
            </template>

            <template v-slot:item.coursesCount="{ item }">
              <v-chip color="primary" size="small">{{ item.courses?.length || 0 }} courses</v-chip>
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
                @click="editStudent(item)"
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

    <!-- Student Form Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ editingStudent ? 'Edit Student' : 'Add New Student' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.firstName"
                  label="First Name"
                  :rules="[v => !!v || 'First name is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.lastName"
                  label="Last Name"
                  :rules="[v => !!v || 'Last name is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  type="email"
                  :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Email must be valid']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" v-if="!editingStudent">
                <v-text-field
                  v-model="formData.password"
                  label="Password"
                  type="password"
                  :rules="[v => !!v || 'Password is required', v => (v?.length || 0) >= 6 || 'Password must be at least 6 characters']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.studentId"
                  label="Student ID"
                  :rules="[v => !!v || 'Student ID is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-date-input
                  v-model="formData.enrollmentDate"
                  label="Enrollment Date"
                  :rules="[v => !!v || 'Enrollment date is required']"
                  required
                ></v-date-input>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  label="Active Account"
                  color="success"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="userStore.loading" @click="saveStudent">
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
          Are you sure you want to delete {{ deleteItem?.firstName }} {{ deleteItem?.lastName}}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="userStore.loading" @click="deleteStudent">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const students = ref([])
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const editingStudent = ref(null)
const deleteItem = ref(null)

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  studentId: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
  isActive: true,
  role: 'student'
})

const headers = [
  { title: 'Name', key: 'fullName', sortable: true },
  { title: 'Student ID', key: 'studentId', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Enrollment Date', key: 'enrollmentDate', sortable: true },
  { title: 'Courses', key: 'coursesCount', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}

const loadStudents = async () => {
  try {
    await userStore.fetchStudents()
    students.value = userStore.students
  } catch (error) {
    console.error('Failed to load students:', error)
  }
}

const openCreateDialog = () => {
  editingStudent.value = null
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    isActive: true,
    role: 'student'
  }
  dialog.value = true
}

const editStudent = (student) => {
  editingStudent.value = student
  formData.value = {
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    studentId: student.studentId,
    enrollmentDate: student.enrollmentDate?.split('T')[0] || '',
    isActive: student.isActive,
    role: 'student'
  }
  dialog.value = true
}

const saveStudent = async () => {
  if (!valid.value) return
  
  try {
    if (editingStudent.value) {
      await userStore.updateUser(editingStudent.value._id, formData.value)
    } else {
      await userStore.createUser(formData.value)
    }
    dialog.value = false
    await loadStudents()
  } catch (error) {
    console.error('Failed to save student:', error)
  }
}

const confirmDelete = (student) => {
  deleteItem.value = student
  deleteDialog.value = true
}

const deleteStudent = async () => {
  try {
    await userStore.deleteUser(deleteItem.value._id, 'student')
    deleteDialog.value = false
    await loadStudents()
  } catch (error) {
    console.error('Failed to delete student:', error)
  }
}

onMounted(() => {
  loadStudents()
})
</script>