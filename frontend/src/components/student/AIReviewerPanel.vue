<!-- frontend/src/components/student/AIReviewerPanel.vue -->
<template>
  <v-card class="ai-reviewer-panel rounded-xl" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center pa-3 pa-sm-4">
      <div class="d-flex align-center flex-wrap">
        <div class="panel-icon success me-2">
          <v-icon color="success" size="20" class="d-sm-none">mdi-school-outline</v-icon>
          <v-icon color="success" size="24" class="d-none d-sm-flex">mdi-school-outline</v-icon>
        </div>
        <div>
          <span class="text-subtitle-1 text-sm-h6 font-weight-light">AI Reviewer</span>
          <div class="panel-accent success"></div>
        </div>
        <div class="d-flex mt-1 mt-sm-0">
          <v-chip size="x-small" class="ml-2" color="success" variant="light">Practice</v-chip>
          <v-chip 
            v-if="reviewer?.detectedLanguage" 
            size="x-small" 
            class="ml-1 ml-sm-2" 
            :color="reviewer.detectedLanguage === 'filipino' ? 'success' : 'info'"
            variant="light"
          >
            <v-icon start size="10" class="mr-1">mdi-translate</v-icon>
            {{ reviewer.detectedLanguage === 'filipino' ? 'Fil' : 'En' }}
          </v-chip>
        </div>
      </div>
      <div class="d-flex">
        <v-btn
          icon="mdi-cog-outline"
          size="small"
          variant="text"
          color="grey"
          @click="showSettings = !showSettings"
        ></v-btn>
        <v-btn
          v-if="reviewer && !loading"
          icon="mdi-refresh"
          size="small"
          variant="text"
          color="grey"
          @click="regenerate"
          :loading="generating"
        ></v-btn>
        <v-btn icon="mdi-close" size="small" variant="text" color="grey" @click="$emit('close')"></v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-3 pa-sm-4">
      <!-- Settings Panel -->
      <v-expand-transition>
        <v-card v-if="showSettings" variant="tonal" class="mb-3 mb-sm-4 rounded-xl pa-3 settings-card">
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="settings.numQuestions"
                label="Questions"
                :items="[5, 10, 15, 20]"
                density="compact"
                variant="outlined"
                hide-details
                class="mobile-select"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="settings.difficulty"
                label="Difficulty"
                :items="['easy', 'medium', 'hard']"
                density="compact"
                variant="outlined"
                hide-details
                class="mobile-select"
              ></v-select>
            </v-col>
            <v-col cols="12" class="text-right">
              <v-btn size="small" color="primary" variant="tonal" @click="applySettings">Apply</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-expand-transition>

      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-6 pa-sm-8">
        <div class="loading-spinner mb-3 mb-sm-4">
          <v-progress-circular indeterminate color="success" size="40" width="3"></v-progress-circular>
        </div>
        <p class="text-body-2 text-sm-body-1 text-medium-emphasis">Generating practice questions...</p>
        <p class="text-caption text-medium-emphasis">AI is analyzing the content</p>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3 mb-sm-4 rounded-lg" icon="mdi-alert" density="compact">
        {{ error }}
      </v-alert>

      <!-- Reviewer Display -->
      <div v-else-if="reviewer && reviewer.questions" class="reviewer-content">
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-3 mb-sm-4">
          <div class="d-flex gap-2">
            <v-chip color="success" size="x-small" variant="light" class="rounded-pill">
              <v-icon start size="12">mdi-format-list-checkbox</v-icon>
              {{ reviewer.questions.length }} Q's
            </v-chip>
            <v-chip size="x-small" variant="outlined" class="rounded-pill">
              {{ reviewer.settings?.difficulty || 'medium' }}
            </v-chip>
          </div>
          <span class="text-caption text-medium-emphasis">
            {{ formatDate(reviewer.generatedAt) }}
          </span>
        </div>

        <v-alert v-if="reviewer.summary" type="info" variant="tonal" density="compact" class="mb-3 rounded-lg">
          <div class="d-flex align-start">
            <v-icon size="16" class="mr-2 mt-0.5">mdi-lightbulb-outline</v-icon>
            <span class="text-caption text-sm-body-2">{{ reviewer.summary }}</span>
          </div>
        </v-alert>

        <!-- Questions List -->
        <div class="questions-list">
          <div
            v-for="(question, index) in reviewer.questions"
            :key="question.id"
            class="question-item rounded-xl mb-2 mb-sm-3"
            :class="{ expanded: expandedPanels.includes(index) }"
          >
            <div class="question-header" @click="toggleQuestion(index)">
              <div class="d-flex align-center gap-2">
                <div class="question-number">{{ index + 1 }}</div>
                <v-chip size="x-small" :color="getQuestionTypeColor(question.type)" variant="light" class="rounded-pill">
                  {{ getQuestionTypeLabel(question.type) }}
                </v-chip>
              </div>
              <v-icon :icon="expandedPanels.includes(index) ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" color="grey"></v-icon>
            </div>
            
            <v-expand-transition>
              <div v-show="expandedPanels.includes(index)" class="question-body pa-3 pa-sm-4">
                <p class="text-body-2 text-sm-body-1 font-weight-medium mb-3">{{ question.question }}</p>
                
                <!-- Multiple Choice Options -->
                <div v-if="question.type === 'multiple_choice'" class="options-group mb-3">
                  <div
                    v-for="option in question.options"
                    :key="option"
                    class="option-item"
                    :class="{ selected: userAnswers[question.id] === option }"
                    @click="userAnswers[question.id] = option"
                  >
                    <div class="option-radio">
                      <div class="radio-dot" v-if="userAnswers[question.id] === option"></div>
                    </div>
                    <span class="option-text text-body-2">{{ option }}</span>
                  </div>
                </div>

                <!-- True/False Options -->
                <div v-if="question.type === 'true_false'" class="options-group mb-3">
                  <div
                    class="option-item"
                    :class="{ selected: userAnswers[question.id] === 'true' }"
                    @click="userAnswers[question.id] = 'true'"
                  >
                    <div class="option-radio">
                      <div class="radio-dot" v-if="userAnswers[question.id] === 'true'"></div>
                    </div>
                    <span class="option-text text-body-2">True</span>
                  </div>
                  <div
                    class="option-item"
                    :class="{ selected: userAnswers[question.id] === 'false' }"
                    @click="userAnswers[question.id] = 'false'"
                  >
                    <div class="option-radio">
                      <div class="radio-dot" v-if="userAnswers[question.id] === 'false'"></div>
                    </div>
                    <span class="option-text text-body-2">False</span>
                  </div>
                </div>

                <!-- Short Answer -->
                <v-textarea
                  v-if="question.type === 'short_answer'"
                  v-model="userAnswers[question.id]"
                  placeholder="Type your answer..."
                  rows="3"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                  hide-details
                ></v-textarea>

                <!-- Check Answer Button -->
                <div class="d-flex flex-wrap align-center gap-2 mb-2">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    rounded="pill"
                    @click="checkAnswer(question.id)"
                    :disabled="!userAnswers[question.id]"
                    class="mobile-btn"
                  >
                    Check Answer
                  </v-btn>
                  
                  <div v-if="answerFeedback[question.id]" class="feedback-message" :class="{ correct: answerFeedback[question.id].isCorrect, incorrect: !answerFeedback[question.id].isCorrect }">
                    <v-icon size="14" class="mr-1">{{ answerFeedback[question.id].isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}</v-icon>
                    <span class="text-caption">{{ answerFeedback[question.id].message }}</span>
                  </div>
                </div>

                <!-- Explanation -->
                <v-expand-transition>
                  <div v-if="showExplanations[question.id] && question.explanation" class="explanation-box rounded-lg">
                    <div class="d-flex align-start gap-2">
                      <v-icon size="16" color="info">mdi-information-outline</v-icon>
                      <div class="flex-grow-1">
                        <div class="text-caption font-weight-medium mb-1">Explanation</div>
                        <div class="text-caption">{{ question.explanation }}</div>
                      </div>
                    </div>
                  </div>
                </v-expand-transition>
              </div>
            </v-expand-transition>
          </div>
        </div>

        <!-- Study Tips -->
        <v-card v-if="reviewer.studyTips?.length" variant="tonal" class="mt-3 rounded-xl tips-card pa-3">
          <div class="d-flex align-start gap-2">
            <v-icon color="warning" size="18">mdi-lightbulb-on-outline</v-icon>
            <div class="flex-grow-1">
              <div class="text-subtitle-2 font-weight-medium mb-2">Study Tips</div>
              <ul class="tips-list">
                <li v-for="tip in reviewer.studyTips" :key="tip" class="text-caption">{{ tip }}</li>
              </ul>
            </div>
          </div>
        </v-card>

        <div class="d-flex justify-end align-center mt-3 pt-2">
          <v-chip v-if="cached" size="x-small" variant="flat" color="grey" class="rounded-pill">
            <v-icon start size="8">mdi-database-outline</v-icon>
            Cached
          </v-chip>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state text-center pa-6 pa-sm-8">
        <div class="empty-icon mb-3 mb-sm-4">
          <v-icon size="48" color="grey-lighten-2">mdi-clipboard-text-outline</v-icon>
        </div>
        <p class="text-body-2 text-sm-body-1 text-medium-emphasis mb-3 mb-sm-4">Generate practice questions to test your understanding</p>
        <v-btn
          color="success"
          variant="tonal"
          rounded="pill"
          @click="generate"
          :loading="generating"
          prepend-icon="mdi-sparkles"
          size="small"
          class="mobile-btn"
        >
          Generate Reviewer
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, reactive } from 'vue'
import aiService from '@/services/aiService'

const props = defineProps({
  materialId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['close'])

const reviewer = ref(null)
const loading = ref(false)
const generating = ref(false)
const error = ref(null)
const cached = ref(false)
const showSettings = ref(false)
const expandedPanels = ref([])
const userAnswers = ref({})
const answerFeedback = ref({})
const showExplanations = ref({})

const settings = reactive({
  numQuestions: 10,
  difficulty: 'medium'
})

const getQuestionTypeLabel = (type) => {
  const labels = {
    multiple_choice: 'MCQ',
    true_false: 'T/F',
    short_answer: 'Short'
  }
  return labels[type] || type
}

const getQuestionTypeColor = (type) => {
  const colors = {
    multiple_choice: 'primary',
    true_false: 'warning',
    short_answer: 'info'
  }
  return colors[type] || 'grey'
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString()
}

const toggleQuestion = (index) => {
  if (expandedPanels.value.includes(index)) {
    expandedPanels.value = expandedPanels.value.filter(i => i !== index)
  } else {
    expandedPanels.value.push(index)
  }
}

const checkAnswer = (questionId) => {
  const question = reviewer.value?.questions.find(q => q.id === questionId)
  if (!question) return

  const userAnswer = userAnswers.value[questionId]
  let isCorrect = false
  let message = ''

  switch (question.type) {
    case 'multiple_choice':
      isCorrect = userAnswer === question.correctAnswer
      message = isCorrect ? '✓ Correct!' : `✗ Incorrect. Answer: ${question.correctAnswer}`
      break
    case 'true_false':
      isCorrect = userAnswer === String(question.correctAnswer).toLowerCase()
      message = isCorrect ? '✓ Correct!' : `✗ Incorrect. Answer: ${question.correctAnswer}`
      break
    case 'short_answer':
      const keywords = question.correctAnswer.toLowerCase().split(/[ ,]+/)
      const answerLower = userAnswer.toLowerCase()
      isCorrect = keywords.some(k => answerLower.includes(k))
      message = isCorrect ? '✓ Good answer!' : '✗ Review and try again.'
      break
  }

  answerFeedback.value[questionId] = { isCorrect, message }
  showExplanations.value[questionId] = true
}

const generate = async () => {
  generating.value = true
  error.value = null
  try {
    const result = await aiService.getMaterialReviewer(
      props.materialId,
      settings.numQuestions,
      settings.difficulty
    )
    reviewer.value = result
    cached.value = result.cached
    userAnswers.value = {}
    answerFeedback.value = {}
    showExplanations.value = {}
    expandedPanels.value = []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to generate reviewer'
  } finally {
    generating.value = false
  }
}

const regenerate = async () => {
  generating.value = true
  error.value = null
  try {
    const result = await aiService.regenerateReviewer(
      props.materialId,
      settings.numQuestions,
      settings.difficulty
    )
    reviewer.value = result
    cached.value = false
    userAnswers.value = {}
    answerFeedback.value = {}
    showExplanations.value = {}
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to regenerate reviewer'
  } finally {
    generating.value = false
  }
}

const applySettings = () => {
  showSettings.value = false
  regenerate()
}

generate()
</script>

<style scoped>
.ai-reviewer-panel {
  min-width: auto;
  max-width: 100%;
  border-radius: 12px;
}

@media (min-width: 600px) {
  .ai-reviewer-panel {
    min-width: 500px;
    max-width: 750px;
  }
}

.v-card-title {
  background: rgba(var(--v-theme-primary), 0.03);
  border-bottom: 1px solid rgba(var(--v-theme-border), 0.08);
}

.panel-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.1);
}

@media (min-width: 600px) {
  .panel-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
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

.panel-accent.success {
  background: #10b981;
}

.reviewer-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 2px;
}

@media (min-width: 600px) {
  .reviewer-content {
    max-height: 65vh;
    padding-right: 4px;
  }
}

/* Custom Scrollbar - Simplified for mobile */
.reviewer-content::-webkit-scrollbar {
  width: 2px;
}

@media (min-width: 600px) {
  .reviewer-content::-webkit-scrollbar {
    width: 4px;
  }
}

.reviewer-content::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.reviewer-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

/* Questions List */
.questions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (min-width: 600px) {
  .questions-list {
    gap: 12px;
  }
}

.question-item {
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.2s ease;
}

.question-item:hover {
  border-color: #cbd5e1;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  background: #fafbfc;
  transition: background 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 600px) {
  .question-header {
    padding: 12px 16px;
  }
}

.question-header:hover {
  background: #f8fafc;
}

.question-number {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #6366f1;
}

@media (min-width: 600px) {
  .question-number {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    font-size: 0.85rem;
  }
}

/* Options Group */
.options-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

@media (min-width: 600px) {
  .options-group {
    gap: 10px;
  }
}

.option-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}

@media (min-width: 600px) {
  .option-item {
    padding: 10px 12px;
    border-radius: 10px;
  }
}

.option-item:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.option-item.selected {
  background: rgba(99, 102, 241, 0.05);
  border-color: #6366f1;
}

.option-radio {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

@media (min-width: 600px) {
  .option-radio {
    width: 18px;
    height: 18px;
  }
}

.option-item.selected .option-radio {
  border-color: #6366f1;
}

.radio-dot {
  width: 8px;
  height: 8px;
  background: #6366f1;
  border-radius: 50%;
}

@media (min-width: 600px) {
  .radio-dot {
    width: 10px;
    height: 10px;
  }
}

.option-text {
  font-size: 0.85rem;
  color: #1e293b;
  line-height: 1.3;
  flex: 1;
}

@media (min-width: 600px) {
  .option-text {
    font-size: 0.9rem;
  }
}

/* Feedback Message */
.feedback-message {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  font-size: 0.7rem;
}

@media (min-width: 600px) {
  .feedback-message {
    padding: 6px 12px;
    font-size: 0.8rem;
  }
}

.feedback-message.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.feedback-message.incorrect {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Explanation Box */
.explanation-box {
  background: rgba(59, 130, 246, 0.05);
  padding: 10px;
  margin-top: 10px;
  border-radius: 8px;
}

@media (min-width: 600px) {
  .explanation-box {
    padding: 12px;
    margin-top: 12px;
  }
}

/* Tips Card */
.tips-card {
  background: rgba(245, 158, 11, 0.05);
  border: none;
}

.tips-list {
  margin: 0;
  padding-left: 18px;
}

@media (min-width: 600px) {
  .tips-list {
    padding-left: 20px;
  }
}

.tips-list li {
  font-size: 0.8rem;
  color: #475569;
  margin-bottom: 3px;
}

@media (min-width: 600px) {
  .tips-list li {
    font-size: 0.85rem;
    margin-bottom: 4px;
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
    min-height: 300px;
  }
}

.empty-icon {
  opacity: 0.5;
}

/* Loading Spinner */
.loading-spinner {
  position: relative;
  display: inline-block;
}

/* Mobile Select */
.mobile-select :deep(.v-field) {
  font-size: 0.85rem;
}

/* Mobile Button */
.mobile-btn {
  min-height: 36px;
}

@media (max-width: 600px) {
  .mobile-btn {
    min-height: 40px;
  }
}

/* Gap Utility */
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

/* Responsive Typography */
.text-caption {
  font-size: 0.7rem;
}

@media (min-width: 600px) {
  .text-caption {
    font-size: 0.75rem;
  }
}

/* Touch-friendly tap targets - ensures minimum 44x44 for mobile */
.question-header,
.option-item,
.v-btn {
  min-height: 44px;
}

.question-header {
  min-height: 44px;
}

.option-item {
  min-height: 44px;
}
</style>