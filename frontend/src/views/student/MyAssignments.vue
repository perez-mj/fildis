<!-- frontend/src/views/student/MyAssignments.vue -->
<template>
  <v-container fluid>

    <!-- Tabs -->
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="pending">Pending Assignments</v-tab>
      <v-tab value="submitted">Submitted</v-tab>
      <v-tab value="graded">Graded</v-tab>
      <v-tab value="all">All Assignments</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="pending">
        <assignments-list
          :assignments="pendingAssignments"
          empty-message="No pending assignments. Great job staying on top of your work!"
        />
      </v-window-item>

      <v-window-item value="submitted">
        <assignments-list
          :assignments="submittedAssignments"
          empty-message="No submitted assignments waiting for grading."
        />
      </v-window-item>

      <v-window-item value="graded">
        <assignments-list
          :assignments="gradedAssignments"
          empty-message="No graded assignments yet. Check back after your submissions are graded."
          show-grades
        />
      </v-window-item>

      <v-window-item value="all">
        <assignments-list
          :assignments="allAssignments"
          empty-message="No assignments available."
        />
      </v-window-item>
    </v-window>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
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

const pendingAssignments = computed(() => {
  const now = new Date()
  return allAssignmentsData.value.filter(a => {
    // Not submitted yet and not overdue
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
    // First, get all enrolled courses
    const courses = await studentStore.fetchEnrolledCourses()
    
    // Then fetch assignments for each course
    const allAssignmentPromises = courses.map(course => 
      assignmentStore.fetchAssignments(course._id)
    )
    
    await Promise.all(allAssignmentPromises)
    
    // Get submissions for each assignment
    const submissions = await assignmentStore.getMySubmissions()
    
    // Combine assignments with their submissions
    const allAssignmentsList = []
    
    for (const course of courses) {
      // Get assignments for this course
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