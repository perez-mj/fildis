<!-- frontend/src/layouts/DashboardLayout.vue -->
<template>
  <v-app class="dashboard-app">
    <!-- Navbar - sticky with glass effect -->
    <Navbar @toggle-drawer="toggleDrawer" />

    <!-- Sidebar -->
    <Sidebar v-model="drawer" />

    <!-- Main content with proper spacing -->
    <v-main class="main-content" :class="{ 'mobile-main': $vuetify.display.mobile }">
      <v-container 
        :fluid="$vuetify.display.mobile"
        :class="{ 
          'pa-3': $vuetify.display.mobile, 
          'pa-6': !$vuetify.display.mobile,
          'pb-16': $vuetify.display.mobile
        }"
      >
        <!-- Breadcrumbs - only show on desktop and when not on dashboard -->
        <v-breadcrumbs 
          v-if="breadcrumbs.length > 0 && !$vuetify.display.mobile && !isDashboardPage"
          :items="breadcrumbs"
          class="px-0 pb-3 breadcrumb-custom"
          divider="/"
        >
          <template v-slot:title="{ item }">
            <span class="text-body-2" :class="{ 'text-primary': item.disabled }">
              {{ item.title }}
            </span>
          </template>
        </v-breadcrumbs>
        
        <!-- Main router view -->
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </v-container>
    </v-main>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="$vuetify.display.mobile && authStore.isAuthenticated && !drawer"
      v-model="bottomNav"
      color="primary"
      grow
      class="bottom-nav-fixed"
      app
      elevation="8"
    >
      <v-btn 
        v-for="item in bottomNavItems" 
        :key="item.value"
        :value="item.value"
        :to="item.to"
        class="bottom-nav-btn"
      >
        <v-icon size="24">{{ item.icon }}</v-icon>
        <span class="text-caption mt-1">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Overlay for mobile -->
    <v-overlay
      v-if="$vuetify.display.mobile && drawer"
      :model-value="drawer"
      class="sidebar-overlay"
      @click="drawer = false"
      scrim
      persistent
      opacity="0.5"
    />
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useDisplay } from 'vuetify'
import Navbar from '@/components/common/Navbar.vue'
import Sidebar from '@/components/common/Sidebar.vue'

const route = useRoute()
const authStore = useAuthStore()
const { mobile } = useDisplay()
const drawer = ref(false)
const bottomNav = ref('dashboard')

// Store course names for breadcrumbs
const courseNames = ref(new Map())

// Initialize drawer based on screen size
onMounted(() => {
  if (!mobile.value) {
    drawer.value = true
  } else {
    drawer.value = false
  }
})

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

// Check if current page is a dashboard (where we don't want breadcrumbs)
const isDashboardPage = computed(() => {
  const path = route.path
  return path.endsWith('/dashboard') || 
         path === '/admin/dashboard' || 
         path === '/teacher/dashboard' || 
         path === '/student/dashboard'
})

// Get readable names for different route types
const getReadableName = (segment, params) => {
  // Handle course IDs
  if (segment === 'courses' && params.courseId) {
    return 'Course Details'
  }
  if (segment === 'materials' && params.courseId) {
    return 'Materials'
  }
  if (segment === 'assignments') {
    if (params.assignmentId) return 'Assignment Details'
    if (params.courseId) return 'Assignments'
    return 'Assignments'
  }
  if (segment === 'grades') return 'Grades'
  if (segment === 'announcements') return 'Announcements'
  if (segment === 'enrollment') return 'Enrollment'
  
  // Default readable names for common segments
  const readableNames = {
    'dashboard': 'Dashboard',
    'courses': 'Courses',
    'students': 'Students',
    'teachers': 'Teachers',
    'materials': 'Materials',
    'profile': 'Profile',
    'settings': 'Settings'
  }
  
  return readableNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

// Breadcrumbs with meaningful names
const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(p => p)
  if (paths.length === 0 || paths.length === 1) return []
  
  const crumbs = []
  let currentPath = ''
  const role = paths[0] // admin, teacher, student
  
  // Add dashboard as first crumb
  crumbs.push({ 
    title: 'Dashboard', 
    disabled: false, 
    to: `/${role}/dashboard` 
  })
  
  // Process remaining segments
  for (let i = 1; i < paths.length; i++) {
    const segment = paths[i]
    currentPath += `/${segment}`
    
    let title = ''
    let disabled = (i === paths.length - 1)
    
    // Handle different route patterns
    if (segment === 'courses' && paths[i + 1] && !isNaN(paths[i + 1])) {
      // This is a course ID segment, skip it in breadcrumbs
      continue
    } else if (segment === 'materials' && paths[i - 1] === 'courses') {
      title = 'Materials'
    } else if (segment === 'assignments') {
      title = 'Assignments'
    } else if (segment === 'grades') {
      title = 'Grades'
    } else if (segment === 'announcements') {
      title = 'Announcements'
    } else if (segment === 'enrollment') {
      title = 'Course Enrollment'
    } else if (segment === 'students') {
      title = 'Students'
    } else if (segment === 'teachers') {
      title = 'Teachers'
    } else if (segment === 'dashboard') {
      continue // Skip dashboard in middle of breadcrumbs
    } else if (!isNaN(segment)) {
      // This is an ID, skip it
      continue
    } else {
      title = segment.charAt(0).toUpperCase() + segment.slice(1)
    }
    
    if (title) {
      crumbs.push({
        title,
        disabled,
        to: currentPath
      })
    }
  }
  
  return crumbs
})

// Bottom navigation items
const bottomNavItems = computed(() => {
  if (authStore.isAdmin) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', value: 'dashboard', to: '/admin/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-outline', value: 'courses', to: '/admin/courses' },
      { title: 'Users', icon: 'mdi-account-group-outline', value: 'users', to: '/admin/students' }
    ]
  } else if (authStore.isTeacher) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', value: 'dashboard', to: '/teacher/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-outline', value: 'courses', to: '/teacher/courses' },
      { title: 'Assignments', icon: 'mdi-clipboard-list-outline', value: 'assignments', to: '/teacher/assignments' }
    ]
  } else if (authStore.isStudent) {
    return [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', value: 'dashboard', to: '/student/dashboard' },
      { title: 'Courses', icon: 'mdi-book-open-outline', value: 'courses', to: '/student/courses' },
      { title: 'Assignments', icon: 'mdi-clipboard-list-outline', value: 'assignments', to: '/student/assignments' },
      { title: 'Grades', icon: 'mdi-chart-line', value: 'grades', to: '/student/grades' }
    ]
  }
  return []
})
</script>

<style scoped>
.dashboard-app {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* Content wrapper */
.content-wrapper {
  background: transparent;
  border-radius: 16px;
  transition: all 0.3s ease;
}

/* Page transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile specific styles */
@media (max-width: 600px) {
  .text-h5 {
    font-size: 1.5rem !important;
  }
}

/* Bottom navigation styling */
.bottom-nav-fixed {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.bottom-nav-btn {
  transition: all 0.2s ease;
}

.bottom-nav-btn:hover {
  transform: translateY(-2px);
}

.mobile-main {
  padding-bottom: 0 !important;
}

/* Sidebar overlay */
.sidebar-overlay {
  z-index: 999 !important;
  background: rgba(0, 0, 0, 0.3) !important;
}

/* ========== FIXED MODAL STYLES ========== */

/* Ensure overlay has proper background */
:deep(.v-overlay__scrim) {
  background-color: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(2px);
}

/* Fix for modals - ensure they're centered properly and have background */
:deep(.v-overlay__content) {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: transparent !important;
}

/* Dialog styling with solid background */
:deep(.v-dialog) {
  margin: 16px;
  position: relative;
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.v-dialog > .v-card) {
  margin: 0;
  width: 100%;
  background: white !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
}

/* Ensure modal content has white background */
:deep(.v-card) {
  background-color: white !important;
}

/* Fix for v-dialog-enter-active transition */
:deep(.v-dialog-enter-active) {
  transition: opacity 0.2s ease, transform 0.2s ease !important;
}

:deep(.v-dialog-leave-active) {
  transition: opacity 0.15s ease, transform 0.15s ease !important;
}

:deep(.v-dialog-enter-from),
:deep(.v-dialog-leave-to) {
  opacity: 0;
  transform: scale(0.95);
}

/* Ensure proper modal centering on mobile */
@media (max-width: 600px) {
  :deep(.v-dialog) {
    width: calc(100% - 32px) !important;
    margin: 16px !important;
    max-height: calc(100% - 32px) !important;
  }
  
  :deep(.v-overlay__content) {
    align-items: center;
    justify-content: center;
    padding: 16px;
  }
  
  :deep(.v-dialog > .v-card) {
    margin: 0 !important;
  }
}

/* Fix for v-menu and v-select dropdowns */
:deep(.v-menu__content) {
  background: white !important;
  border-radius: 12px !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
}

:deep(.v-list) {
  background: white !important;
  border-radius: 12px !important;
}

/* Fix for snackbar */
:deep(.v-snackbar__wrapper) {
  background: white !important;
}

/* Smooth transitions */
@media (max-width: 600px) {
  .bottom-nav-fixed {
    transition: opacity 0.2s ease;
  }
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Breadcrumb styling */
.breadcrumb-custom {
  opacity: 0.7;
}

.breadcrumb-custom :deep(.v-breadcrumbs-item) {
  font-size: 0.875rem;
}

.breadcrumb-custom :deep(.v-breadcrumbs-divider) {
  color: #94a3b8;
}
</style>