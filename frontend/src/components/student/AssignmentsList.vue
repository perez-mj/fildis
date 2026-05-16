<!-- frontend/src/components/student/AssignmentsList.vue -->
<template>
  <v-row>
    <v-col cols="12">
      <div v-if="assignments.length > 0" class="assignments-list">
        <div
          v-for="assignment in assignments"
          :key="assignment._id"
          class="assignment-card rounded-xl"
          :class="getAssignmentCardClass(assignment)"
          @click="navigateToAssignment(assignment)"
        >
          <div class="assignment-content">
            <div class="assignment-icon" :class="getAssignmentIconClass(assignment)">
              <v-icon :icon="getAssignmentIcon(assignment)" size="24"></v-icon>
            </div>
            
            <div class="assignment-info">
              <div class="assignment-header">
                <h3 class="assignment-title">{{ assignment.title }}</h3>
                <div class="assignment-badges">
                  <v-chip v-if="assignment.submission?.isLate" size="x-small" color="error" variant="light" class="rounded-pill">
                    <v-icon start size="10">mdi-clock-alert</v-icon>
                    Late
                  </v-chip>
                  <v-chip v-if="assignment.submission?.status === 'graded'" size="x-small" color="success" variant="light" class="rounded-pill">
                    <v-icon start size="10">mdi-check-circle</v-icon>
                    Graded
                  </v-chip>
                </div>
              </div>
              
              <div class="assignment-meta">
                <span class="meta-item">
                  <v-icon size="12">mdi-domain</v-icon>
                  {{ assignment.courseId?.courseCode }}
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <v-icon size="12">mdi-calendar-clock</v-icon>
                  Due: {{ formatDate(assignment.dueDate) }}
                </span>
              </div>
              
              <p class="assignment-description">{{ truncateText(assignment.description, 120) }}</p>
              
              <div class="assignment-footer">
                <div v-if="assignment.attachments?.length" class="attachments-info">
                  <v-icon size="14">mdi-paperclip</v-icon>
                  <span class="text-caption">{{ assignment.attachments.length }} file(s)</span>
                </div>
                
                <div v-if="showGrades && assignment.submission?.grade" class="grade-info" :class="getGradeClass(assignment.submission.grade.score)">
                  <v-icon size="14" :icon="getGradeIcon(assignment.submission.grade.score)"></v-icon>
                  <span class="text-caption font-weight-medium">
                    {{ assignment.submission.grade.score }}/{{ assignment.maxScore }}
                    ({{ getPercentage(assignment.submission.grade.score, assignment.maxScore) }}%)
                  </span>
                </div>
              </div>
            </div>
            
            <div class="assignment-action">
              <v-btn
                :color="getActionButtonColor(assignment)"
                :variant="getActionButtonVariant(assignment)"
                size="small"
                rounded="pill"
                :disabled="!canInteract(assignment)"
                class="action-btn"
                @click.stop="handleAction(assignment)"
              >
                <v-icon start size="14" :icon="getActionIcon(assignment)"></v-icon>
                {{ getActionText(assignment) }}
              </v-btn>
            </div>
          </div>
          
          <!-- Progress Bar for Graded Assignments -->
          <div v-if="showGrades && assignment.submission?.grade" class="assignment-progress">
            <div 
              class="progress-bar" 
              :style="{ width: getPercentage(assignment.submission.grade.score, assignment.maxScore) + '%', backgroundColor: getGradeColor(assignment.submission.grade.score) }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <v-card v-else class="rounded-xl text-center pa-8" variant="tonal">
        <div class="empty-icon mb-4">
          <v-icon size="56" color="grey-lighten-2">mdi-clipboard-list-outline</v-icon>
        </div>
        <h3 class="text-h6 font-weight-light mb-2">{{ emptyMessage }}</h3>
        <p class="text-body-2 text-medium-emphasis" v-if="emptyMessage === 'No pending assignments. Great job staying on top of your work!'">
          Take a break or review your completed work
        </p>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { format } from 'date-fns'
import { useRouter } from 'vue-router'

const props = defineProps({
  assignments: {
    type: Array,
    required: true
  },
  emptyMessage: {
    type: String,
    default: 'No assignments found'
  },
  showGrades: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy')
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1)
}

const getGradeColor = (score) => {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#3b82f6'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

const getGradeClass = (score) => {
  if (score >= 90) return 'grade-excellent'
  if (score >= 75) return 'grade-good'
  if (score >= 60) return 'grade-average'
  return 'grade-poor'
}

const getGradeIcon = (score) => {
  if (score >= 90) return 'mdi-star-circle'
  if (score >= 75) return 'mdi-check-circle'
  if (score >= 60) return 'mdi-alert-circle'
  return 'mdi-close-circle'
}

const getAssignmentCardClass = (assignment) => {
  if (assignment.submission?.status === 'graded') return 'card-graded'
  if (assignment.submission) return 'card-submitted'
  if (!canSubmit(assignment)) return 'card-closed'
  return 'card-pending'
}

const getAssignmentIconClass = (assignment) => {
  if (assignment.submission?.status === 'graded') return 'icon-graded'
  if (assignment.submission) return 'icon-submitted'
  if (!canSubmit(assignment)) return 'icon-closed'
  return 'icon-pending'
}

const getAssignmentIcon = (assignment) => {
  if (assignment.submission?.status === 'graded') return 'mdi-check-circle-outline'
  if (assignment.submission) return 'mdi-clock-outline'
  if (!canSubmit(assignment)) return 'mdi-close-circle-outline'
  return 'mdi-clipboard-list-outline'
}

const canSubmit = (assignment) => {
  const now = new Date()
  const availableFrom = new Date(assignment.availableFrom || assignment.createdAt)
  const availableUntil = new Date(assignment.availableUntil || assignment.dueDate)
  return now >= availableFrom && now <= availableUntil && new Date(assignment.dueDate) >= now
}

const canResubmit = (assignment) => {
  return canSubmit(assignment) && assignment.submission?.status !== 'graded'
}

const canInteract = (assignment) => {
  return !assignment.submission || (assignment.submission.status !== 'graded' && canResubmit(assignment))
}

const getActionText = (assignment) => {
  if (!assignment.submission) return 'Submit'
  if (assignment.submission.status === 'graded') return 'View Grade'
  if (canResubmit(assignment)) return 'Resubmit'
  return 'Closed'
}

const getActionIcon = (assignment) => {
  if (!assignment.submission) return 'mdi-send'
  if (assignment.submission.status === 'graded') return 'mdi-eye'
  if (canResubmit(assignment)) return 'mdi-refresh'
  return 'mdi-lock'
}

const getActionButtonColor = (assignment) => {
  if (!assignment.submission) return 'primary'
  if (assignment.submission.status === 'graded') return 'info'
  if (canResubmit(assignment)) return 'warning'
  return 'grey'
}

const getActionButtonVariant = (assignment) => {
  if (!assignment.submission) return 'flat'
  if (assignment.submission.status === 'graded') return 'tonal'
  if (canResubmit(assignment)) return 'tonal'
  return 'tonal'
}

const navigateToAssignment = (assignment) => {
  if (assignment.submission?.status === 'graded') {
    router.push({ name: 'MyGrades' })
  } else if (canInteract(assignment)) {
    router.push({ name: 'SubmitAssignment', params: { assignmentId: assignment._id } })
  }
}

const handleAction = (assignment) => {
  if (assignment.submission?.status === 'graded') {
    router.push({ name: 'MyGrades' })
  } else if (canInteract(assignment)) {
    router.push({ name: 'SubmitAssignment', params: { assignmentId: assignment._id } })
  }
}
</script>

<style scoped>
.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.assignment-card {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  background: white;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

.assignment-card:hover {
  transform: translateX(4px);
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.assignment-card.card-pending {
  border-left: 3px solid #6366f1;
}

.assignment-card.card-submitted {
  border-left: 3px solid #f59e0b;
  opacity: 0.85;
}

.assignment-card.card-graded {
  border-left: 3px solid #10b981;
}

.assignment-card.card-closed {
  border-left: 3px solid #94a3b8;
  opacity: 0.7;
}

.assignment-content {
  display: flex;
  gap: 16px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.assignment-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.assignment-icon.icon-pending {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.assignment-icon.icon-submitted {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.assignment-icon.icon-graded {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.assignment-icon.icon-closed {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.assignment-info {
  flex: 1;
}

.assignment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.assignment-title {
  font-size: 1rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.assignment-badges {
  display: flex;
  gap: 6px;
}

.assignment-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 10px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #64748b;
}

.meta-divider {
  color: #cbd5e1;
}

.assignment-description {
  font-size: 0.85rem;
  line-height: 1.4;
  color: #475569;
  margin: 0 0 12px 0;
}

.assignment-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.attachments-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #64748b;
}

.grade-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.75rem;
}

.grade-info.grade-excellent {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.grade-info.grade-good {
  background: rgba(59, 130, 246, 0.1);
  color: #2563eb;
}

.grade-info.grade-average {
  background: rgba(245, 158, 11, 0.1);
  color: #d97706;
}

.grade-info.grade-poor {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.assignment-action {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.action-btn {
  min-width: 100px;
}

/* Progress Bar */
.assignment-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #e2e8f0;
}

.progress-bar {
  height: 100%;
  transition: width 0.3s ease;
}

/* Empty State */
.empty-icon {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 600px) {
  .assignment-content {
    flex-direction: column;
    padding: 14px;
  }
  
  .assignment-icon {
    width: 40px;
    height: 40px;
  }
  
  .assignment-icon .v-icon {
    font-size: 20px;
  }
  
  .assignment-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .assignment-title {
    font-size: 0.9rem;
  }
  
  .assignment-description {
    font-size: 0.8rem;
  }
  
  .assignment-action {
    margin-top: 12px;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>