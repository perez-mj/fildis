<!-- frontend/src/components/teacher/CreateAssignmentDialog.vue -->
<template>
  <v-card>
    <v-card-title class="text-h5 pa-4 bg-primary">
      <span class="text-white">{{ isEditing ? 'Edit Assignment' : 'Create New Assignment' }}</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" color="white"></v-btn>
    </v-card-title>
    
    <v-card-text class="pa-4" style="max-height: 70vh; overflow-y: auto;">
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
          rows="4"
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
                v => !!v || 'Max score is required',
                v => v > 0 || 'Max score must be greater than 0',
                v => v <= 100 || 'Max score cannot exceed 100'
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
                v => !!v || 'Passing score is required',
                v => v >= 0 || 'Passing score must be 0 or greater',
                v => v <= formData.maxScore || 'Passing score cannot exceed max score'
              ]"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-switch
              v-model="formData.isActive"
              label="Assignment Active"
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
              :rules="[v => !!v || 'Available from date is required']"
              variant="outlined"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.dueDate"
              label="Due Date"
              type="datetime-local"
              :rules="[v => !!v || 'Due date is required']"
              variant="outlined"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.availableUntil"
              label="Available Until (Optional)"
              type="datetime-local"
              variant="outlined"
              hint="Leave empty for no end date"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.allowedFileTypes"
              label="Allowed File Types"
              placeholder="pdf, doc, docx, jpg, png"
              variant="outlined"
              hint="Comma-separated list. Leave empty for defaults"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="formData.maxFileSize"
              label="Max File Size (MB)"
              type="number"
              variant="outlined"
              hint="Leave empty for default (10MB)"
              :rules="[
                v => !v || v > 0 || 'File size must be greater than 0',
                v => !v || v <= 100 || 'File size cannot exceed 100MB'
              ]"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-card variant="outlined" class="pa-3 mt-2">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2">Assignment Attachments (Optional)</span>
            <v-btn size="small" color="primary" variant="text" @click="addAttachment">
              <v-icon start icon="mdi-plus"></v-icon>
              Add File
            </v-btn>
          </div>
          
          <div v-for="(file, index) in formData.attachments" :key="index" class="mb-2">
            <v-file-input
              v-model="formData.attachments[index]"
              :label="`Attachment ${index + 1}`"
              accept=".pdf,.doc,.docx,.txt,.jpg,.png,.zip"
              variant="outlined"
              density="compact"
              show-size
            >
              <template v-slot:append>
                <v-btn icon="mdi-close" size="small" variant="text" @click="removeAttachment(index)"></v-btn>
              </template>
            </v-file-input>
          </div>
          
          <v-alert type="info" variant="tonal" class="mt-2">
            <div class="text-caption">
              <v-icon icon="mdi-google-drive" size="small"></v-icon>
              Attachments will be uploaded to Google Drive and shared with students.
            </div>
          </v-alert>
        </v-card>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" :loading="saving" @click="saveAssignment" :disabled="!formValid">
        {{ isEditing ? 'Update' : 'Create' }} Assignment
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

// ==================== TIMEZONE HELPER FUNCTIONS FOR PHILIPPINES (UTC+8) ====================

/**
 * Convert UTC date string from database to LOCAL datetime-local input format
 */
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

/**
 * Convert LOCAL datetime from form input to UTC for storage
 */
const localDateTimeToUTC = (localDateTimeString) => {
  if (!localDateTimeString) return null
  const date = new Date(localDateTimeString)
  if (isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Format Date object to LOCAL datetime-local input format
 */
const formatDateToLocalInput = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Get current date/time in Philippine timezone
 */
const getCurrentPhilippineTime = () => {
  return new Date()
}

/**
 * Add hours to local date
 */
const addHoursToLocalDate = (date, hours) => {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

/**
 * Add days to local date
 */
const addDaysToLocalDate = (date, days) => {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

// ==================== END OF TIMEZONE HELPER FUNCTIONS ====================

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const addAttachment = () => {
  formData.value.attachments.push(null)
}

const removeAttachment = (index) => {
  formData.value.attachments.splice(index, 1)
}

const saveAssignment = async () => {
  const isValid = await assignmentForm.value?.validate()
  if (!isValid) return
  
  saving.value = true
  
  try {
    const submitData = new FormData()
    submitData.append('title', formData.value.title)
    submitData.append('description', formData.value.description)
    submitData.append('instructions', formData.value.instructions || '')
    submitData.append('maxScore', formData.value.maxScore.toString())
    submitData.append('passingScore', formData.value.passingScore.toString())
    submitData.append('isActive', formData.value.isActive.toString())
    
    // Convert local datetime to UTC for storage
    if (formData.value.availableFrom) {
      const availableFromUTC = localDateTimeToUTC(formData.value.availableFrom)
      if (availableFromUTC) submitData.append('availableFrom', availableFromUTC)
    }
    
    if (formData.value.dueDate) {
      const dueDateUTC = localDateTimeToUTC(formData.value.dueDate)
      if (dueDateUTC) submitData.append('dueDate', dueDateUTC)
    }
    
    if (formData.value.availableUntil) {
      const availableUntilUTC = localDateTimeToUTC(formData.value.availableUntil)
      if (availableUntilUTC) submitData.append('availableUntil', availableUntilUTC)
    }
    
    if (formData.value.allowedFileTypes) {
      submitData.append('allowedFileTypes', formData.value.allowedFileTypes)
    }
    if (formData.value.maxFileSize) {
      submitData.append('maxFileSize', (formData.value.maxFileSize * 1024 * 1024).toString())
    }
    
    formData.value.attachments.forEach((file) => {
      if (file && file instanceof File) {
        submitData.append('attachments', file)
      }
    })
    
    const courseId = formData.value.courseId || props.courseId
    
    if (isEditing.value && props.assignment) {
      await teacherService.updateAssignment(props.assignment._id, Object.fromEntries(submitData))
      snackbar.value = { show: true, text: 'Assignment updated successfully!', color: 'success' }
    } else {
      await teacherService.createAssignment(courseId, submitData)
      snackbar.value = { show: true, text: 'Assignment created successfully!', color: 'success' }
    }
    
    emit('created')
    emit('close')
  } catch (error) {
    console.error('Failed to save assignment:', error)
    snackbar.value = { 
      show: true, 
      text: error.response?.data?.message || 'Failed to save assignment', 
      color: 'error' 
    }
  } finally {
    saving.value = false
  }
}

// Set default dates for new assignment
const setDefaultDates = () => {
  const now = getCurrentPhilippineTime()
  const availableFrom = addHoursToLocalDate(now, 1)
  const dueDate = addDaysToLocalDate(availableFrom, 7)
  
  formData.value.availableFrom = formatDateToLocalInput(availableFrom)
  formData.value.dueDate = formatDateToLocalInput(dueDate)
}

// Watch for assignment prop changes (for editing)
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

// Set default dates for new assignment
onMounted(() => {
  if (!props.assignment) {
    setDefaultDates()
  }
  
  if (!props.courseId && teacherStore.courses.length > 0 && !isEditing.value) {
    formData.value.courseId = teacherStore.courses[0]._id
  }
})
</script>