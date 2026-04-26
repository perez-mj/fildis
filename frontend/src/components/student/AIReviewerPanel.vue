<!-- frontend/src/components/student/AIReviewerPanel.vue -->
<template>
  <v-card class="ai-reviewer-panel rounded-lg" elevation="2">
    <v-card-title class="d-flex justify-space-between align-center pa-4 bg-surface-variant">
      <div>
        <v-icon color="success" class="mr-2">mdi-school</v-icon>
        <span class="text-h6">AI Reviewer</span>
        <v-chip size="x-small" class="ml-2" color="success" variant="outlined">Practice Questions</v-chip>
        <!-- Add language indicator -->
        <v-chip 
          v-if="reviewer?.detectedLanguage" 
          size="x-small" 
          class="ml-2" 
          :color="reviewer.detectedLanguage === 'filipino' ? 'success' : 'info'"
        >
          <v-icon start size="12" class="mr-1">mdi-translate</v-icon>
          {{ reviewer.detectedLanguage === 'filipino' ? 'Filipino' : 'English' }}
        </v-chip>

      </div>
      <div>
        <v-btn
          icon="mdi-cog"
          size="small"
          variant="text"
          @click="showSettings = !showSettings"
        ></v-btn>
        <v-btn
          v-if="reviewer && !loading"
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="regenerate"
          :loading="generating"
        ></v-btn>
        <v-btn icon="mdi-close" size="small" variant="text" @click="$emit('close')"></v-btn>
      </div>
    </v-card-title>

    <v-card-text class="pa-4">
      <!-- Settings Panel -->
      <v-expand-transition>
        <v-card v-if="showSettings" variant="tonal" class="mb-4 pa-3">
          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="settings.numQuestions"
                label="Number of Questions"
                :items="[5, 10, 15, 20]"
                density="compact"
                variant="outlined"
                hide-details
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
              ></v-select>
            </v-col>
            <v-col cols="12" class="text-right">
              <v-btn size="small" color="primary" @click="applySettings">Apply</v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-expand-transition>

      <!-- Loading State -->
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular indeterminate color="success" size="48" class="mb-4" />
        <p class="text-body-1">Generating practice questions...</p>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- Reviewer Display -->
      <div v-else-if="reviewer && reviewer.questions" class="reviewer-content">
        <div class="mb-4">
          <v-chip color="success" size="small" class="mr-2">
            {{ reviewer.questions.length }} Questions
          </v-chip>
          <v-chip size="small" variant="outlined">
            Difficulty: {{ reviewer.settings?.difficulty || 'medium' }}
          </v-chip>
        </div>

        <div v-if="reviewer.summary" class="mb-4">
          <v-alert type="info" variant="tonal" density="compact">
            {{ reviewer.summary }}
          </v-alert>
        </div>

        <!-- Questions List -->
        <v-expansion-panels v-model="expandedPanels" multiple>
          <v-expansion-panel
            v-for="(question, index) in reviewer.questions"
            :key="question.id"
            :value="index"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-chip
                  size="x-small"
                  :color="getQuestionTypeColor(question.type)"
                  class="mr-3"
                >
                  {{ getQuestionTypeLabel(question.type) }}
                </v-chip>
                <span class="text-body-2">Question {{ index + 1 }}</span>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <div class="question-content pa-2">
                <p class="text-body-1 font-weight-medium mb-3">{{ question.question }}</p>
                
                <!-- Multiple Choice Options -->
                <v-radio-group
                  v-if="question.type === 'multiple_choice'"
                  v-model="userAnswers[question.id]"
                  dense
                  hide-details
                  class="mt-0"
                >
                  <v-radio
                    v-for="option in question.options"
                    :key="option"
                    :label="option"
                    :value="option"
                    density="compact"
                  ></v-radio>
                </v-radio-group>

                <!-- True/False Options -->
                <v-radio-group
                  v-if="question.type === 'true_false'"
                  v-model="userAnswers[question.id]"
                  dense
                  hide-details
                >
                  <v-radio label="True" value="true"></v-radio>
                  <v-radio label="False" value="false"></v-radio>
                </v-radio-group>

                <!-- Short Answer -->
                <v-textarea
                  v-if="question.type === 'short_answer'"
                  v-model="userAnswers[question.id]"
                  label="Your answer"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-textarea>

                <!-- Check Answer Button -->
                <div class="mt-3 d-flex align-center">
                  <v-btn
                    size="small"
                    color="primary"
                    variant="tonal"
                    @click="checkAnswer(question.id)"
                    :disabled="!userAnswers[question.id]"
                  >
                    Check Answer
                  </v-btn>
                  
                  <div v-if="answerFeedback[question.id]" class="ml-3">
                    <v-icon
                      :color="answerFeedback[question.id].isCorrect ? 'success' : 'error'"
                      size="small"
                      class="mr-1"
                    >
                      {{ answerFeedback[question.id].isCorrect ? 'mdi-check-circle' : 'mdi-close-circle' }}
                    </v-icon>
                    <span class="text-caption">{{ answerFeedback[question.id].message }}</span>
                  </div>
                </div>

                <!-- Explanation (shown after checking) -->
                <v-expand-transition>
                  <v-alert
                    v-if="showExplanations[question.id] && question.explanation"
                    type="info"
                    variant="tonal"
                    density="compact"
                    class="mt-3"
                  >
                    <strong>Explanation:</strong> {{ question.explanation }}
                  </v-alert>
                </v-expand-transition>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Study Tips -->
        <v-card v-if="reviewer.studyTips?.length" variant="tonal" class="mt-4 pa-3">
          <div class="text-subtitle-2 font-weight-medium mb-2">
            <v-icon size="small" class="mr-1">mdi-lightbulb</v-icon>
            Study Tips
          </div>
          <ul class="pl-4 mb-0">
            <li v-for="tip in reviewer.studyTips" :key="tip" class="text-caption mb-1">
              {{ tip }}
            </li>
          </ul>
        </v-card>

        <div class="text-caption text-medium-emphasis mt-4 pt-2 text-right">
          <span>Generated: {{ formatDate(reviewer.generatedAt) }}</span>
          <v-chip v-if="cached" size="x-small" variant="flat" class="ml-2">Cached</v-chip>
        </div>
      </div>

      <!-- No Reviewer State -->
      <div v-else class="text-center pa-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-clipboard-text</v-icon>
        <p class="text-body-1">Generate practice questions to test your understanding</p>
        <v-btn
          color="success"
          variant="tonal"
          @click="generate"
          :loading="generating"
          prepend-icon="mdi-sparkles"
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
    multiple_choice: 'Multiple Choice',
    true_false: 'True/False',
    short_answer: 'Short Answer'
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

const checkAnswer = (questionId) => {
  const question = reviewer.value?.questions.find(q => q.id === questionId)
  if (!question) return

  const userAnswer = userAnswers.value[questionId]
  let isCorrect = false
  let message = ''

  switch (question.type) {
    case 'multiple_choice':
      isCorrect = userAnswer === question.correctAnswer
      message = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
      break
    case 'true_false':
      isCorrect = userAnswer === String(question.correctAnswer).toLowerCase()
      message = isCorrect ? 'Correct!' : `Incorrect. The correct answer is: ${question.correctAnswer}`
      break
    case 'short_answer':
      const keywords = question.correctAnswer.toLowerCase().split(/[ ,]+/)
      const answerLower = userAnswer.toLowerCase()
      isCorrect = keywords.some(k => answerLower.includes(k))
      message = isCorrect ? 'Good answer!' : 'Review the material and try again.'
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
    // Reset user answers
    userAnswers.value = {}
    answerFeedback.value = {}
    showExplanations.value = {}
    expandedPanels.value = []
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to generate reviewer'
    console.error('Reviewer generation failed:', err)
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

// Auto-generate when component mounts
generate()
</script>

<style scoped>
.ai-reviewer-panel {
  min-width: 400px;
  max-width: 700px;
}

.reviewer-content {
  max-height: 70vh;
  overflow-y: auto;
}

.question-content {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
}
</style>