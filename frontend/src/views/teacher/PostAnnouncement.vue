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

        <!-- Preview Panel - Now matches student view design -->
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="preview-card">
            <v-card-title class="pa-3 border-bottom">
              <span class="text-subtitle-1 font-weight-light">Preview</span>
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="preview-announcement-card rounded-xl" :class="{ 'preview-pinned': formData.isPinned }">
                <div class="preview-announcement-content">
                  <div class="preview-announcement-icon" :class="getPriorityClass(formData.priority)">
                    <v-icon :icon="getPriorityIcon(formData.priority)" size="24"></v-icon>
                  </div>
                  
                  <div class="preview-announcement-info">
                    <div class="preview-announcement-header">
                      <h3 class="preview-announcement-title">
                        {{ formData.title || 'Announcement Title' }}
                        <div class="title-accent" v-if="formData.isPinned"></div>
                      </h3>
                      <div class="preview-announcement-badges">
                        <v-chip v-if="formData.isPinned" size="x-small" color="primary" variant="light" class="rounded-pill">
                          <v-icon start size="10">mdi-pin</v-icon>
                          Pinned
                        </v-chip>
                        <v-chip v-if="formData.priority === 'urgent'" size="x-small" color="error" variant="light" class="rounded-pill">
                          <v-icon start size="10">mdi-alert</v-icon>
                          Urgent
                        </v-chip>
                      </div>
                    </div>
                    
                    <div class="preview-announcement-meta">
                      <span class="preview-meta-item">
                        <v-icon size="12">mdi-account-circle-outline</v-icon>
                        {{ authStore.userName || 'Teacher Name' }}
                      </span>
                      <span class="preview-meta-divider">•</span>
                      <span class="preview-meta-item">
                        <v-icon size="12">mdi-calendar-outline</v-icon>
                        Just now
                      </span>
                      <span v-if="formData.courseId" class="preview-meta-item">
                        <v-icon size="12">mdi-book-open-outline</v-icon>
                        {{ getSelectedCourseCode() }}
                      </span>
                    </div>
                    
                    <p class="preview-announcement-text">{{ formData.content || 'Your announcement content will appear here...' }}</p>
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

const getPriorityClass = (priority) => {
  const classes = {
    low: 'priority-low',
    normal: 'priority-normal',
    high: 'priority-high',
    urgent: 'priority-urgent'
  }
  return classes[priority] || 'priority-normal'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'mdi-information-outline',
    normal: 'mdi-bullhorn-outline',
    high: 'mdi-alert-outline',
    urgent: 'mdi-alert-circle-outline'
  }
  return icons[priority] || 'mdi-bullhorn-outline'
}

const getSelectedCourseCode = () => {
  if (!formData.value.courseId) return ''
  const course = teacherStore.courses.find(c => c._id === formData.value.courseId)
  return course ? course.courseCode : ''
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

/* Preview styles - matching student view exactly */
.preview-announcement-card {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  background: white;
  margin: 0;
}

.preview-announcement-card.preview-pinned {
  border-left: 3px solid #6366f1;
  background: rgba(99, 102, 241, 0.02);
}

.preview-announcement-content {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.preview-announcement-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.preview-announcement-icon.priority-low {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.preview-announcement-icon.priority-normal {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.preview-announcement-icon.priority-high {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.preview-announcement-icon.priority-urgent {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.preview-announcement-info {
  flex: 1;
}

.preview-announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.preview-announcement-title {
  font-size: 1rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-accent {
  width: 24px;
  height: 2px;
  background: #6366f1;
  border-radius: 2px;
}

.preview-announcement-badges {
  display: flex;
  gap: 6px;
}

.preview-announcement-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.preview-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #64748b;
}

.preview-meta-divider {
  color: #cbd5e1;
}

.preview-announcement-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #334155;
  margin: 0;
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

/* Responsive */
@media (max-width: 600px) {
  .preview-announcement-content {
    padding: 16px;
    gap: 12px;
  }
  
  .preview-announcement-icon {
    width: 40px;
    height: 40px;
  }
  
  .preview-announcement-icon .v-icon {
    font-size: 20px;
  }
  
  .preview-announcement-title {
    font-size: 0.9rem;
  }
  
  .preview-announcement-text {
    font-size: 0.85rem;
  }
  
  .preview-announcement-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>