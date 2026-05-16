<!-- frontend/src/views/admin/SchoolAnnouncements.vue -->
<template>
  <div class="school-announcements">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap mb-6">
        <div>
          <h1 class="text-h4 font-weight-light mb-2">School Announcements</h1>
          <div class="section-underline"></div>
        </div>
        <v-btn color="primary" @click="openCreateDialog" rounded="pill" class="mt-3 mt-sm-0">
          <v-icon start icon="mdi-plus" size="16"></v-icon>
          Post Announcement
        </v-btn>
      </div>

      <!-- Filters -->
      <v-card variant="outlined" class="mb-4">
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.priority"
                label="Priority"
                clearable
                :items="priorityOptions"
                variant="outlined"
                density="comfortable"
              >
                <template v-slot:selection="{ item }">
                  <v-chip :color="getPriorityColor(item.value)" size="x-small" variant="tonal">
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.targetAudience"
                label="Target Audience"
                clearable
                :items="audienceOptions"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="filters.search"
                label="Search announcements"
                prepend-inner-icon="mdi-magnify"
                clearable
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Pinned Announcements -->
      <div v-if="filteredPinnedAnnouncements.length > 0" class="mb-4">
        <div class="d-flex align-center mb-3">
          <v-icon icon="mdi-pin" color="warning" size="18" class="mr-2"></v-icon>
          <h2 class="text-subtitle-1 font-weight-light">Pinned Announcements</h2>
        </div>
        <v-row>
          <v-col
            v-for="announcement in filteredPinnedAnnouncements"
            :key="announcement._id"
            cols="12"
          >
            <AnnouncementCard
              :announcement="announcement"
              @edit="editAnnouncement"
              @delete="confirmDelete"
              @toggle-pin="togglePin"
            />
          </v-col>
        </v-row>
      </div>

      <!-- Normal Announcements -->
      <div>
        <div class="d-flex align-center justify-space-between mb-3">
          <h2 class="text-subtitle-1 font-weight-light">All Announcements</h2>
          <v-chip v-if="filteredNormalAnnouncements.length" size="x-small" variant="tonal">
            {{ filteredNormalAnnouncements.length }} total
          </v-chip>
        </div>
        <v-row>
          <v-col
            v-for="announcement in filteredNormalAnnouncements"
            :key="announcement._id"
            cols="12"
          >
            <AnnouncementCard
              :announcement="announcement"
              @edit="editAnnouncement"
              @delete="confirmDelete"
              @toggle-pin="togglePin"
            />
          </v-col>
          
          <v-col v-if="filteredNormalAnnouncements.length === 0 && filteredPinnedAnnouncements.length === 0" cols="12">
            <v-card variant="outlined" class="text-center pa-8">
              <v-icon icon="mdi-bullhorn" size="48" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
              <div class="text-h6 font-weight-light text-grey-darken-1">No announcements found</div>
              <div class="text-caption text-grey-darken-1 mt-1">
                {{ filters.search ? 'Try adjusting your search filters' : 'Click "Post Announcement" to create one' }}
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-container>

    <!-- Announcement Form Dialog -->
    <v-dialog v-model="dialog" max-width="700px" scrollable>
      <v-card>
        <v-card-title class="pa-4 d-flex align-center justify-space-between border-bottom">
          <span class="text-h6 font-weight-light">{{ editingAnnouncement ? 'Edit Announcement' : 'Post Announcement' }}</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4" style="max-height: 65vh; overflow-y: auto;">
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="formData.title"
              label="Title"
              :rules="[v => !!v || 'Required']"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="formData.content"
              label="Content"
              rows="5"
              :rules="[v => !!v || 'Required']"
              variant="outlined"
              required
            ></v-textarea>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.targetAudience"
                  label="Target Audience"
                  :items="audienceOptions"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.priority"
                  label="Priority"
                  :items="priorityOptions"
                  :rules="[v => !!v || 'Required']"
                  variant="outlined"
                  required
                >
                  <template v-slot:selection="{ item }">
                    <v-chip :color="getPriorityColor(item.value)" size="x-small" variant="tonal">
                      {{ item.title }}
                    </v-chip>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isPinned"
                  label="Pin this announcement"
                  color="primary"
                  hide-details
                ></v-switch>
                <div class="text-caption text-grey-darken-1 mt-1">Pinned announcements appear at the top</div>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isActive"
                  label="Active"
                  color="success"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
            
            <v-text-field
              v-if="formData.expiresAt"
              v-model="formData.expiresAt"
              label="Expires At"
              type="datetime-local"
              variant="outlined"
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="primary" :loading="announcementStore.loading" @click="saveAnnouncement" rounded="pill">
            {{ editingAnnouncement ? 'Update' : 'Post' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6 font-weight-light pa-4 border-bottom">Delete Announcement</v-card-title>
        <v-card-text class="pa-4">
          Delete <strong>"{{ deleteItem?.title }}"</strong>?
          <div class="text-error text-caption mt-2">This action cannot be undone.</div>
        </v-card-text>
        <v-card-actions class="pa-4 border-top">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="announcementStore.loading" @click="deleteAnnouncement" rounded="pill">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import AnnouncementCard from '@/components/admin/AnnouncementCard.vue'
import { inject } from 'vue'

const announcementStore = useAnnouncementStore()
const snackbar = inject('snackbar')

const dialog = ref(false)
const deleteDialog = ref(false)
const valid = ref(false)
const editingAnnouncement = ref(null)
const deleteItem = ref(null)

const filters = ref({
  priority: null,
  targetAudience: null,
  search: ''
})

const priorityOptions = [
  { title: 'Low', value: 'low' },
  { title: 'Normal', value: 'normal' },
  { title: 'High', value: 'high' },
  { title: 'Urgent', value: 'urgent' }
]

const audienceOptions = [
  { title: 'Everyone', value: 'all' },
  { title: 'Students Only', value: 'students' },
  { title: 'Teachers Only', value: 'teachers' },
  { title: 'Admins Only', value: 'admins' }
]

const formData = ref({
  title: '',
  content: '',
  targetAudience: 'all',
  priority: 'normal',
  isPinned: false,
  isActive: true,
  expiresAt: null
})

const filteredPinnedAnnouncements = computed(() => {
  let announcements = announcementStore.getPinnedAnnouncements
  
  if (filters.value.priority) {
    announcements = announcements.filter(a => a.priority === filters.value.priority)
  }
  if (filters.value.targetAudience) {
    announcements = announcements.filter(a => a.targetAudience === filters.value.targetAudience)
  }
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    announcements = announcements.filter(a => 
      a.title.toLowerCase().includes(search) || 
      a.content.toLowerCase().includes(search)
    )
  }
  
  return announcements
})

const filteredNormalAnnouncements = computed(() => {
  let announcements = announcementStore.getNormalAnnouncements
  
  if (filters.value.priority) {
    announcements = announcements.filter(a => a.priority === filters.value.priority)
  }
  if (filters.value.targetAudience) {
    announcements = announcements.filter(a => a.targetAudience === filters.value.targetAudience)
  }
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    announcements = announcements.filter(a => 
      a.title.toLowerCase().includes(search) || 
      a.content.toLowerCase().includes(search)
    )
  }
  
  return announcements
})

const getPriorityColor = (priority) => {
  const colors = {
    low: 'info',
    normal: 'primary',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'grey'
}

const loadAnnouncements = async () => {
  try {
    await announcementStore.fetchAnnouncements()
  } catch (error) {
    console.error('Failed to load announcements:', error)
  }
}

const openCreateDialog = () => {
  editingAnnouncement.value = null
  formData.value = {
    title: '',
    content: '',
    targetAudience: 'all',
    priority: 'normal',
    isPinned: false,
    isActive: true,
    expiresAt: null
  }
  dialog.value = true
}

const editAnnouncement = (announcement) => {
  editingAnnouncement.value = announcement
  formData.value = {
    title: announcement.title,
    content: announcement.content,
    targetAudience: announcement.targetAudience,
    priority: announcement.priority,
    isPinned: announcement.isPinned,
    isActive: announcement.isActive,
    expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : null
  }
  dialog.value = true
}

const saveAnnouncement = async () => {
  if (!valid.value) return
  
  try {
    if (editingAnnouncement.value) {
      await announcementStore.updateAnnouncement(editingAnnouncement.value._id, formData.value)
      snackbar.value = { show: true, text: 'Announcement updated!', color: 'success' }
    } else {
      await announcementStore.createAnnouncement(formData.value)
      snackbar.value = { show: true, text: 'Announcement posted!', color: 'success' }
    }
    dialog.value = false
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to save announcement:', error)
    snackbar.value = { show: true, text: 'Failed to save announcement', color: 'error' }
  }
}

const togglePin = async (announcement) => {
  try {
    await announcementStore.updateAnnouncement(announcement._id, {
      isPinned: !announcement.isPinned
    })
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to toggle pin:', error)
  }
}

const confirmDelete = (announcement) => {
  deleteItem.value = announcement
  deleteDialog.value = true
}

const deleteAnnouncement = async () => {
  try {
    await announcementStore.deleteAnnouncement(deleteItem.value._id)
    deleteDialog.value = false
    await loadAnnouncements()
    snackbar.value = { show: true, text: 'Announcement deleted', color: 'success' }
  } catch (error) {
    console.error('Failed to delete announcement:', error)
    snackbar.value = { show: true, text: 'Failed to delete announcement', color: 'error' }
  }
}

watch([() => filters.value.priority, () => filters.value.targetAudience, () => filters.value.search], () => {
  // Filters are reactive via computed properties
}, { deep: true })

onMounted(() => {
  loadAnnouncements()
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
</style>