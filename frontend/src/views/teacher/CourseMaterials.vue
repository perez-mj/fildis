<!-- frontend/src/views/teacher/CourseMaterials.vue -->
<template>
  <div class="course-materials">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header with accent underline -->
      <div class="d-flex align-center justify-space-between flex-wrap mb-6">
        <div class="d-flex align-center">
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            to="/teacher/courses"
            class="mr-3"
            color="primary"
          ></v-btn>
          <div>
            <div class="text-overline text-grey-darken-1">Course Materials</div>
            <h1 class="text-h4 font-weight-light mb-2">{{ course?.courseName }}</h1>
            <div class="section-underline"></div>
            <div class="text-subtitle-1 text-grey-darken-1 mt-2">{{ course?.courseCode }}</div>
          </div>
        </div>
        <v-btn color="primary" @click="showUploadDialog = true" rounded="pill" class="mt-3 mt-sm-0">
          <v-icon start icon="mdi-upload"></v-icon>
          Upload Material
        </v-btn>
      </div>

      <!-- Tabs - Minimalist -->
      <v-tabs v-model="activeTab" color="primary" align-tabs="start" show-arrows class="calm-tabs mb-4">
        <v-tab value="all" rounded="pill">
          <v-icon start icon="mdi-folder" size="18"></v-icon>
          All
          <v-badge :content="materials.length" color="primary" inline class="ml-2" bordered></v-badge>
        </v-tab>
        <v-tab value="pdf" rounded="pill">
          <v-icon start icon="mdi-file-pdf-box" size="18"></v-icon>
          PDFs
        </v-tab>
        <v-tab value="ppt" rounded="pill">
          <v-icon start icon="mdi-file-powerpoint-box" size="18"></v-icon>
          Presentations
        </v-tab>
        <v-tab value="video" rounded="pill">
          <v-icon start icon="mdi-video-box" size="18"></v-icon>
          Videos
        </v-tab>
        <v-tab value="image" rounded="pill">
          <v-icon start icon="mdi-image-box" size="18"></v-icon>
          Images
        </v-tab>
      </v-tabs>

      <!-- Materials Grid -->
      <v-row>
        <v-col v-for="material in filteredMaterials" :key="material._id" cols="12" sm="6" md="4" lg="3">
          <v-card variant="outlined" class="material-card" :loading="loading">
            <div class="material-preview" :class="`preview-${material.fileType}`">
              <v-icon :icon="getFileTypeIcon(material.fileType)" size="40" class="preview-icon"></v-icon>
            </div>

            <v-card-item class="pa-3">
              <v-card-title class="text-subtitle-1 font-weight-medium pa-0">{{ truncateText(material.title, 40) }}</v-card-title>
              <v-card-subtitle class="text-caption pa-0 mt-1">
                {{ formatFileSize(material.fileSize) }} • {{ formatDate(material.createdAt) }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text class="pt-0 px-3 pb-0">
              <p v-if="material.description" class="text-caption text-grey-darken-1 mb-2">
                {{ truncateText(material.description, 60) }}
              </p>
              <div class="d-flex align-center text-caption text-grey-darken-1">
                <v-icon icon="mdi-eye" size="14" class="me-1"></v-icon>
                <span>{{ material.views || 0 }}</span>
                <v-icon icon="mdi-download" size="14" class="ms-3 me-1"></v-icon>
                <span>{{ material.downloads || 0 }}</span>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="pa-2">
              <v-btn size="small" color="primary" variant="text" :href="material.webViewLink" target="_blank" prepend-icon="mdi-eye" rounded="pill">
                View
              </v-btn>
              <v-btn size="small" color="success" variant="text" :href="material.webContentLink" download prepend-icon="mdi-download" rounded="pill">
                Download
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="confirmDelete(material)"></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Empty State -->
        <v-col v-if="filteredMaterials.length === 0 && !loading" cols="12">
          <v-card variant="outlined" class="text-center pa-8">
            <v-icon icon="mdi-folder-open" size="64" color="grey-lighten-1" class="mb-3" opacity="0.5"></v-icon>
            <div class="text-h6 font-weight-light text-grey-darken-1">
              {{ activeTab !== 'all' ? `No ${activeTab} materials yet` : 'No course materials' }}
            </div>
            <div class="text-caption text-grey-darken-1 mt-1">
              {{ activeTab !== 'all' ? 'Try a different category' : 'Click the upload button to add materials' }}
            </div>
            <v-btn color="primary" variant="outlined" @click="showUploadDialog = true" class="mt-4" rounded="pill">
              Upload Material
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Upload Dialog - Minimalist -->
    <v-dialog v-model="showUploadDialog" max-width="600px" scrollable>
      <v-card variant="outlined">
        <v-card-title class="pa-4 d-flex align-center justify-space-between">
          <span class="text-h6 font-weight-light">Upload Course Material</span>
          <v-btn icon="mdi-close" variant="text" size="small" @click="closeUploadDialog"></v-btn>
        </v-card-title>
        
        <v-divider></v-divider>

        <v-card-text class="pa-4">
          <v-form ref="uploadForm" v-model="formValid">
            <v-text-field
              v-model="uploadData.title"
              label="Title"
              :rules="[v => !!v || 'Title is required']"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="uploadData.description"
              label="Description (optional)"
              rows="3"
              variant="outlined"
            ></v-textarea>
            
            <v-text-field
              v-model="uploadData.tags"
              label="Tags (comma-separated)"
              placeholder="lecture, chapter1, slides"
              hint="Separate tags with commas"
              variant="outlined"
            ></v-text-field>
            
            <v-file-input
              v-model="uploadData.file"
              label="Select File"
              :rules="[v => !!v || 'File is required']"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.avi,.jpg,.jpeg,.png"
              prepend-icon="mdi-paperclip"
              show-size
              variant="outlined"
              required
            ></v-file-input>
            
            <v-alert type="info" variant="tonal" class="mt-2" density="compact">
              <div class="text-caption">
                <strong>Supported:</strong> PDF, PPT, DOC, MP4, JPG, PNG • <strong>Max:</strong> 50MB
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeUploadDialog" rounded="pill">Cancel</v-btn>
          <v-btn color="primary" :loading="uploading" @click="uploadMaterial" :disabled="!formValid" rounded="pill">
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card variant="outlined">
        <v-card-title class="text-h6 font-weight-light pa-4">Delete Material</v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-4">
          Are you sure you want to delete <strong>"{{ materialToDelete?.title }}"</strong>?
          <div class="text-error text-caption mt-2">This action cannot be undone.</div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false" rounded="pill">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteMaterial" rounded="pill">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'
import { inject } from 'vue'

const route = useRoute()
const router = useRouter()
const teacherStore = useTeacherStore()
const snackbar = inject('snackbar')

const loading = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const showUploadDialog = ref(false)
const showDeleteDialog = ref(false)
const formValid = ref(false)
const activeTab = ref('all')

const uploadForm = ref(null)
const materialToDelete = ref(null)

const uploadData = ref({
  title: '',
  description: '',
  tags: '',
  file: null
})

const course = computed(() => teacherStore.currentCourse)
const materials = computed(() => teacherStore.materials)

const filteredMaterials = computed(() => {
  if (activeTab.value === 'all') return materials.value
  return materials.value.filter(m => m.fileType === activeTab.value)
})

const getFileTypeIcon = (type) => {
  const icons = {
    pdf: 'mdi-file-pdf-box',
    ppt: 'mdi-file-powerpoint-box',
    pptx: 'mdi-file-powerpoint-box',
    doc: 'mdi-file-word-box',
    docx: 'mdi-file-word-box',
    video: 'mdi-video-box',
    image: 'mdi-image-box',
    other: 'mdi-file-box'
  }
  return icons[type] || 'mdi-file-box'
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const loadCourse = async () => {
  const courseId = route.params.courseId
  if (teacherStore.courses.length === 0) {
    await teacherStore.fetchMyCourses()
  }
  const course = teacherStore.courses.find(c => c._id === courseId)
  if (course) {
    teacherStore.setCurrentCourse(course)
  } else if (courseId) {
    router.push('/teacher/courses')
  }
}

const uploadMaterial = async () => {
  if (!uploadForm.value?.validate()) return
  
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('title', uploadData.value.title)
    formData.append('description', uploadData.value.description)
    formData.append('tags', uploadData.value.tags)
    formData.append('file', uploadData.value.file)
    
    await teacherStore.uploadMaterial(route.params.courseId, formData)
    
    closeUploadDialog()
    
    await teacherStore.fetchMyCourses()
    await loadCourse()
    
    snackbar.value = { show: true, text: 'Material uploaded successfully!', color: 'success' }
  } catch (error) {
    console.error('Upload failed:', error)
    snackbar.value = { show: true, text: 'Upload failed', color: 'error' }
  } finally {
    uploading.value = false
  }
}

const confirmDelete = (material) => {
  materialToDelete.value = material
  showDeleteDialog.value = true
}

const deleteMaterial = async () => {
  deleting.value = true
  try {
    await teacherStore.deleteMaterial(materialToDelete.value._id)
    showDeleteDialog.value = false
    materialToDelete.value = null
    snackbar.value = { show: true, text: 'Material deleted', color: 'success' }
  } catch (error) {
    console.error('Delete failed:', error)
    snackbar.value = { show: true, text: 'Delete failed', color: 'error' }
  } finally {
    deleting.value = false
  }
}

const closeUploadDialog = () => {
  showUploadDialog.value = false
  uploadData.value = { title: '', description: '', tags: '', file: null }
}

onMounted(async () => {
  loading.value = true
  try {
    await loadCourse()
  } catch (error) {
    console.error('Failed to load:', error)
  } finally {
    loading.value = false
  }
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

.material-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.material-card:hover {
  transform: translateY(-2px);
}

.material-preview {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6366F1 0%, #818CF8 100%);
}

.preview-pdf {
  background: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
}

.preview-ppt, .preview-pptx {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
}

.preview-video {
  background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);
}

.preview-image {
  background: linear-gradient(135deg, #10B981 0%, #34D399 100%);
}

.preview-icon {
  color: white;
  opacity: 0.9;
}

.calm-tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
}
</style>