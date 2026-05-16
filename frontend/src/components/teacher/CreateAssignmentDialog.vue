<!-- frontend/src/components/teacher/CreateAssignmentDialog.vue -->
<template>
  <v-card>
    <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
      <span class="text-h6 font-weight-light">{{ isEditing ? 'Edit Assignment' : 'Create Assignment' }}</span>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
    </v-card-title>
    
    <v-card-text class="pa-4" style="max-height: 65vh; overflow-y: auto;">
      <v-form ref="assignmentForm" v-model="formValid">
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="formData.title"
              label="Assignment Title"
              :rules="[v => !!v || 'Title is required']"
              variant="outlined"
              required
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="formData.courseId"
              :items="courseOptions"
              label="Course"
              :rules="[v => !!v || 'Course is required']"
              variant="outlined"
              required
              :disabled="!!props.courseId || isEditing"
            ></v-select>
          </v-col>
        </v-row>

        <v-textarea
          v-model="formData.description"
          label="Description"
          :rules="[v => !!v || 'Description is required']"
          rows="3"
          variant="outlined"
        ></v-textarea>

        <v-textarea
          v-model="formData.instructions"
          label="Instructions (optional)"
          rows="3"
          variant="outlined"
          hint="Provide detailed instructions for students"
        ></v-textarea>

        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.maxScore"
              label="Max Score"
              type="number"
              :rules="[
                v => !!v || 'Required',
                v => v > 0 || 'Must be > 0',
                v => v <= 100 || 'Cannot exceed 100'
              ]"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="formData.passingScore"
              label="Passing Score"
              type="number"
              :rules="[
                v => !!v || 'Required',
                v => v >= 0 || 'Must be ≥ 0',
                v => v <= formData.maxScore || 'Cannot exceed max score'
              ]"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-switch
              v-model="formData.isActive"
              label="Active"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.availableFrom"
              label="Available From"
              type="datetime-local"
              :rules="[v => !!v || 'Required']"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.dueDate"
              label="Due Date"
              type="datetime-local"
              :rules="[v => !!v || 'Required']"
              variant="outlined"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-text-field
          v-model="formData.allowedFileTypes"
          label="Allowed File Types"
          placeholder="pdf, doc, docx, jpg, png"
          variant="outlined"
          hint="Comma-separated, leave empty for defaults"
        ></v-text-field>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="pa-4 border-top">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('close')" rounded="pill">Cancel</v-btn>
      <v-btn color="primary" :loading="saving" @click="saveAssignment" :disabled="!formValid" rounded="pill">
        {{ isEditing ? 'Update' : 'Create' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'
import { inject } from 'vue'

const props = defineProps({
  courseId: {
    type: String,
    default: null
  },
  assignment: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'created'])

const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const saving = ref(false)
const formValid = ref(false)
const assignmentForm = ref(null)
const isEditing = ref(false)

const formData = ref({
  title: '',
  description: '',
  instructions: '',
  courseId: props.courseId,
  maxScore: 100,
  passingScore: 60,
  availableFrom: '',
  dueDate: '',
  availableUntil: '',
  isActive: true,
  allowedFileTypes: '',
  maxFileSize: null,
  attachments: []
})

// Timezone helper functions
const utcToLocalDateTimeInput = (utcDateString) => {
  if (!utcDateString) return ''
  const date = new Date(utcDateString)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const localDateTimeToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null
  const date = new Date(localDateTimeString)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

const formatDateToLocalInput = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const getCurrentPhilippineTime = () => new Date()
const addHoursToLocalDate = (date, hours) => new Date(date.getTime() + hours * 60 * 60 * 1000)
const addDaysToLocalDate = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000)

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const setDefaultDates = () => {
  const now = getCurrentPhilippineTime()
  const availableFrom = addHoursToLocalDate(now, 1)
  const dueDate = addDaysToLocalDate(availableFrom, 7)
  
  formData.value.availableFrom = formatDateToLocalInput(availableFrom)
  formData.value.dueDate = formatDateToLocalInput(dueDate)
}

const saveAssignment = async () => {
  const isValid = await assignmentForm.value?.validate()
  if (!isValid) return
  
  saving.value = true
  
  try {
    const submitData = {
      title: formData.value.title,
      description: formData.value.description,
      instructions: formData.value.instructions || '',
      maxScore: formData.value.maxScore,
      passingScore: formData.value.passingScore,
      isActive: formData.value.isActive,
      availableFrom: localDateTimeToUTC(formData.value.availableFrom),
      dueDate: localDateTimeToUTC(formData.value.dueDate),
      availableUntil: localDateTimeToUTC(formData.value.availableUntil),
      allowedFileTypes: formData.value.allowedFileTypes,
      maxFileSize: formData.value.maxFileSize ? formData.value.maxFileSize * 1024 * 1024 : null
    }
    
    const courseId = formData.value.courseId || props.courseId
    
    if (isEditing.value && props.assignment) {
      await teacherService.updateAssignment(props.assignment._id, submitData)
      snackbar.value = { show: true, text: 'Assignment updated!', color: 'success' }
    } else {
      await teacherService.createAssignment(courseId, submitData)
      snackbar.value = { show: true, text: 'Assignment created!', color: 'success' }
    }
    
    emit('created')
    emit('close')
  } catch (error) {
    console.error('Failed to save assignment:', error)
    snackbar.value = { 
      show: true, 
      text: error.response?.data?.message || 'Failed to save', 
      color: 'error' 
    }
  } finally {
    saving.value = false
  }
}

watch(() => props.assignment, (newAssignment) => {
  if (newAssignment) {
    isEditing.value = true
    formData.value = {
      title: newAssignment.title,
      description: newAssignment.description,
      instructions: newAssignment.instructions || '',
      courseId: typeof newAssignment.courseId === 'object' ? newAssignment.courseId._id : newAssignment.courseId,
      maxScore: newAssignment.maxScore,
      passingScore: newAssignment.passingScore,
      availableFrom: utcToLocalDateTimeInput(newAssignment.availableFrom),
      dueDate: utcToLocalDateTimeInput(newAssignment.dueDate),
      availableUntil: newAssignment.availableUntil ? utcToLocalDateTimeInput(newAssignment.availableUntil) : '',
      isActive: newAssignment.isActive,
      allowedFileTypes: newAssignment.allowedFileTypes?.join(', ') || '',
      maxFileSize: newAssignment.maxFileSize ? newAssignment.maxFileSize / (1024 * 1024) : null,
      attachments: []
    }
  }
}, { immediate: true })

onMounted(() => {
  if (!props.assignment) {
    setDefaultDates()
  }
  
  if (!props.courseId && teacherStore.courses.length > 0 && !isEditing.value) {
    formData.value.courseId = teacherStore.courses[0]._id
  }
})
</script>

<style scoped>
.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.border-top {
  border-top: 1px solid #E2E8F0;
}
</style>