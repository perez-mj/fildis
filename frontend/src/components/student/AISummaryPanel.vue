<!-- frontend/src/components/student/AISummaryPanel.vue -->
<template>
  <v-card class="ai-summary-panel rounded-xl" elevation="0">
    <v-card-title class="d-flex justify-space-between align-center pa-3 pa-sm-4">
      <div class="d-flex align-center flex-wrap">
        <div class="panel-icon primary me-2">
          <v-icon color="primary" size="20" class="d-sm-none">mdi-brain</v-icon>
          <v-icon color="primary" size="24" class="d-none d-sm-flex">mdi-brain</v-icon>
        </div>
        <div>
          <span class="text-subtitle-1 text-sm-h6 font-weight-light">AI Summary</span>
          <div class="panel-accent primary"></div>
        </div>
        <div class="d-flex mt-1 mt-sm-0">
          <v-chip size="x-small" class="ml-2" color="primary" variant="light">Gemini AI</v-chip>
          <v-chip 
            v-if="summary?.detectedLanguage" 
            size="x-small" 
            class="ml-1 ml-sm-2" 
            :color="summary.detectedLanguage === 'filipino' ? 'success' : 'info'"
            variant="light"
          >
            <v-icon start size="10" class="mr-1">mdi-translate</v-icon>
            {{ summary.detectedLanguage === 'filipino' ? 'Fil' : 'En' }}
          </v-chip>
        </div>
      </div>
      <div class="d-flex">
        <v-btn
          v-if="summary && !loading"
          icon="mdi-refresh"
          size="small"
          variant="text"
          color="grey"
          @click="regenerate"
          :disabled="generating"
        >
          <v-progress-circular v-if="generating" indeterminate size="16" width="2" color="primary"></v-progress-circular>
          <v-icon v-else size="16">mdi-refresh</v-icon>
        </v-btn>
        <v-btn icon="mdi-close" size="small" variant="text" color="grey" @click="$emit('close')"></v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-3 pa-sm-4">
      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-6 pa-sm-8">
        <div class="loading-animation mb-3 mb-sm-4">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
        <p class="text-body-2 text-sm-body-1 text-medium-emphasis">AI is analyzing the material...</p>
        <p class="text-caption text-medium-emphasis mt-1">This may take a few seconds</p>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3 mb-sm-4 rounded-lg" icon="mdi-alert" density="compact">
        {{ error }}
      </v-alert>

      <!-- Summary Display -->
      <div v-else-if="summary" class="summary-content">
        <div class="summary-badge mb-2 mb-sm-3">
          <v-icon size="14" class="mr-1">mdi-file-document-outline</v-icon>
          <span class="text-caption">AI-Generated Summary</span>
        </div>
        
        <div class="summary-markdown markdown-body" v-html="renderedSummary"></div>
        
        <v-divider class="my-3 my-sm-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center flex-wrap gap-2">
          <div class="d-flex flex-wrap gap-2 gap-sm-3">
            <span class="text-caption text-medium-emphasis d-flex align-center">
              <v-icon size="10" class="mr-1">mdi-calendar-outline</v-icon>
              {{ formatDate(summary.generatedAt) }}
            </span>
            <span class="text-caption text-medium-emphasis d-flex align-center">
              <v-icon size="10" class="mr-1">mdi-chip</v-icon>
              {{ summary.model }}
            </span>
          </div>
          <v-chip v-if="cached" size="x-small" variant="flat" color="grey" class="rounded-pill">
            <v-icon start size="8">mdi-database-outline</v-icon>
            Cached
          </v-chip>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center pa-6 pa-sm-8">
        <div class="empty-icon mb-3 mb-sm-4">
          <v-icon size="48" color="grey-lighten-2">mdi-robot-excited-outline</v-icon>
        </div>
        <p class="text-body-2 text-sm-body-1 text-medium-emphasis mb-3 mb-sm-4">Generate an AI summary of this material</p>
        <v-btn
          color="primary"
          variant="tonal"
          rounded="pill"
          @click="generate"
          :loading="generating"
          prepend-icon="mdi-sparkles"
          size="small"
          class="mobile-btn"
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

generate()
</script>

<style scoped>
.ai-summary-panel {
  min-width: auto;
  max-width: 100%;
  border-radius: 12px;
}

/* Mobile First Approach */
@media (min-width: 600px) {
  .ai-summary-panel {
    min-width: 500px;
    max-width: 750px;
  }
}

.panel-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

@media (min-width: 600px) {
  .panel-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
}

.panel-icon.primary {
  background: rgba(99, 102, 241, 0.1);
}

.panel-accent {
  width: 24px;
  height: 2px;
  border-radius: 2px;
  margin-top: 4px;
}

@media (min-width: 600px) {
  .panel-accent {
    width: 30px;
  }
}

.panel-accent.primary {
  background: #6366f1;
}

.summary-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 2px;
}

@media (min-width: 600px) {
  .summary-content {
    max-height: 65vh;
    padding-right: 4px;
  }
}

/* Custom Scrollbar - Hide on mobile for cleaner look */
.summary-content::-webkit-scrollbar {
  width: 2px;
}

@media (min-width: 600px) {
  .summary-content::-webkit-scrollbar {
    width: 4px;
  }
}

.summary-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.summary-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.summary-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(99, 102, 241, 0.08);
  border-radius: 20px;
  color: #6366f1;
}

/* Markdown Styling - Mobile Optimized */
.markdown-body {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #1e293b;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

@media (min-width: 600px) {
  .markdown-body {
    font-size: 0.95rem;
    line-height: 1.6;
  }
}

.markdown-body :deep(h1) {
  font-size: 1.2rem;
  margin: 0.75rem 0 0.5rem;
  font-weight: 500;
  color: #0f172a;
}

@media (min-width: 600px) {
  .markdown-body :deep(h1) {
    font-size: 1.35rem;
    margin: 1rem 0 0.75rem;
  }
}

.markdown-body :deep(h2) {
  font-size: 1rem;
  margin: 0.75rem 0 0.5rem;
  font-weight: 500;
  color: #1e293b;
}

@media (min-width: 600px) {
  .markdown-body :deep(h2) {
    font-size: 1.2rem;
    margin: 0.875rem 0 0.5rem;
  }
}

.markdown-body :deep(h3) {
  font-size: 0.95rem;
  margin: 0.5rem 0 0.375rem;
  font-weight: 500;
  color: #334155;
}

@media (min-width: 600px) {
  .markdown-body :deep(h3) {
    font-size: 1.05rem;
    margin: 0.75rem 0 0.5rem;
  }
}

.markdown-body :deep(p) {
  margin: 0.5rem 0;
}

.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  padding-left: 1.25rem;
  margin: 0.375rem 0;
}

@media (min-width: 600px) {
  .markdown-body :deep(ul), 
  .markdown-body :deep(ol) {
    padding-left: 1.5rem;
    margin: 0.5rem 0;
  }
}

.markdown-body :deep(li) {
  margin: 0.2rem 0;
}

.markdown-body :deep(blockquote) {
  border-left: 3px solid #6366f1;
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: #475569;
  font-style: italic;
}

.markdown-body :deep(code) {
  background: #f1f5f9;
  padding: 0.15rem 0.3rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: monospace;
  word-break: break-word;
}

.markdown-body :deep(pre) {
  background: #f1f5f9;
  padding: 0.75rem;
  border-radius: 8px;
  overflow-x: auto;
  font-size: 0.8rem;
}

/* Loading Animation */
.loading-animation {
  display: flex;
  justify-content: center;
  gap: 6px;
}

@media (min-width: 600px) {
  .loading-animation {
    gap: 8px;
  }
}

.dot {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

@media (min-width: 600px) {
  .dot {
    width: 10px;
    height: 10px;
  }
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Empty State */
.empty-state {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media (min-width: 600px) {
  .empty-state {
    min-height: 280px;
  }
}

.empty-icon {
  opacity: 0.5;
}

/* Mobile Button */
.mobile-btn {
  min-height: 36px;
}

/* Utility */
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

.justify-between {
  justify-content: space-between;
}

/* Touch-friendly tap targets */
.v-btn {
  min-height: 36px;
}

@media (max-width: 600px) {
  .v-btn {
    min-height: 40px;
  }
  
  .option-item {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
}
</style>