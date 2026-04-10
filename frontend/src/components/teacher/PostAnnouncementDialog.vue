<!-- frontend/src/components/teacher/PostAnnouncementDialog.vue -->
<template>
  <v-card>
    <v-card-title class="text-h5 pa-4 bg-primary">
      <span class="text-white">Post Announcement</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" color="white"></v-btn>
    </v-card-title>
    
    <v-card-text class="pa-4">
      <v-form ref="announcementForm" v-model="formValid">
        <v-select
          v-model="formData.courseId"
          :items="courseOptions"
          label="Select Course"
          :rules="[v => !!v || 'Course is required']"
          variant="outlined"
          prepend-inner-icon="mdi-book"
          required
          :disabled="!!props.courseId"
        ></v-select>

        <v-text-field
          v-model="formData.title"
          label="Announcement Title"
          :rules="[v => !!v || 'Title is required']"
          variant="outlined"
          prepend-inner-icon="mdi-format-title"
          required
        ></v-text-field>

        <v-textarea
          v-model="formData.content"
          label="Announcement Content"
          :rules="[v => !!v || 'Content is required']"
          rows="5"
          variant="outlined"
          prepend-inner-icon="mdi-text"
          counter="1000"
          required
        ></v-textarea>

        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="formData.priority"
              :items="priorityOptions"
              label="Priority Level"
              variant="outlined"
              prepend-inner-icon="mdi-flag"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="formData.isPinned"
              label="Pin this announcement"
              color="primary"
              hint="Pinned announcements appear at the top"
              persistent-hint
            ></v-switch>
          </v-col>
        </v-row>

        <v-text-field
          v-model="formData.expiresAt"
          label="Expiration Date (Optional)"
          type="datetime-local"
          variant="outlined"
          prepend-inner-icon="mdi-calendar-expire"
          hint="Leave empty for no expiration"
          persistent-hint
        ></v-text-field>

        <!-- Quick Templates -->
        <v-card variant="tonal" class="pa-3 mt-2">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2">Quick Templates</span>
            <v-btn size="small" color="primary" variant="text" @click="useTemplate">
              Use Template
            </v-btn>
          </div>
          <v-chip-group column>
            <v-chip
              v-for="template in templates"
              :key="template.title"
              size="small"
              color="info"
              variant="outlined"
              @click="applyTemplate(template)"
            >
              {{ template.title }}
            </v-chip>
          </v-chip-group>
        </v-card>

        <!-- Preview -->
        <v-card variant="outlined" class="mt-3">
          <v-card-title class="text-subtitle-2 pa-3 bg-grey-lighten-3">
            <v-icon start icon="mdi-eye" size="small"></v-icon>
            Preview
          </v-card-title>
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-2">
              <v-avatar size="32" color="primary">
                <v-icon icon="mdi-teacher" size="small"></v-icon>
              </v-avatar>
              <div class="ml-2">
                <div class="text-caption font-weight-bold">{{ authStore.userName }}</div>
                <div class="text-caption text-medium-emphasis">Teacher</div>
              </div>
            </div>
            
            <v-chip 
              v-if="formData.priority !== 'normal'" 
              :color="getPriorityColor(formData.priority)" 
              size="x-small" 
              class="mb-2"
            >
              {{ formData.priority.toUpperCase() }}
            </v-chip>
            
            <h4 class="text-subtitle-1 mb-1">{{ formData.title || 'Announcement Title' }}</h4>
            <p class="text-caption">{{ truncateText(formData.content || 'Your announcement content will appear here...', 150) }}</p>
            
            <div v-if="formData.isPinned" class="mt-1">
              <v-icon icon="mdi-pin" size="x-small" color="warning"></v-icon>
              <span class="text-caption text-warning"> Pinned</span>
            </div>
          </v-card-text>
        </v-card>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('close')">Cancel</v-btn>
      <v-btn color="primary" :loading="posting" @click="postAnnouncement" :disabled="!formValid">
        <v-icon start icon="mdi-send"></v-icon>
        Post Announcement
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'
import { inject } from 'vue'

const props = defineProps({
  courseId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'posted'])

const authStore = useAuthStore()
const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const posting = ref(false)
const formValid = ref(false)
const announcementForm = ref(null)

const formData = ref({
  courseId: props.courseId,
  title: '',
  content: '',
  priority: 'normal',
  isPinned: false,
  expiresAt: ''
})

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

const templates = [
  {
    title: 'Assignment Reminder',
    content: 'This is a reminder that the assignment is due soon. Please make sure to submit your work before the deadline. Late submissions will be penalized as per the course policy.'
  },
  {
    title: 'Class Cancellation',
    content: 'Due to unforeseen circumstances, today\'s class is cancelled. Please check the course materials for self-study resources. The next class will proceed as scheduled.'
  },
  {
    title: 'Exam Schedule',
    content: 'The upcoming exam has been scheduled. Please review the syllabus for topics covered. Make sure to prepare thoroughly and reach out if you have any questions.'
  },
  {
    title: 'Holiday Greetings',
    content: 'Wishing all students a happy holiday season! Enjoy your break and stay safe. Classes will resume on the scheduled date.'
  },
  {
    title: 'Important Update',
    content: 'Please be advised of an important update regarding the course. Check the materials section for additional resources and updated guidelines.'
  }
]

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const getPriorityColor = (priority) => {
  const colors = {
    low: 'info',
    normal: 'primary',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'primary'
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const applyTemplate = (template) => {
  formData.value.title = template.title
  formData.value.content = template.content
}

const useTemplate = () => {
  // This will open a dialog to select template
  // For now, just show snackbar
  snackbar.value = { 
    show: true, 
    text: 'Click on any template to apply', 
    color: 'info' 
  }
}

const postAnnouncement = async () => {
  if (!announcementForm.value?.validate()) return
  
  posting.value = true
  try {
    await teacherService.postAnnouncement(formData.value.courseId, {
      title: formData.value.title,
      content: formData.value.content,
      priority: formData.value.priority,
      isPinned: formData.value.isPinned,
      expiresAt: formData.value.expiresAt ? new Date(formData.value.expiresAt).toISOString() : null
    })
    
    snackbar.value = { 
      show: true, 
      text: 'Announcement posted successfully!', 
      color: 'success' 
    }
    
    emit('posted')
    emit('close')
  } catch (error) {
    console.error('Failed to post announcement:', error)
    snackbar.value = { 
      show: true, 
      text: error.response?.data?.message || 'Failed to post announcement', 
      color: 'error' 
    }
  } finally {
    posting.value = false
  }
}

onMounted(() => {
  if (!props.courseId && teacherStore.courses.length > 0) {
    formData.value.courseId = teacherStore.courses[0]._id
  }
})
</script>