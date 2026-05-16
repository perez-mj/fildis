<!-- frontend/src/components/teacher/PostAnnouncementDialog.vue -->
<template>
  <v-card>
    <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
      <span class="text-h6 font-weight-light">Post Announcement</span>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
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
              hide-details
            ></v-switch>
            <div class="text-caption text-grey-darken-1 mt-1">Pinned announcements appear at the top</div>
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
        <v-card variant="tonal" class="pa-3 mt-3">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption font-weight-medium">Quick Templates</span>
            <v-btn size="x-small" color="primary" variant="text" @click="showTemplateHint" rounded="pill">
              Use Template
            </v-btn>
          </div>
          <v-chip-group column>
            <v-chip
              v-for="template in templates"
              :key="template.title"
              size="x-small"
              color="primary"
              variant="outlined"
              @click="applyTemplate(template)"
            >
              {{ template.title }}
            </v-chip>
          </v-chip-group>
        </v-card>
      </v-form>
    </v-card-text>
    
    <v-card-actions class="pa-4 border-top">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('close')" rounded="pill">Cancel</v-btn>
      <v-btn color="primary" :loading="posting" @click="postAnnouncement" :disabled="!formValid" rounded="pill">
        <v-icon start icon="mdi-send" size="16"></v-icon>
        Post
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
  { title: 'Assignment Reminder', content: 'Reminder: The assignment is due soon. Please submit your work before the deadline.' },
  { title: 'Class Update', content: 'Please check the course materials for new resources and announcements.' },
  { title: 'Exam Schedule', content: 'The upcoming exam has been scheduled. Please review the syllabus for details.' }
]

const courseOptions = computed(() => {
  return teacherStore.courses.map(course => ({
    title: `${course.courseCode} - ${course.courseName}`,
    value: course._id
  }))
})

const applyTemplate = (template) => {
  formData.value.title = template.title
  formData.value.content = template.content
}

const showTemplateHint = () => {
  snackbar.value = { show: true, text: 'Click on any template to apply', color: 'info' }
}

const postAnnouncement = async () => {
  if (!announcementForm.value?.validate()) return
  
  posting.value = true
  try {
    const submitData = {
      title: formData.value.title,
      content: formData.value.content,
      priority: formData.value.priority,
      isPinned: formData.value.isPinned
    }
    
    if (formData.value.expiresAt) {
      submitData.expiresAt = new Date(formData.value.expiresAt).toISOString()
    }
    
    await teacherService.postAnnouncement(formData.value.courseId, submitData)
    
    snackbar.value = { show: true, text: 'Announcement posted!', color: 'success' }
    emit('posted')
    emit('close')
  } catch (error) {
    console.error('Failed to post announcement:', error)
    snackbar.value = { show: true, text: error.response?.data?.message || 'Failed to post', color: 'error' }
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

<style scoped>
.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.border-top {
  border-top: 1px solid #E2E8F0;
}
</style>