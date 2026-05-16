<!-- frontend/src/views/student/MyAssignments.vue -->
<template>
  <v-container fluid class="assignments-container">
    <!-- Page Header -->
    <div class="page-header mb-6">
      <div>
        <h1 class="text-h4 font-weight-light">Assignments</h1>
        <div class="header-accent"></div>
      </div>
    </div>

    <!-- Minimalist Tabs -->
    <v-tabs v-model="tab" color="primary" class="custom-tabs mb-4" density="comfortable">
      <v-tab value="pending" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-clock-outline</v-icon>
        Pending
        <v-chip v-if="pendingCount > 0" size="x-small" color="primary" class="ml-2" density="comfortable">
          {{ pendingCount }}
        </v-chip>
      </v-tab>
      <v-tab value="submitted" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-send-outline</v-icon>
        Submitted
      </v-tab>
      <v-tab value="graded" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-check-circle-outline</v-icon>
        Graded
      </v-tab>
      <v-tab value="all" class="text-none">
        <v-icon start size="18" class="mr-1">mdi-format-list-bulleted</v-icon>
        All
      </v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="pending">
        <AssignmentsList
          :assignments="pendingAssignments"
          empty-message="No pending assignments. Great job staying on top of your work!"
          type="pending"
        />
      </v-window-item>

      <v-window-item value="submitted">
        <AssignmentsList
          :assignments="submittedAssignments"
          empty-message="No submitted assignments waiting for grading."
          type="submitted"
        />
      </v-window-item>

      <v-window-item value="graded">
        <AssignmentsList
          :assignments="gradedAssignments"
          empty-message="No graded assignments yet. Check back after your submissions are graded."
          show-grades
          type="graded"
        />
      </v-window-item>

      <v-window-item value="all">
        <AssignmentsList
          :assignments="allAssignments"
          empty-message="No assignments available."
          type="all"
        />
      </v-window-item>
    </v-window>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center" scrim="primary" opacity="0.1">
      <v-progress-circular indeterminate size="48" color="primary"></v-progress-circular>
    </v-overlay>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStudentStore } from '@/stores/studentStore'
import { useAssignmentStore } from '@/stores/assignmentStore'
import AssignmentsList from '@/components/student/AssignmentsList.vue'

const studentStore = useStudentStore()
const assignmentStore = useAssignmentStore()

const tab = ref('pending')
const loading = ref(false)
const allAssignmentsData = ref([])

const allAssignments = computed(() => allAssignmentsData.value)

const pendingCount = computed(() => {
  const now = new Date()
  return allAssignmentsData.value.filter(a => {
    const isOverdue = new Date(a.dueDate) < now
    return !a.submission && !isOverdue
  }).length
})

const pendingAssignments = computed(() => {
  const now = new Date()
  return allAssignmentsData.value.filter(a => {
    const isOverdue = new Date(a.dueDate) < now
    return !a.submission && !isOverdue
  })
})

const submittedAssignments = computed(() => {
  return allAssignmentsData.value.filter(a => 
    a.submission && a.submission.status !== 'graded'
  )
})

const gradedAssignments = computed(() => {
  return allAssignmentsData.value.filter(a => 
    a.submission?.status === 'graded'
  )
})

const loadAssignments = async () => {
  loading.value = true
  try {
    const courses = await studentStore.fetchEnrolledCourses()
    
    const allAssignmentPromises = courses.map(course => 
      assignmentStore.fetchAssignments(course._id)
    )
    
    await Promise.all(allAssignmentPromises)
    
    const submissions = await assignmentStore.getMySubmissions()
    
    const allAssignmentsList = []
    
    for (const course of courses) {
      const courseAssignments = assignmentStore.assignments.filter(a => 
        a.courseId === course._id || a.courseId?._id === course._id
      )
      
      for (const assignment of courseAssignments) {
        const submission = submissions.find(s => 
          s.assignmentId === assignment._id || s.assignmentId?._id === assignment._id
        )
        
        allAssignmentsList.push({
          ...assignment,
          courseId: course,
          submission: submission || null
        })
      }
    }
    
    allAssignmentsData.value = allAssignmentsList
  } catch (error) {
    console.error('Failed to load assignments:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAssignments()
})
</script>

<style scoped>
.assignments-container {
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  margin-bottom: 8px;
}

.header-accent {
  width: 60px;
  height: 3px;
  background: rgb(var(--v-theme-primary));
  border-radius: 3px;
  margin-top: 8px;
}

/* Custom Tabs */
.custom-tabs :deep(.v-tab) {
  text-transform: none;
  letter-spacing: normal;
  font-weight: 500;
}

.custom-tabs :deep(.v-tab--selected) {
  background: rgba(var(--v-theme-primary), 0.05);
}

@media (max-width: 600px) {
  .custom-tabs :deep(.v-tab) {
    padding: 0 12px;
    font-size: 0.85rem;
  }
}
</style>