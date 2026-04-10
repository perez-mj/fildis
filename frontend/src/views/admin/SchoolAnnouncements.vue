<!-- frontend/src/views/admin/SchoolAnnouncements.vue -->
 <template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold">School Announcements</h1>
            <div class="text-subtitle-1 text-grey mt-1">
              Manage school-wide announcements for all users
            </div>
          </div>
          <v-btn color="primary" size="large" @click="openCreateDialog">
            <v-icon left>mdi-plus</v-icon>
            Post Announcement
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="mb-4">
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="3">
                <v-select
                  v-model="filters.priority"
                  label="Priority"
                  clearable
                  :items="priorityOptions"
                >
                  <template v-slot:selection="{ item }">
                    <v-chip :color="getPriorityColor(item.value)" size="small">
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
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="filters.search"
                  label="Search announcements"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                ></v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Pinned Announcements -->
    <v-row v-if="filteredPinnedAnnouncements.length > 0">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-medium mb-3">
          <v-icon color="warning" class="mr-2">mdi-pin</v-icon>
          Pinned Announcements
        </h2>
      </v-col>
      <v-col
        v-for="announcement in filteredPinnedAnnouncements"
        :key="announcement._id"
        cols="12"
      >
        <announcement-card
          :announcement="announcement"
          @edit="editAnnouncement"
          @delete="confirmDelete"
          @toggle-pin="togglePin"
        />
      </v-col>
    </v-row>

    <!-- Normal Announcements -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h5 font-weight-medium mb-3">
          All Announcements
          <v-chip v-if="filteredNormalAnnouncements.length" class="ml-2">
            {{ filteredNormalAnnouncements.length }} total
          </v-chip>
        </h2>
      </v-col>
      <v-col
        v-for="announcement in filteredNormalAnnouncements"
        :key="announcement._id"
        cols="12"
      >
        <announcement-card
          :announcement="announcement"
          @edit="editAnnouncement"
          @delete="confirmDelete"
          @toggle-pin="togglePin"
        />
      </v-col>
      
      <v-col v-if="filteredNormalAnnouncements.length === 0 && filteredPinnedAnnouncements.length === 0" cols="12">
        <v-card class="text-center pa-8">
          <v-icon size="64" color="grey-lighten-1">mdi-bullhorn</v-icon>
          <div class="text-h6 text-grey mt-4">No announcements found</div>
          <div class="text-body-2 text-grey">
            {{ filters.search ? 'Try adjusting your search filters' : 'Click "Post Announcement" to create one' }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Announcement Form Dialog -->
    <v-dialog v-model="dialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title class="text-h5 bg-primary text-white pa-4">
          {{ editingAnnouncement ? 'Edit Announcement' : 'Post New Announcement' }}
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="valid">
            <v-text-field
              v-model="formData.title"
              label="Title"
              :rules="[v => !!v || 'Title is required']"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="formData.content"
              label="Content"
              rows="6"
              :rules="[v => !!v || 'Content is required']"
              required
            ></v-textarea>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.targetAudience"
                  label="Target Audience"
                  :items="audienceOptions"
                  :rules="[v => !!v || 'Target audience is required']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="formData.priority"
                  label="Priority"
                  :items="priorityOptions"
                  :rules="[v => !!v || 'Priority is required']"
                  required
                >
                  <template v-slot:item="{ item, props }">
                    <v-list-item v-bind="props">
                      <template v-slot:prepend>
                        <v-chip :color="getPriorityColor(item.value)" size="small">
                          {{ item.title }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isPinned"
                  label="Pin this announcement"
                  color="warning"
                ></v-switch>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-switch
                  v-model="formData.isActive"
                  label="Active"
                  color="success"
                ></v-switch>
              </v-col>
            </v-row>
            
            <v-text-field
              v-if="formData.expiresAt"
              v-model="formData.expiresAt"
              label="Expires At"
              type="datetime-local"
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="announcementStore.loading" @click="saveAnnouncement">
            {{ editingAnnouncement ? 'Update' : 'Post' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteItem?.title }}"?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="announcementStore.loading" @click="deleteAnnouncement">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import AnnouncementCard from '@/components/common/AnnouncementCard.vue'

const announcementStore = useAnnouncementStore()

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
  { title: 'Low', value: 'low', color: 'info' },
  { title: 'Normal', value: 'normal', color: 'success' },
  { title: 'High', value: 'high', color: 'warning' },
  { title: 'Urgent', value: 'urgent', color: 'error' }
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
    normal: 'success',
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
    } else {
      await announcementStore.createAnnouncement(formData.value)
    }
    dialog.value = false
    await loadAnnouncements()
  } catch (error) {
    console.error('Failed to save announcement:', error)
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
  } catch (error) {
    console.error('Failed to delete announcement:', error)
  }
}

// Watch for filter changes
watch([() => filters.value.priority, () => filters.value.targetAudience, () => filters.value.search], () => {
  // Filters are reactive via computed properties
}, { deep: true })

onMounted(() => {
  loadAnnouncements()
})
</script>