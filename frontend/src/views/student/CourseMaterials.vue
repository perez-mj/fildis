<!-- frontend/src/views/student/CourseMaterials.vue -->
<template>
  <v-container fluid class="course-materials-container">
    <!-- Course Header with accent -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="course-header">
          <v-btn
            variant="text"
            :to="{ name: 'StudentCourses' }"
            class="back-btn mb-3"
            prepend-icon="mdi-arrow-left"
            size="small"
          >
            Back to Courses
          </v-btn>
          
          <div class="course-title-section">
            <div>
              <h1 class="text-h4 font-weight-light course-title">{{ course?.courseName }}</h1>
              <div class="title-accent"></div>
              <p class="text-subtitle-1 text-medium-emphasis mt-2">
                {{ course?.courseCode }} • Learning Materials
              </p>
            </div>
            <v-chip color="primary" variant="tonal" size="large" class="material-count-chip">
              <v-icon start size="20">mdi-folder-outline</v-icon>
              {{ materials.length }} Materials
            </v-chip>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Course Info Card - Minimalist -->
    <v-row>
      <v-col cols="12">
        <v-card class="rounded-xl mb-6 info-card" elevation="0" variant="tonal">
          <v-card-text class="pa-4 pa-md-6">
            <v-row>
              <v-col cols="12" md="8">
                <p class="text-body-1 text-medium-emphasis mb-3">{{ course?.description }}</p>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip size="small" variant="outlined">Credits: {{ course?.credits }}</v-chip>
                  <v-chip size="small" variant="outlined">Semester: {{ course?.semester }}</v-chip>
                  <v-chip size="small" variant="outlined">Department: {{ course?.department }}</v-chip>
                </div>
              </v-col>
              <v-col cols="12" md="4">
                <div class="teacher-info">
                  <div class="text-subtitle-2 font-weight-medium text-medium-emphasis">Instructor</div>
                  <div class="d-flex align-center mt-2">
                    <v-avatar size="36" color="primary" variant="tonal">
                      <v-icon size="20">mdi-account</v-icon>
                    </v-avatar>
                    <div class="ml-2">
                      <div class="text-body-2 font-weight-medium">
                        {{ course?.teacher?.firstName }} {{ course?.teacher?.lastName }}
                      </div>
                      <div class="text-caption text-medium-emphasis">{{ course?.teacher?.email }}</div>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Materials Filter - Minimalist -->
    <v-row class="mb-4">
      <v-col cols="12" md="5">
        <v-text-field
          v-model="search"
          label="Search materials"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          clearable
          hide-details
          class="search-field"
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

    <!-- Materials List - Clean Cards -->
    <v-row>
      <v-col cols="12">
        <div v-if="filteredMaterials.length > 0" class="materials-grid">
          <v-card
            v-for="material in filteredMaterials"
            :key="material._id"
            class="material-card rounded-xl"
            elevation="0"
            variant="outlined"
          >
            <div class="material-card-content">
              <div class="material-icon" :style="{ backgroundColor: getFileTypeColor(material.fileType) + '10' }">
                <v-icon :color="getFileTypeColor(material.fileType)" size="32">
                  {{ getFileTypeIcon(material.fileType) }}
                </v-icon>
              </div>
              
              <div class="material-info">
                <h3 class="text-subtitle-1 font-weight-medium mb-1">{{ material.title }}</h3>
                <div class="text-caption text-medium-emphasis mb-2">
                  {{ material.uploadedBy?.firstName }} {{ material.uploadedBy?.lastName }} • 
                  {{ formatDate(material.createdAt) }} • 
                  {{ formatFileSize(material.fileSize) }}
                </div>
                <p v-if="material.description" class="text-body-2 text-medium-emphasis mb-2">
                  {{ material.description }}
                </p>
                <div class="d-flex flex-wrap gap-1 mb-2" v-if="material.tags && material.tags.length">
                  <v-chip v-for="tag in material.tags.slice(0, 3)" :key="tag" size="x-small" variant="outlined">
                    {{ tag }}
                  </v-chip>
                </div>
                <div class="d-flex gap-3 text-caption text-medium-emphasis">
                  <span><v-icon size="14" class="mr-1">mdi-eye</v-icon>{{ material.views || 0 }} views</span>
                  <span><v-icon size="14" class="mr-1">mdi-download</v-icon>{{ material.downloads || 0 }} downloads</span>
                </div>
              </div>
              
              <div class="material-actions">
                <v-btn
                  variant="text"
                  color="purple"
                  size="small"
                  @click="openAIMenu(material)"
                >
                  <v-icon>mdi-robot-outline</v-icon>
                </v-btn>
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  :href="material.webViewLink"
                  target="_blank"
                  @click="trackView(material)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  :href="material.webContentLink"
                  target="_blank"
                  @click="trackDownload(material)"
                >
                  <v-icon>mdi-download</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card>
        </div>

        <!-- Empty State -->
        <v-card v-else class="rounded-xl text-center pa-8" variant="tonal">
          <v-icon size="56" color="grey-lighten-1" class="mb-4">mdi-folder-open-outline</v-icon>
          <h3 class="text-h6 font-weight-light mb-2">No materials found</h3>
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
        </v-card>
      </v-col>
    </v-row>

    <!-- AI Dialogs (same as before) -->
    <v-dialog v-model="showAIMenu" max-width="320px" persistent>
      <v-card class="ai-menu-card rounded-xl">
        <v-card-title class="text-subtitle-1 font-weight-medium pa-4">
          <v-icon color="purple" class="mr-2">mdi-robot-outline</v-icon>
          AI Assistant
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" size="small" variant="text" @click="showAIMenu = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          <div class="text-caption text-medium-emphasis mb-3">
            "{{ selectedMaterial?.title }}"
          </div>
          <v-btn
            color="primary"
            variant="tonal"
            block
            class="mb-2"
            prepend-icon="mdi-text-box-outline"
            @click="openSummaryPanel"
          >
            AI Summary
          </v-btn>
          <v-btn
            color="success"
            variant="tonal"
            block
            prepend-icon="mdi-school-outline"
            @click="openReviewerPanel"
          >
            AI Reviewer
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSummaryPanel" max-width="650px" persistent>
      <AISummaryPanel
        :material-id="selectedMaterial?._id"
        :material-title="selectedMaterial?.title"
        @close="showSummaryPanel = false"
      />
    </v-dialog>

    <v-dialog v-model="showReviewerPanel" max-width="850px" persistent>
      <AIReviewerPanel
        :material-id="selectedMaterial?._id"
        :material-title="selectedMaterial?.title"
        @close="showReviewerPanel = false"
      />
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center" scrim="primary" opacity="0.1">
      <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
// Script remains the same as your original
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

const search = ref('')
const filterType = ref(null)
const sortBy = ref('newest')

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
    pdf: '#ef4444',
    ppt: '#f59e0b',
    pptx: '#f59e0b',
    doc: '#3b82f6',
    docx: '#3b82f6',
    video: '#10b981',
    image: '#8b5cf6',
    link: '#6366f1',
    other: '#64748b'
  }
  return colors[fileType] || '#6366f1'
}

const trackView = async (material) => {
  await materialStore.trackView(material._id)
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
    course.value = await studentStore.fetchCourseDetails(courseId)
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
.course-materials-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Course Header */
.course-header {
  margin-bottom: 8px;
}

.back-btn {
  margin-left: -8px;
}

.course-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 16px;
}

.course-title {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}

.title-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
}

.material-count-chip {
  border-radius: 30px !important;
}

/* Info Card */
.info-card {
  background: rgba(99, 102, 241, 0.04);
  border: 1px solid rgba(99, 102, 241, 0.1);
}

/* Search Field */
.search-field :deep(.v-field) {
  border-radius: 40px !important;
}

/* Materials Grid */
.materials-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-card {
  transition: all 0.2s ease;
  border: 1px solid #e2e8f0;
}

.material-card:hover {
  transform: translateX(4px);
  border-color: rgba(var(--v-theme-primary), 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.material-card-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
}

.material-icon {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.material-info {
  flex: 1;
}

.material-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
}

/* AI Menu Card */
.ai-menu-card {
  border-radius: 20px;
}

/* Gap utility */
.gap-1 {
  gap: 4px;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}

/* Responsive */
@media (max-width: 600px) {
  .course-title-section {
    flex-direction: column;
  }
  
  .material-card-content {
    flex-direction: column;
  }
  
  .material-icon {
    width: 48px;
    height: 48px;
  }
  
  .material-actions {
    align-self: flex-end;
  }
}
</style>