<!-- frontend/src/views/teacher/PostAnnouncement.vue -->
<template>
  <div class="post-announcement">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-light mb-2">Post Announcement</h1>
        <div class="section-underline"></div>
      </div>

      <v-row>
        <v-col cols="12" md="8">
          <v-card variant="outlined">
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
                  rows="6"
                  variant="outlined"
                  prepend-inner-icon="mdi-text"
                  counter="2000"
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
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-4 border-top">
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="resetForm" rounded="pill">Clear</v-btn>
              <v-btn color="primary" :loading="posting" @click="postAnnouncement" :disabled="!formValid" rounded="pill">
                <v-icon start icon="mdi-send" size="16"></v-icon>
                Post Announcement
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Preview Panel -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="preview-card">
            <v-card-title class="pa-3 border-bottom">
              <span class="text-subtitle-1 font-weight-light">Preview</span>
            </v-card-title>
            <v-card-text class="pa-4">
              <div class="announcement-preview">
                <div class="d-flex align-center mb-3">
                  <v-avatar size="36" color="primary" variant="tonal">
                    <v-icon icon="mdi-school" size="18"></v-icon>
                  </v-avatar>
                  <div class="ml-3">
                    <div class="text-body-2 font-weight-medium">{{ authStore.userName }}</div>
                    <div class="text-caption text-grey-darken-1">Teacher • Just now</div>
                  </div>
                </div>
                
                <div class="preview-content">
                  <v-chip 
                    v-if="formData.priority !== 'normal'" 
                    :color="getPriorityColor(formData.priority)" 
                    size="x-small" 
                    variant="tonal"
                    class="mb-2"
                  >
                    {{ formData.priority.toUpperCase() }}
                  </v-chip>
                  
                  <h3 class="text-subtitle-1 font-weight-medium mb-1">{{ formData.title || 'Announcement Title' }}</h3>
                  <p class="text-body-2 text-grey-darken-1">{{ formData.content || 'Your announcement content will appear here...' }}</p>
                  
                  <div v-if="formData.isPinned" class="mt-2">
                    <v-icon icon="mdi-pin" size="12" color="warning"></v-icon>
                    <span class="text-caption text-warning"> Pinned</span>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Recent Announcements -->
          <v-card variant="outlined" class="mt-4">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              <v-icon start icon="mdi-history" size="16"></v-icon>
              Recent Announcements
            </v-card-title>
            <v-list v-if="recentAnnouncements.length" class="calm-list">
              <v-list-item v-for="announcement in recentAnnouncements.slice(0, 3)" :key="announcement._id" class="calm-list-item">
                <template v-slot:prepend>
                  <v-icon icon="mdi-message" size="16" color="primary"></v-icon>
                </template>
                <v-list-item-title class="text-caption font-weight-medium">{{ announcement.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey-darken-1">
                  {{ formatRelativeTime(announcement.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-4">
              <span class="text-caption text-grey-darken-1">No recent announcements</span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useTeacherStore } from '@/stores/teacherStore'
import teacherService from '@/services/teacherService'
import { inject } from 'vue'

const route = useRoute()
const authStore = useAuthStore()
const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const posting = ref(false)
const formValid = ref(false)
const recentAnnouncements = ref([])
const announcementForm = ref(null)

const formData = ref({
  courseId: null,
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

const formatRelativeTime = (date) => {
  if (!date) return 'N/A'
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
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
    
    snackbar.value = { 
      show: true, 
      text: 'Announcement posted successfully!', 
      color: 'success' 
    }
    
    resetForm()
    await loadRecentAnnouncements()
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

const resetForm = () => {
  formData.value = {
    courseId: route.query.course || null,
    title: '',
    content: '',
    priority: 'normal',
    isPinned: false,
    expiresAt: ''
  }
  announcementForm.value?.reset()
}

const loadRecentAnnouncements = async () => {
  try {
    const announcements = await teacherService.getMyAnnouncements()
    recentAnnouncements.value = announcements.slice(0, 5)
  } catch (error) {
    console.error('Failed to load recent announcements:', error)
  }
}

onMounted(async () => {
  if (teacherStore.courses.length === 0) {
    await teacherStore.fetchMyCourses()
  }
  
  if (route.query.course) {
    formData.value.courseId = route.query.course
  }
  
  await loadRecentAnnouncements()
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

.preview-card {
  position: sticky;
  top: 20px;
}

.announcement-preview {
  border-radius: 12px;
}

.calm-list {
  background: transparent;
}

.calm-list-item {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.calm-list-item:hover {
  transform: translateX(4px);
  background-color: rgba(99, 102, 241, 0.04);
}
</style>