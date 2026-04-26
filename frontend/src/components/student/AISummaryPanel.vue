<!-- frontend/src/components/student/AISummaryPanel.vue -->
<template>
  <v-card class="ai-summary-panel rounded-lg" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center pa-4 bg-surface-variant">
      <div>
        <v-icon color="primary" class="mr-2">mdi-brain</v-icon>
        <span class="text-h6">AI Summary</span>
        <v-chip size="x-small" class="ml-2" color="primary" variant="outlined">Gemini AI</v-chip>
                <!-- Add language indicator -->
        <v-chip 
          v-if="summary?.detectedLanguage" 
          size="x-small" 
          class="ml-2" 
          :color="summary.detectedLanguage === 'filipino' ? 'success' : 'info'"
        >
          <v-icon start size="12" class="mr-1">mdi-translate</v-icon>
          {{ summary.detectedLanguage === 'filipino' ? 'Filipino' : 'English' }}
        </v-chip>
      </div>
      <div>
        <v-btn
          v-if="summary && !loading"
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="regenerate"
          :disabled="generating"
        >
          <v-icon v-if="!generating">mdi-refresh</v-icon>
          <v-progress-circular v-else indeterminate size="20" />
        </v-btn>
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('close')"></v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular indeterminate color="primary" size="48" class="mb-4" />
        <p class="text-body-1">AI is analyzing the material...</p>
        <p class="text-caption text-medium-emphasis">This may take a few seconds</p>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Summary Display -->
      <div v-else-if="summary" class="summary-content">
        <div v-html="renderedSummary" class="markdown-body"></div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="text-caption text-medium-emphasis d-flex justify-space-between">
          <span>Generated: {{ formatDate(summary.generatedAt) }}</span>
          <span>Model: {{ summary.model }}</span>
          <v-chip v-if="cached" size="x-small" variant="flat">Cached</v-chip>
        </div>
      </div>

      <!-- No Summary State -->
      <div v-else class="text-center pa-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-robot-excited</v-icon>
        <p class="text-body-1">Generate an AI summary of this material</p>
        <v-btn
          color="primary"
          variant="tonal"
          @click="generate"
          :loading="generating"
          prepend-icon="mdi-sparkles"
        >
          Generate Summary
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import aiService from '@/services/aiService'

const props = defineProps({
  materialId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const summary = ref(null)
const loading = ref(false)
const generating = ref(false)
const error = ref(null)
const cached = ref(false)

const renderedSummary = computed(() => {
  if (!summary.value?.summary) return ''
  return marked(summary.value.summary)
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const generate = async () => {
  generating.value = true
  error.value = null
  try {
    const result = await aiService.getMaterialSummary(props.materialId)
    summary.value = result
    cached.value = result.cached
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to generate summary'
    console.error('Summary generation failed:', err)
  } finally {
    generating.value = false
  }
}

const regenerate = async () => {
  generating.value = true
  error.value = null
  try {
    const result = await aiService.regenerateSummary(props.materialId)
    summary.value = result
    cached.value = false
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to regenerate summary'
  } finally {
    generating.value = false
  }
}

// Auto-generate when component mounts
generate()
</script>

<style scoped>
.ai-summary-panel {
  min-width: 300px;
  max-width: 500px;
}

.summary-content {
  max-height: 60vh;
  overflow-y: auto;
}

.markdown-body {
  font-size: 0.9rem;
  line-height: 1.5;
}

.markdown-body :deep(h1) {
  font-size: 1.25rem;
  margin: 0.75rem 0;
}

.markdown-body :deep(h2) {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  padding-left: 1.25rem;
}

.markdown-body :deep(li) {
  margin: 0.25rem 0;
}
</style>