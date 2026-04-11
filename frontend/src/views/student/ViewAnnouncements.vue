<!-- frontend/src/views/student/ViewAnnouncements.vue -->
 <template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Announcements</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Stay updated with the latest news and updates
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Filter Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="all">All Announcements</v-tab>
      <v-tab value="school">School Announcements</v-tab>
      <v-tab value="courses">Course Announcements</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="all">
        <announcements-list :announcements="allAnnouncements" />
      </v-window-item>

      <v-window-item value="school">
        <announcements-list :announcements="schoolAnnouncements" />
      </v-window-item>

      <v-window-item value="courses">
        <announcements-list :announcements="courseAnnouncements" />
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