<!-- frontend/src/components/student/AssignmentsList.vue -->
<template>
  <v-row>
    <v-col cols="12">
      <v-card class="rounded-lg" elevation="2">
        <v-list v-if="assignments.length > 0" lines="two">
          <v-list-item v-for="assignment in assignments" :key="assignment._id" class="assignment-item">
            <template v-slot:prepend>
              <v-avatar size="48" :color="getAssignmentColor(assignment)" variant="tonal">
                <v-icon size="28">{{ getAssignmentIcon(assignment) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ assignment.title }}
              <v-chip v-if="assignment.submission?.isLate" size="x-small" color="error" class="ml-2">
                Late
              </v-chip>
              <v-chip v-if="assignment.submission?.status === 'graded'" size="x-small" color="success" class="ml-2">
                Graded
              </v-chip>
            </v-list-item-title>

            <v-list-item-subtitle>
              <div class="text-caption">
                {{ assignment.courseId?.courseCode }} - {{ assignment.courseId?.courseName }}
              </div>
              <div class="text-body-2 mt-1">
                {{ assignment.description }}
              </div>
              <div v-if="assignment.attachments && assignment.attachments.length > 0" class="mt-1">
                <div class="d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-attachment</v-icon>
                  <span class="text-caption text-medium-emphasis">
                    {{ assignment.attachments.length }} attachment(s)
                  </span>
                  <v-btn variant="text" size="x-small" color="primary" class="ml-2"
                    @click.stop="showAttachments(assignment)">
                    View
                  </v-btn>
                </div>
              </div>
              <div class="text-caption mt-1">
                Due: {{ formatDate(assignment.dueDate) }}
                <span v-if="showGrades && assignment.submission?.grade">
                  • Score: {{ assignment.submission.grade.score }}/{{ assignment.maxScore }}
                  ({{ getPercentage(assignment.submission.grade.score, assignment.maxScore) }}%)
                </span>
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn v-if="!assignment.submission && canSubmit(assignment)" color="primary" variant="flat" size="small"
                :to="{ name: 'SubmitAssignment', params: { assignmentId: assignment._id } }">
                Submit
              </v-btn>
              <v-btn
                v-else-if="assignment.submission && assignment.submission.status !== 'graded' && canResubmit(assignment)"
                color="warning" variant="tonal" size="small"
                :to="{ name: 'SubmitAssignment', params: { assignmentId: assignment._id } }">
                Resubmit
              </v-btn>
              <v-btn v-else-if="assignment.submission?.status === 'graded'" color="info" variant="tonal" size="small"
                @click="viewGrade(assignment)">
                View Grade
              </v-btn>
              <v-btn v-else color="grey" variant="tonal" size="small" disabled>
                Closed
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-card-text v-else class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-clipboard-list-outline</v-icon>
          <h3 class="text-h6 mb-2">{{ emptyMessage }}</h3>
        </v-card-text>
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
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

const getPercentage = (score, maxScore) => {
  if (!score || !maxScore) return 0
  return ((score / maxScore) * 100).toFixed(1)
}

const getAssignmentColor = (assignment) => {
  if (assignment.submission?.status === 'graded') return 'success'
  if (assignment.submission) return 'warning'
  if (new Date(assignment.dueDate) < new Date()) return 'error'
  return 'primary'
}

const getAssignmentIcon = (assignment) => {
  if (assignment.submission?.status === 'graded') return 'mdi-check-circle'
  if (assignment.submission) return 'mdi-clock'
  if (new Date(assignment.dueDate) < new Date()) return 'mdi-close-circle'
  return 'mdi-clipboard-list'
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

const viewGrade = (assignment) => {
  router.push({ name: 'MyGrades' })
}

const showAttachments = (assignment) => {
  // Open attachments in a new window or show dialog
  if (assignment.attachments && assignment.attachments.length > 0) {
    // Open the first attachment or show a dialog
    window.open(assignment.attachments[0].webViewLink, '_blank')
  }
}
</script>

<style scoped>
.assignment-item {
  transition: background-color 0.2s;
  cursor: pointer;
}

.assignment-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>