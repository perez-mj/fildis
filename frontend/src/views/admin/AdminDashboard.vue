<!-- frontend/src/views/admin/AdminDashboard.vue -->
<template>
  <div class="admin-dashboard">
    <v-container fluid class="pa-4 pa-sm-6">
      <!-- Header -->
      <div class="mb-6">
        <div class="d-flex align-center justify-space-between flex-wrap">
          <div>
            <h1 class="text-h4 font-weight-light mb-2">Dashboard</h1>
            <div class="section-underline"></div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-account-group" size="28" color="primary" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats.totalStudents || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Total Students</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-school" size="28" color="success" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats.totalTeachers || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Total Teachers</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-book-open-variant" size="28" color="info" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats.totalCourses || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Total Courses</div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card variant="outlined" class="stat-card text-center pa-4">
            <v-icon icon="mdi-check-circle" size="28" color="success" class="mb-2"></v-icon>
            <div class="text-h4 font-weight-light mt-1">{{ stats.activeCourses || 0 }}</div>
            <div class="text-caption text-grey-darken-1">Active Courses</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick Actions -->
      <v-row class="mt-2">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              Quick Actions
            </v-card-title>
            <v-card-text class="pa-4">
              <v-row>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    color="primary"
                    variant="outlined"
                    height="72"
                    to="/admin/teachers"
                    rounded="lg"
                    class="quick-action-btn"
                  >
                    <v-icon start size="24">mdi-account-plus</v-icon>
                    Manage Teachers
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    color="success"
                    variant="outlined"
                    height="72"
                    to="/admin/students"
                    rounded="lg"
                    class="quick-action-btn"
                  >
                    <v-icon start size="24">mdi-account-plus</v-icon>
                    Manage Students
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    color="info"
                    variant="outlined"
                    height="72"
                    to="/admin/courses"
                    rounded="lg"
                    class="quick-action-btn"
                  >
                    <v-icon start size="24">mdi-plus-circle</v-icon>
                    Create Course
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="3">
                  <v-btn
                    block
                    color="warning"
                    variant="outlined"
                    height="72"
                    to="/admin/enrollment"
                    rounded="lg"
                    class="quick-action-btn"
                  >
                    <v-icon start size="24">mdi-account-check</v-icon>
                    Enroll Students
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Enrollments -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-subtitle-1 font-weight-light pa-3 border-bottom">
              <v-icon start icon="mdi-history" size="16"></v-icon>
              Recent Enrollments
            </v-card-title>
            <v-list v-if="recentEnrollments.length" class="calm-list">
              <v-list-item v-for="enrollment in recentEnrollments" :key="enrollment._id" class="calm-list-item">
                <template v-slot:prepend>
                  <v-avatar size="32" color="primary" variant="tonal">
                    <v-icon icon="mdi-account" size="16"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ enrollment.student?.firstName }} {{ enrollment.student?.lastName }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption text-grey-darken-1">
                  Enrolled in {{ enrollment.courseName }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <span class="text-caption text-grey-darken-1">
                    {{ formatDate(enrollment.enrolledAt) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
            <v-card-text v-else class="text-center pa-6">
              <v-icon icon="mdi-account-group" size="32" color="grey-lighten-1" class="mb-2" opacity="0.5"></v-icon>
              <div class="text-caption text-grey-darken-1">No recent enrollments</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
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
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

<style scoped>
.section-underline {
  width: 60px;
  height: 3px;
  background-color: rgb(var(--v-theme-primary));
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.section-underline:hover {
  width: 64px;
}

.border-bottom {
  border-bottom: 1px solid #E2E8F0;
}

.stat-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  transform: translateY(-2px);
}

.quick-action-btn {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-btn:hover {
  transform: translateY(-1px);
}

.calm-list {
  background: transparent;
}

.calm-list-item {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
}

.calm-list-item:hover {
  transform: translateX(4px);
  background-color: rgba(99, 102, 241, 0.04);
}
</style>