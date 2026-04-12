<!-- frontend/src/layouts/DashboardLayout.vue -->
<template>
  <v-app>
    <!-- Navbar - sticky -->
    <Navbar @toggle-drawer="toggleDrawer" />

    <!-- Sidebar -->
    <Sidebar v-model="drawer" />

    <!-- Main content with proper spacing -->
    <v-main class="main-content" :class="{ 'mobile-main': $vuetify.display.mobile }">
      <v-container 
        :fluid="$vuetify.display.mobile"
        :class="{ 
          'pa-2': $vuetify.display.mobile, 
          'pa-4': !$vuetify.display.mobile,
          'pb-16': $vuetify.display.mobile
        }"
      >
        <!-- Breadcrumbs -->
        <v-breadcrumbs 
          v-if="breadcrumbs.length > 0 && !$vuetify.display.mobile"
          :items="breadcrumbs"
          class="px-0 pb-4"
        ></v-breadcrumbs>
        
        <!-- Page header -->
        <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
          <h1 class="text-h5 text-md-h4 font-weight-bold">
            {{ pageTitle }}
          </h1>
          
          <slot name="actions"></slot>
        </div>
        
        <!-- Main router view -->
        <router-view />
      </v-container>
    </v-main>

    <!-- Mobile Bottom Navigation - only show when sidebar is closed -->
    <v-bottom-navigation
      v-if="$vuetify.display.mobile && authStore.isAuthenticated && !drawer"
      v-model="bottomNav"
      color="primary"
      grow
      class="bottom-nav-fixed"
      app
    >
      <v-btn 
        v-for="item in bottomNavItems" 
        :key="item.value"
        :value="item.value"
        :to="item.to"
      >
        <v-icon>{{ item.icon }}</v-icon>
        <span>{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Overlay for mobile when sidebar is open -->
    <v-overlay
      v-if="$vuetify.display.mobile && drawer"
      :model-value="drawer"
      class="sidebar-overlay"
      @click="drawer = false"
      scrim
      persistent
    />
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import Navbar from '@/components/common/Navbar.vue'
import Sidebar from '@/components/common/Sidebar.vue'

const route = useRoute()
const authStore = useAuthStore()
const drawer = ref(false)
const bottomNav = ref('dashboard')

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Reset bottom nav when sidebar closes
watch(drawer, (newValue) => {
  if (!newValue && bottomNav.value) {
    // Bottom nav becomes visible again
    bottomNav.value = bottomNav.value
  }
})

// Page title based on route
const pageTitle = computed(() => {
  const routeName = route.name
  const titles = {
    AdminDashboard: 'Dashboard',
    ManageTeachers: 'Teachers',
    ManageStudents: 'Students',
    ManageCourses: 'Courses',
    CourseEnrollment: 'Enrollments',
    TeacherDashboard: 'Dashboard',
    TeacherCourses: 'My Courses',
    ManageAssignments: 'Assignments',
    StudentDashboard: 'Dashboard',
    StudentCourses: 'My Courses',
    MyAssignments: 'Assignments',
    MyGrades: 'Grades'
  }
  return titles[routeName] || 'LMS Portal'
})

// Breadcrumbs
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(p => p)
  if (paths.length === 0) return []
  
  const crumbs = [{ title: 'Home', disabled: false, to: `/${paths[0]}/dashboard` }]
  let currentPath = ''
  
  for (let i = 1; i < paths.length; i++) {
    currentPath += `/${paths[i]}`
    crumbs.push({
      title: paths[i].charAt(0).toUpperCase() + paths[i].slice(1),
      disabled: i === paths.length - 1,
      to: currentPath
    })
  }
  
  return crumbs
})

// Bottom navigation items
const bottomNavItems = computed(() => {
  if (authStore.isAdmin) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/admin/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-variant', value: 'courses', to: '/admin/courses' },
      { title: 'Users', icon: 'mdi-account-group', value: 'users', to: '/admin/students' }
    ]
  } else if (authStore.isTeacher) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/teacher/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-variant', value: 'courses', to: '/teacher/courses' },
      { title: 'Assignments', icon: 'mdi-clipboard-list', value: 'assignments', to: '/teacher/assignments' }
    ]
  } else if (authStore.isStudent) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/student/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-variant', value: 'courses', to: '/student/courses' },
      { title: 'Assignments', icon: 'mdi-clipboard-list', value: 'assignments', to: '/student/assignments' },
      { title: 'Grades', icon: 'mdi-chart-line', value: 'grades', to: '/student/grades' }
    ]
  }
  return []
})
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

@media (max-width: 600px) {
  .text-h5 {
    font-size: 1.25rem !important;
  }
}

/* Mobile specific styles */
.bottom-nav-fixed {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
}

.mobile-main {
  padding-bottom: 0 !important;
}

/* Sidebar overlay */
.sidebar-overlay {
  z-index: 999 !important;
}

/* Hide bottom nav when sidebar is open */
@media (max-width: 600px) {
  .bottom-nav-fixed {
    transition: opacity 0.2s ease;
  }
}
</style>