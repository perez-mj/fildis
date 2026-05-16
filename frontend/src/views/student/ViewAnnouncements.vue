<!-- frontend/src/views/student/ViewAnnouncements.vue -->
<template>
  <v-container fluid class="announcements-container">
    <!-- Page Header -->
    <div class="page-header mb-6">
        <h1 class="text-h4 font-weight-light">Announcements</h1>
        <div class="header-accent"></div>
    </div>

    <!-- Minimalist Tabs -->
    <v-tabs v-model="tab" color="primary" class="custom-tabs mb-4" density="comfortable">
      <v-tab value="all" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-bullhorn-outline</v-icon>
        All
        <v-chip v-if="allAnnouncements.length > 0" size="x-small" color="primary" class="ml-2" density="comfortable">
          {{ allAnnouncements.length }}
        </v-chip>
      </v-tab>
      <v-tab value="school" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-school-outline</v-icon>
        School
      </v-tab>
      <v-tab value="courses" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-book-open-outline</v-icon>
        Courses
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="all">
        <AnnouncementsList :announcements="allAnnouncements" />
      </v-window-item>

      <v-window-item value="school">
        <AnnouncementsList :announcements="schoolAnnouncements" />
      </v-window-item>

      <v-window-item value="courses">
        <AnnouncementsList :announcements="courseAnnouncements" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAnnouncementStore } from '@/stores/announcementStore'
import AnnouncementsList from '@/components/student/AnnouncementsList.vue'

const announcementStore = useAnnouncementStore()
const tab = ref('all')
const announcements = ref([])

const allAnnouncements = computed(() => announcements.value)
const schoolAnnouncements = computed(() => 
  announcements.value.filter(a => a.targetAudience === 'all' || a.targetAudience === 'students')
)
const courseAnnouncements = computed(() => 
  announcements.value.filter(a => a.targetAudience === 'course')
)

const loadAnnouncements = async () => {
  try {
    announcements.value = await announcementStore.fetchAnnouncements()
  } catch (error) {
    console.error('Failed to load announcements:', error)
  }
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.announcements-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 8px;
}

.header-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

/* Custom Tabs */
.custom-tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
  transition: all 0.2s ease;
}

.custom-tabs :deep(.v-tab--selected) {
  background: rgba(var(--v-theme-primary), 0.08);
}

.custom-tabs :deep(.v-slide-group__content) {
  gap: 8px;
}

@media (max-width: 600px) {
  .custom-tabs :deep(.v-tab) {
    padding: 0 16px;
    font-size: 0.85rem;
    min-width: auto;
  }
}
</style>