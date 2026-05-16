<!-- frontend/src/views/admin/ManageTeachers.vue -->
<template>
  <div class="manage-teachers">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap mb-6">
        <div>
          <h1 class="text-h4 font-weight-light mb-2">Manage Teachers</h1>
          <div class="section-underline"></div>
        </div>
        <v-btn color="primary" @click="openCreateDialog" rounded="pill" class="mt-3 mt-sm-0">
          <v-icon start icon="mdi-plus" size="16"></v-icon>
          Add Teacher
        </v-btn>
      </div>

      <!-- Teachers Table -->
      <v-card variant="outlined">
        <v-card-text>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search teachers"
            density="comfortable"
            hide-details
            variant="underlined"
            clearable
          ></v-text-field>
        </v-card-text>
        <v-data-table
          :headers="headers"
          :items="teachers"
          :search="search"
          :loading="userStore.loading"
          :items-per-page="10"
          class="calm-data-table"
        >
          <template v-slot:item.fullName="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" color="primary" variant="tonal" class="mr-2">
                <span class="text-caption font-weight-medium">{{ getInitials(item.firstName, item.lastName) }}</span>
              </v-avatar>
              <span>{{ item.firstName }} {{ item.lastName }}</span>
            </div>
          </template>

          <template v-slot:item.department="{ item }">
            <v-chip color="primary" size="x-small" variant="tonal">{{ item.department || 'N/A' }}</v-chip>
          </template>

          <template v-slot:item.specialization="{ item }">
            <div class="d-flex flex-wrap ga-1">
              <v-chip
                v-for="spec in item.specialization?.slice(0, 2)"
                :key="spec"
                size="x-small"
                color="info"
                variant="tonal"
              >
                {{ spec }}
              </v-chip>
              <v-chip v-if="item.specialization?.length > 2" size="x-small" variant="tonal">
                +{{ item.specialization.length - 2 }}
              </v-chip>
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
              @click="editTeacher(item)"
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
              <v-icon icon="mdi-school" size="48" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
              <div class="text-h6 font-weight-light text-grey-darken-1">No teachers found</div>
              <div class="text-caption text-grey-darken-1 mt-1">Click Add Teacher to get started</div>
            </div>
          </template>
        </v-data-table>
      </v-card>
    </v-container>

    <!-- Teacher Form Dialog -->
    <v-dialog v-model="dialog" max-width="600px" scrollable>
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">{{ editingTeacher ? 'Edit Teacher' : 'Add Teacher' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4" style="max-height: 65vh; overflow-y: auto;">
          <v-form ref="form" v-model="valid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.firstName"
                  label="First Name"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="formData.lastName"
                  label="Last Name"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  type="email"
                  :rules="[v => !!v || 'Required', v => /.+@.+\..+/.test(v) || 'Invalid email']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" v-if="!editingTeacher">
                <v-text-field
                  v-model="formData.password"
                  label="Password"
                  type="password"
                  :rules="[v => !!v || 'Required', v => (v?.length || 0) >= 6 || 'Min 6 characters']"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="formData.department"
                  label="Department"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
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
                  variant="outlined"
                  hint="Press Enter to add specialization"
                  persistent-hint
                ></v-combobox>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="formData.isActive"
                  label="Active Account"
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
          <v-btn color="primary" :loading="userStore.loading" @click="saveTeacher" rounded="pill">
            {{ editingTeacher ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-light pa-4 border-bottom">Delete Teacher</v-card-title>
        <v-card-text class="pa-4">
          Delete <strong>{{ deleteItem?.firstName }} {{ deleteItem?.lastName }}</strong>?
          <div class="text-error text-caption mt-2">This action cannot be undone.</div>
        </v-card-text>
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="userStore.loading" @click="deleteTeacher" rounded="pill">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'
import { inject } from 'vue'

const userStore = useUserStore()
const snackbar = inject('snackbar')

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

const getInitials = (firstName, lastName) => {
  return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`
}

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
      snackbar.value = { show: true, text: 'Teacher updated!', color: 'success' }
    } else {
      await userStore.createUser(formData.value)
      snackbar.value = { show: true, text: 'Teacher created!', color: 'success' }
    }
    dialog.value = false
    await loadTeachers()
  } catch (error) {
    console.error('Failed to save teacher:', error)
    snackbar.value = { show: true, text: 'Failed to save teacher', color: 'error' }
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
    snackbar.value = { show: true, text: 'Teacher deleted', color: 'success' }
  } catch (error) {
    console.error('Failed to delete teacher:', error)
    snackbar.value = { show: true, text: 'Failed to delete teacher', color: 'error' }
  }
}

onMounted(() => {
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

.ga-1 {
  gap: 4px;
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