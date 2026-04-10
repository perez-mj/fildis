<!-- frontend/src/views/admin/AdminDashboard.vue -->
<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-6">
          <h1 class="text-h4 font-weight-bold">Admin Dashboard</h1>
          <v-chip color="primary" variant="flat">
            <v-icon start>mdi-account</v-icon>
            Welcome, {{ authStore.userName }}
          </v-chip>
        </div>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2" color="primary" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-medium">Total Students</div>
              <div class="text-h3 font-weight-bold">{{ stats.totalStudents }}</div>
            </div>
            <v-icon size="48" color="primary">mdi-account-group</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2" color="success" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-medium">Total Teachers</div>
              <div class="text-h3 font-weight-bold">{{ stats.totalTeachers }}</div>
            </div>
            <v-icon size="48" color="success">mdi-school</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2" color="info" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-medium">Total Courses</div>
              <div class="text-h3 font-weight-bold">{{ stats.totalCourses }}</div>
            </div>
            <v-icon size="48" color="info">mdi-book-open-page-variant</v-icon>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4" elevation="2" color="warning" variant="tonal">
          <div class="d-flex align-center justify-space-between">
            <div>
              <div class="text-subtitle-1 font-weight-medium">Active Courses</div>
              <div class="text-h3 font-weight-bold">{{ stats.activeCourses }}</div>
            </div>
            <v-icon size="48" color="warning">mdi-check-circle</v-icon>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="text-h5 font-weight-bold bg-grey-lighten-3">
            Quick Actions
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                  height="80"
                  to="/admin/teachers"
                >
                  <v-icon left size="32">mdi-account-plus</v-icon>
                  <span class="ml-2">Manage Teachers</span>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  color="success"
                  variant="outlined"
                  height="80"
                  to="/admin/students"
                >
                  <v-icon left size="32">mdi-account-plus</v-icon>
                  <span class="ml-2">Manage Students</span>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  color="info"
                  variant="outlined"
                  height="80"
                  to="/admin/courses"
                >
                  <v-icon left size="32">mdi-plus-circle</v-icon>
                  <span class="ml-2">Create Course</span>
                </v-btn>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-btn
                  block
                  color="warning"
                  variant="outlined"
                  height="80"
                  to="/admin/enrollments"
                >
                  <v-icon left size="32">mdi-account-check</v-icon>
                  <span class="ml-2">Enroll Students</span>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title class="text-h5 font-weight-bold bg-grey-lighten-3">
            Recent Enrollments
          </v-card-title>
          <v-card-text>
            <v-list lines="two">
              <v-list-item
                v-for="enrollment in recentEnrollments"
                :key="enrollment._id"
                :title="`${enrollment.student[0]?.firstName} ${enrollment.student[0]?.lastName}`"
                :subtitle="`Enrolled in ${enrollment.courseName}`"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>
                <template v-slot:append>
                  <v-chip size="small" color="success">
                    {{ formatDate(enrollment.updatedAt) }}
                  </v-chip>
                </template>
              </v-list-item>
              <v-list-item v-if="recentEnrollments.length === 0">
                <div class="text-center pa-4 text-grey">
                  No recent enrollments
                </div>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useCourseStore } from '@/stores/courseStore'

const authStore = useAuthStore()
const courseStore = useCourseStore()

const stats = ref({
  totalStudents: 0,
  totalTeachers: 0,
  totalCourses: 0,
  activeCourses: 0
})
const recentEnrollments = ref([])

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}

const loadStats = async () => {
  try {
    const data = await courseStore.fetchStats()
    stats.value = data
    recentEnrollments.value = data.recentEnrollments || []
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>