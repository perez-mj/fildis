<!-- frontend/src/views/teacher/CourseMaterials.vue -->
<template>
  <div class="course-materials">
    <v-container fluid>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <v-card class="mb-4" color="primary" variant="tonal">
            <v-card-text class="pa-4">
              <div class="d-flex align-center justify-space-between flex-wrap">
                <div class="d-flex align-center">
                  <v-btn
                    icon="mdi-arrow-left"
                    variant="text"
                    to="/teacher/courses"
                    class="mr-3"
                  ></v-btn>
                  <div>
                    <div class="text-overline">Course Materials</div>
                    <h1 class="text-h4">{{ course?.courseName }}</h1>
                    <div class="text-subtitle-1">{{ course?.courseCode }}</div>
                  </div>
                </div>
                <v-btn color="primary" @click="showUploadDialog = true" class="mt-2 mt-sm-0">
                  <v-icon start icon="mdi-upload"></v-icon>
                  Upload Material
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabs -->
      <v-row>
        <v-col cols="12">
          <v-tabs v-model="activeTab" color="primary" align-tabs="start" show-arrows>
            <v-tab value="all">
              <v-icon start icon="mdi-folder"></v-icon>
              All Materials
              <v-badge :content="materials.length" color="primary" inline class="ml-2"></v-badge>
            </v-tab>
            <v-tab value="pdf">
              <v-icon start icon="mdi-file-pdf-box"></v-icon>
              PDFs
            </v-tab>
            <v-tab value="ppt">
              <v-icon start icon="mdi-file-powerpoint-box"></v-icon>
              Presentations
            </v-tab>
            <v-tab value="video">
              <v-icon start icon="mdi-video-box"></v-icon>
              Videos
            </v-tab>
            <v-tab value="image">
              <v-icon start icon="mdi-image-box"></v-icon>
              Images
            </v-tab>
            <v-tab value="other">
              <v-icon start icon="mdi-file-box"></v-icon>
              Other
            </v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <!-- Materials Grid -->
      <v-row class="mt-4">
        <v-col v-for="material in filteredMaterials" :key="material._id" cols="12" sm="6" md="4" lg="3">
          <v-card :loading="loading" hover class="material-card" elevation="2">
            <div class="material-preview" :class="`preview-${material.fileType}`">
              <v-icon :icon="getFileTypeIcon(material.fileType)" size="48" class="preview-icon"></v-icon>
            </div>

            <v-card-item>
              <v-card-title class="text-subtitle-1 font-weight-medium">{{ truncateText(material.title, 40) }}</v-card-title>
              <v-card-subtitle class="text-caption">
                {{ formatFileSize(material.fileSize) }} • {{ formatDate(material.createdAt) }}
              </v-card-subtitle>
            </v-card-item>

            <v-card-text class="pt-0">
              <p v-if="material.description" class="text-caption text-medium-emphasis">
                {{ truncateText(material.description, 60) }}
              </p>
              <v-chip-group v-if="material.tags?.length" class="mt-1">
                <v-chip v-for="tag in material.tags.slice(0, 3)" :key="tag" size="x-small" color="info" variant="outlined">
                  {{ tag }}
                </v-chip>
                <v-chip v-if="material.tags.length > 3" size="x-small" color="info" variant="outlined">
                  +{{ material.tags.length - 3 }}
                </v-chip>
              </v-chip-group>
              <div class="mt-2 d-flex align-center">
                <v-icon icon="mdi-eye" size="small" class="me-1"></v-icon>
                <span class="text-caption">{{ material.views || 0 }} views</span>
                <v-icon icon="mdi-download" size="small" class="ms-2 me-1"></v-icon>
                <span class="text-caption">{{ material.downloads || 0 }} downloads</span>
              </div>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn size="small" color="primary" variant="text" :href="material.webViewLink" target="_blank" prepend-icon="mdi-eye">
                View
              </v-btn>
              <v-btn size="small" color="success" variant="text" :href="material.webContentLink" download prepend-icon="mdi-download">
                Download
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn size="small" color="error" variant="text" icon="mdi-delete" @click="confirmDelete(material)"></v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <v-col v-if="filteredMaterials.length === 0 && !loading" cols="12">
          <v-empty-state
            headline="No Materials"
            :title="activeTab !== 'all' ? `No ${activeTab} materials found` : 'No materials uploaded yet'"
            :text="activeTab !== 'all' ? 'Try a different category' : 'Click the Upload button to add course materials.'"
          >
            <template v-slot:actions>
              <v-btn color="primary" @click="showUploadDialog = true" prepend-icon="mdi-upload">
                Upload Material
              </v-btn>
            </template>
          </v-empty-state>
        </v-col>
      </v-row>
    </v-container>

    <!-- Upload Dialog -->
    <v-dialog v-model="showUploadDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title class="text-h5 pa-4 bg-primary">
          <span class="text-white">Upload Course Material</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showUploadDialog = false" color="white"></v-btn>
        </v-card-title>
        
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
            
            <v-alert type="info" variant="tonal" class="mt-2">
              <div class="text-caption">
                <strong>Supported file types:</strong> PDF, PPT, PPTX, DOC, DOCX, MP4, MOV, AVI, JPG, PNG<br>
                <strong>Max file size:</strong> 50MB
              </div>
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showUploadDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="uploading" @click="uploadMaterial" :disabled="!formValid">
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h5">Delete Material</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ materialToDelete?.title }}"?
          <br>
          <span class="text-error">This action cannot be undone.</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" :loading="deleting" @click="deleteMaterial">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeacherStore } from '@/stores/teacherStore'

const route = useRoute()
const teacherStore = useTeacherStore()

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
    link: 'mdi-link-box',
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
    // Course not found, go back
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
    
    showUploadDialog.value = false
    uploadData.value = { title: '', description: '', tags: '', file: null }
    
    // Refresh course data
    await teacherStore.fetchMyCourses()
    await loadCourse()
  } catch (error) {
    console.error('Upload failed:', error)
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
  } catch (error) {
    console.error('Delete failed:', error)
  } finally {
    deleting.value = false
  }
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
.material-card {
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.material-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.material-preview {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
}

.preview-pdf {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.preview-ppt, .preview-pptx {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.preview-video {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.preview-image {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.preview-icon {
  color: white;
  opacity: 0.9;
}
</style>