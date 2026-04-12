<!-- frontend/src/views/teacher/PostAnnouncement.vue -->
 <template>
  <div class="post-announcement">
    <v-container fluid>
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
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

                <!-- Attachments -->
                <v-card variant="outlined" class="pa-3 mt-2">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <span class="text-subtitle-2">Attachments (Optional)</span>
                    <v-btn size="small" color="primary" variant="text" @click="addAttachment">
                      <v-icon start icon="mdi-plus"></v-icon>
                      Add File
                    </v-btn>
                  </div>
                  
                  <div v-for="(file, index) in formData.attachments" :key="index" class="mb-2">
                    <v-file-input
                      v-model="formData.attachments[index]"
                      :label="`Attachment ${index + 1}`"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      variant="outlined"
                      density="compact"
                      show-size
                    >
                      <template v-slot:append>
                        <v-btn icon="mdi-close" size="small" variant="text" @click="removeAttachment(index)"></v-btn>
                      </template>
                    </v-file-input>
                  </div>
                </v-card>
              </v-form>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-spacer></v-spacer>
              <v-btn variant="text" @click="resetForm">Clear</v-btn>
              <v-btn color="primary" :loading="posting" @click="postAnnouncement" :disabled="!formValid">
                <v-icon start icon="mdi-send"></v-icon>
                Post Announcement
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Preview Panel -->
        <v-col cols="12" md="4">
          <v-card class="sticky-top" style="position: sticky; top: 20px;">
            <v-card-title class="text-h6 bg-grey-lighten-3 pa-3">
              <v-icon start icon="mdi-eye"></v-icon>
              Preview
            </v-card-title>
            <v-card-text class="pa-4">
              <div class="announcement-preview">
                <div class="d-flex align-center mb-3">
                  <v-avatar size="40" color="primary">
                    <v-icon icon="mdi-school"></v-icon>
                  </v-avatar>
                  <div class="ml-3">
                    <div class="font-weight-bold">{{ authStore.userName }}</div>
                    <div class="text-caption text-medium-emphasis">Teacher • Just now</div>
                  </div>
                </div>
                
                <div class="preview-content">
                  <v-chip 
                    v-if="formData.priority !== 'normal'" 
                    :color="getPriorityColor(formData.priority)" 
                    size="small" 
                    class="mb-2"
                  >
                    {{ formData.priority.toUpperCase() }} PRIORITY
                  </v-chip>
                  
                  <h3 class="text-h6 mb-2">{{ formData.title || 'Announcement Title' }}</h3>
                  <p class="text-body-2">{{ formData.content || 'Your announcement content will appear here...' }}</p>
                  
                  <div v-if="formData.attachments.some(a => a)" class="mt-3">
                    <v-divider class="mb-2"></v-divider>
                    <div class="text-caption text-medium-emphasis">
                      <v-icon icon="mdi-paperclip" size="small"></v-icon>
                      {{ formData.attachments.filter(a => a).length }} attachment(s)
                    </div>
                  </div>
                  
                  <div v-if="formData.isPinned" class="mt-2">
                    <v-chip color="warning" size="x-small" variant="outlined">
                      <v-icon start icon="mdi-pin" size="x-small"></v-icon>
                      Pinned
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Recent Announcements -->
          <v-card class="mt-4">
            <v-card-title class="text-subtitle-2 pa-3">
              <v-icon start icon="mdi-history"></v-icon>
              Recent Announcements
            </v-card-title>
            <v-divider></v-divider>
            <v-list v-if="recentAnnouncements.length" density="compact">
              <v-list-item v-for="announcement in recentAnnouncements.slice(0, 3)" :key="announcement._id">
                <template v-slot:prepend>
                  <v-icon icon="mdi-message" size="small"></v-icon>
                </template>
                <v-list-item-title class="text-caption font-weight-medium">{{ announcement.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  {{ formatRelativeTime(announcement.createdAt) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-4 text-caption text-medium-emphasis">
              No recent announcements
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
  expiresAt: '',
  attachments: []
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
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

const addAttachment = () => {
  formData.value.attachments.push(null)
}

const removeAttachment = (index) => {
  formData.value.attachments.splice(index, 1)
}

const postAnnouncement = async () => {
  if (!announcementForm.value?.validate()) return
  
  posting.value = true
  try {
    const submitData = new FormData()
    submitData.append('title', formData.value.title)
    submitData.append('content', formData.value.content)
    submitData.append('priority', formData.value.priority)
    submitData.append('isPinned', formData.value.isPinned)
    
    if (formData.value.expiresAt) {
      submitData.append('expiresAt', new Date(formData.value.expiresAt).toISOString())
    }
    
    formData.value.attachments.forEach((file, index) => {
      if (file) {
        submitData.append('attachments', file)
      }
    })
    
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
    expiresAt: '',
    attachments: []
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
  
  // Set course from query if provided
  if (route.query.course) {
    formData.value.courseId = route.query.course
  }
  
  await loadRecentAnnouncements()
})
</script>

<style scoped>
.sticky-top {
  position: sticky;
  top: 20px;
}

.announcement-preview {
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  padding: 16px;
  border: 1px solid rgba(var(--v-border-color), 0.1);
}

.preview-content {
  margin-top: 12px;
}
</style>