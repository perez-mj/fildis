<!-- frontend/src/views/admin/ManageTeachers.vue -->
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <v-btn color="primary" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            Add Teacher
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Teachers Table -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="bg-grey-lighten-3">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="Search teachers"
              density="compact"
              hide-details
              variant="outlined"
            ></v-text-field>
          </v-card-title>
          <v-data-table
            :headers="headers"
            :items="teachers"
            :search="search"
            :loading="userStore.loading"
            items-per-page="10"
            class="elevation-0"
          >
            <template v-slot:item.fullName="{ item }">
              {{ item.firstName }} {{ item.lastName }}
            </template>

            <template v-slot:item.department="{ item }">
              <v-chip color="primary" size="small">{{ item.department || 'N/A' }}</v-chip>
            </template>

            <template v-slot:item.specialization="{ item }">
              <div class="d-flex flex-wrap gap-1">
                <v-chip
                  v-for="spec in item.specialization?.slice(0, 2)"
                  :key="spec"
                  size="x-small"
                  color="info"
                >
                  {{ spec }}
                </v-chip>
                <v-chip v-if="item.specialization?.length > 2" size="x-small">
                  +{{ item.specialization.length - 2 }}
                </v-chip>
              </div>
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
                @click="editTeacher(item)"
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

    <!-- Teacher Form Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ editingTeacher ? 'Edit Teacher' : 'Add New Teacher' }}
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
              <v-col cols="12" v-if="!editingTeacher">
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
                  v-model="formData.department"
                  label="Department"
                  :rules="[v => !!v || 'Department is required']"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-combobox
                  v-model="formData.specialization"
                  label="Specialization"
                  multiple
                  chips
                  clearable
                  hint="Press Enter to add specialization"
                  persistent-hint
                ></v-combobox>
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
          <v-btn color="primary" :loading="userStore.loading" @click="saveTeacher">
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
          Are you sure you want to delete {{ deleteItem?.firstName }} {{ deleteItem?.lastName }}?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="userStore.loading" @click="deleteTeacher">
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

const teachers = ref([])
const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const editingTeacher = ref(null)
const deleteItem = ref(null)

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  department: '',
  specialization: [],
  isActive: true,
  role: 'teacher'
})

const headers = [
  { title: 'Name', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Department', key: 'department', sortable: true },
  { title: 'Specialization', key: 'specialization', sortable: false },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' }
]

const loadTeachers = async () => {
  try {
    await userStore.fetchTeachers()
    teachers.value = userStore.teachers
  } catch (error) {
    console.error('Failed to load teachers:', error)
  }
}

const openCreateDialog = () => {
  editingTeacher.value = null
  formData.value = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    department: '',
    specialization: [],
    isActive: true,
    role: 'teacher'
  }
  dialog.value = true
}

const editTeacher = (teacher) => {
  editingTeacher.value = teacher
  formData.value = {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email,
    department: teacher.department,
    specialization: teacher.specialization || [],
    isActive: teacher.isActive,
    role: 'teacher'
  }
  dialog.value = true
}

const saveTeacher = async () => {
  if (!valid.value) return
  
  try {
    if (editingTeacher.value) {
      await userStore.updateUser(editingTeacher.value._id, formData.value)
    } else {
      await userStore.createUser(formData.value)
    }
    dialog.value = false
    await loadTeachers()
  } catch (error) {
    console.error('Failed to save teacher:', error)
  }
}

const confirmDelete = (teacher) => {
  deleteItem.value = teacher
  deleteDialog.value = true
}

const deleteTeacher = async () => {
  try {
    await userStore.deleteUser(deleteItem.value._id, 'teacher')
    deleteDialog.value = false
    await loadTeachers()
  } catch (error) {
    console.error('Failed to delete teacher:', error)
  }
}

onMounted(() => {
  loadTeachers()
})
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
</style>