<!-- frontend/src/views/student/CourseMaterials.vue -->
<template>
  <v-container fluid>
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center">
          <div>
            <v-btn
              variant="text"
              :to="{ name: 'StudentCourses' }"
              class="mb-2"
              prepend-icon="mdi-arrow-left"
            >
              Back to Courses
            </v-btn>
            <h1 class="text-h4 font-weight-bold mb-1">{{ course?.courseName }}</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ course?.courseCode }} - Learning Materials
            </p>
          </div>
          <v-chip color="primary" size="large">
            <v-icon start>mdi-folder</v-icon>
            {{ materials.length }} Materials
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Course Info Card -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg mb-4" elevation="2">
          <v-card-text>
            <v-row>
              <v-col cols="12" md="8">
                <div class="text-body-1">{{ course?.description }}</div>
                <div class="mt-3">
                  <v-chip size="small" class="mr-2">Credits: {{ course?.credits }}</v-chip>
                  <v-chip size="small" class="mr-2">Semester: {{ course?.semester }}</v-chip>
                  <v-chip size="small">Department: {{ course?.department }}</v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="text-subtitle-2 font-weight-medium">Teacher</div>
                <div class="d-flex align-center mt-1">
                  <v-avatar size="32" class="mr-2">
                    <v-icon>mdi-account-circle</v-icon>
                  </v-avatar>
                  <div>
                    <div>{{ course?.teacher?.firstName }} {{ course?.teacher?.lastName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ course?.teacher?.email }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Materials Filter -->
    <v-row class="mb-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          label="Search materials"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-text-field>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="filterType"
          :items="fileTypes"
          label="Filter by Type"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
        ></v-select>
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Sort By"
          variant="outlined"
          density="comfortable"
          hide-details
        ></v-select>
      </v-col>
    </v-row>

    <!-- Materials List -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-lg" elevation="2">
          <v-list v-if="filteredMaterials.length > 0" lines="two">
            <v-list-item
              v-for="material in filteredMaterials"
              :key="material._id"
              class="material-item"
            >
              <template v-slot:prepend>
                <v-avatar size="48" :color="getFileTypeColor(material.fileType)" variant="tonal">
                  <v-icon size="28">{{ getFileTypeIcon(material.fileType) }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ material.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <div class="text-caption">
                  Uploaded by {{ material.uploadedBy?.firstName }} {{ material.uploadedBy?.lastName }}
                  • {{ formatDate(material.createdAt) }}
                  • {{ formatFileSize(material.fileSize) }}
                  • {{ material.views || 0 }} views • {{ material.downloads || 0 }} downloads
                </div>
                <div class="text-body-2 mt-1" v-if="material.description">
                  {{ material.description }}
                </div>
                <div class="mt-1" v-if="material.tags && material.tags.length">
                  <v-chip
                    v-for="tag in material.tags.slice(0, 3)"
                    :key="tag"
                    size="x-small"
                    variant="outlined"
                    class="mr-1"
                  >
                    {{ tag }}
                  </v-chip>
                  <v-chip
                    v-if="material.tags.length > 3"
                    size="x-small"
                    variant="outlined"
                  >
                    +{{ material.tags.length - 3 }}
                  </v-chip>
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="d-flex align-center">
                  <v-btn
                    variant="text"
                    color="purple"
                    prepend-icon="mdi-robot"
                    class="mr-1"
                    @click.stop="openAIMenu(material)"
                  >
                    AI
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="primary"
                    :href="material.webViewLink"
                    target="_blank"
                    prepend-icon="mdi-eye"
                    class="mr-1"
                    @click="trackView(material)"
                  >
                    View
                  </v-btn>
                  <v-btn
                    variant="text"
                    color="primary"
                    :href="material.webContentLink"
                    target="_blank"
                    prepend-icon="mdi-download"
                    @click="trackDownload(material)"
                  >
                    Download
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-card-text v-else class="text-center pa-8">
            <v-icon size="64" color="grey" class="mb-4">mdi-folder-open</v-icon>
            <h3 class="text-h6 mb-2">No materials found</h3>
            <p class="text-body-2 text-medium-emphasis">
              {{ search || filterType ? 'Try adjusting your filters' : 'No learning materials have been uploaded for this course yet' }}
            </p>
            <v-btn
              v-if="search || filterType"
              color="primary"
              variant="text"
              @click="clearFilters"
            >
              Clear Filters
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- AI Menu Popover -->
    <v-dialog v-model="showAIMenu" max-width="280px" persistent width="auto">
      <v-card class="ai-menu-card">
        <v-card-title class="text-subtitle-1 font-weight-medium pa-3 bg-purple-lighten-5">
          <v-icon color="purple" class="mr-2">mdi-robot</v-icon>
          AI Assistant
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" size="small" variant="text" @click="showAIMenu = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-3">
          <div class="text-caption text-medium-emphasis mb-3">
            Material: "{{ selectedMaterial?.title }}"
          </div>
          <v-btn
            color="primary"
            variant="tonal"
            block
            class="mb-2"
            prepend-icon="mdi-text-box"
            @click="openSummaryPanel"
          >
            AI Summary
          </v-btn>
          <v-btn
            color="success"
            variant="tonal"
            block
            prepend-icon="mdi-school"
            @click="openReviewerPanel"
          >
            AI Reviewer
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- AI Summary Panel Dialog -->
    <v-dialog v-model="showSummaryPanel" max-width="650px" persistent>
      <AISummaryPanel
        :material-id="selectedMaterial?._id"
        :material-title="selectedMaterial?.title"
        @close="showSummaryPanel = false"
      />
    </v-dialog>

    <!-- AI Reviewer Panel Dialog -->
    <v-dialog v-model="showReviewerPanel" max-width="850px" persistent>
      <AIReviewerPanel
        :material-id="selectedMaterial?._id"
        :material-title="selectedMaterial?.title"
        @close="showReviewerPanel = false"
      />
    </v-dialog>

    <!-- Loading State -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useStudentStore } from '@/stores/studentStore'
import { useMaterialStore } from '@/stores/materialStore'
import { format } from 'date-fns'
import AISummaryPanel from '@/components/student/AISummaryPanel.vue'
import AIReviewerPanel from '@/components/student/AIReviewerPanel.vue'

const route = useRoute()
const studentStore = useStudentStore()
const materialStore = useMaterialStore()

const courseId = route.params.courseId
const course = ref(null)
const materials = ref([])
const loading = ref(false)

// Search/filter/sort
const search = ref('')
const filterType = ref(null)
const sortBy = ref('newest')

// AI state
const selectedMaterial = ref(null)
const showAIMenu = ref(false)
const showSummaryPanel = ref(false)
const showReviewerPanel = ref(false)

const fileTypes = [
  { title: 'PDF', value: 'pdf' },
  { title: 'PPT/PPTX', value: 'ppt' },
  { title: 'Video', value: 'video' },
  { title: 'Document', value: 'doc' },
  { title: 'Link', value: 'link' },
  { title: 'Other', value: 'other' }
]

const sortOptions = [
  { title: 'Newest First', value: 'newest' },
  { title: 'Oldest First', value: 'oldest' },
  { title: 'Title A-Z', value: 'title_asc' },
  { title: 'Title Z-A', value: 'title_desc' },
  { title: 'Most Views', value: 'views' },
  { title: 'Most Downloads', value: 'downloads' }
]

const filteredMaterials = computed(() => {
  let filtered = [...materials.value]
  
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(searchLower) ||
      m.description?.toLowerCase().includes(searchLower)
    )
  }
  
  if (filterType.value) {
    filtered = filtered.filter(m => m.fileType === filterType.value)
  }
  
  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      break
    case 'title_asc':
      filtered.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title_desc':
      filtered.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'views':
      filtered.sort((a, b) => (b.views || 0) - (a.views || 0))
      break
    case 'downloads':
      filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
      break
    default:
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
  
  return filtered
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileTypeIcon = (fileType) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    ppt: 'mdi-file-powerpoint-box',
    pptx: 'mdi-file-powerpoint-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    video: 'mdi-video-box',
    image: 'mdi-image-box',
    link: 'mdi-link-box',
    other: 'mdi-file-box'
  }
  return icons[fileType] || 'mdi-file-box'
}

const getFileTypeColor = (fileType) => {
  const colors = {
    pdf: 'error',
    ppt: 'warning',
    pptx: 'warning',
    doc: 'info',
    docx: 'info',
    video: 'success',
    image: 'secondary',
    link: 'primary',
    other: 'grey'
  }
  return colors[fileType] || 'primary'
}

const trackView = async (material) => {
  await materialStore.trackView(material._id)
  // Open the link after tracking
  window.open(material.webViewLink, '_blank')
}

const trackDownload = async (material) => {
  await materialStore.trackDownload(material._id)
  window.open(material.webContentLink, '_blank')
}

const clearFilters = () => {
  search.value = ''
  filterType.value = null
  sortBy.value = 'newest'
}

const openAIMenu = (material) => {
  selectedMaterial.value = material
  showAIMenu.value = true
}

const openSummaryPanel = () => {
  showAIMenu.value = false
  showSummaryPanel.value = true
}

const openReviewerPanel = () => {
  showAIMenu.value = false
  showReviewerPanel.value = true
}

const loadCourseAndMaterials = async () => {
  loading.value = true
  try {
    // Fetch course details
    course.value = await studentStore.fetchCourseDetails(courseId)
    
    // Fetch materials for this course
    materials.value = await materialStore.fetchCourseMaterials(courseId)
  } catch (error) {
    console.error('Failed to load course materials:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCourseAndMaterials()
})
</script>

<style scoped>
.material-item {
  transition: background-color 0.2s;
}

.material-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.ai-menu-card {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.v-list-item__append) {
  flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 600px) {
  :deep(.v-list-item__prepend) {
    min-width: 56px;
  }
  
  :deep(.v-btn) {
    min-width: 40px;
    padding: 0 8px;
  }
  
  :deep(.v-btn .v-btn__prepend) {
    margin-right: 4px;
  }
}
</style>