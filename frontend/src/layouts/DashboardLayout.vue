<!-- frontend/src/layouts/DashboardLayout.vue -->
<template>
  <v-app class="dashboard-app">
    <!-- Navbar -->
    <Navbar @toggle-drawer="toggleDrawer" />

    <!-- Sidebar -->
    <Sidebar v-model="drawer" />

    <!-- Main content -->
    <v-main class="main-content">
      <v-container 
        :fluid="$vuetify.display.mobile"
        :class="{ 
          'pa-3': $vuetify.display.mobile, 
          'pa-6': !$vuetify.display.mobile
        }"
      >
        <!-- Breadcrumbs - only on desktop and not dashboard -->
        <v-breadcrumbs 
          v-if="breadcrumbs.length > 0 && !$vuetify.display.mobile && !isDashboardPage"
          :items="breadcrumbs"
          class="px-0 pb-3"
          divider="/"
        >
          <template v-slot:title="{ item }">
            <span class="text-caption" :class="{ 'text-primary': item.disabled }">
              {{ item.title }}
            </span>
          </template>
        </v-breadcrumbs>
        
        <!-- Main router view -->
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="$vuetify.display.mobile && authStore.isAuthenticated && !drawer"
      v-model="bottomNav"
      color="primary"
      grow
      class="bottom-nav"
    >
      <v-btn 
        v-for="item in bottomNavItems" 
        :key="item.value"
        :value="item.value"
        :to="item.to"
      >
        <v-icon size="22">{{ item.icon }}</v-icon>
        <span class="text-caption mt-1">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

onMounted(() => {
  drawer.value = !mobile.value
})

const toggleDrawer = () => {
  drawer.value = !drawer.value
}

const isDashboardPage = computed(() => {
  const path = route.path
  return path.endsWith('/dashboard') || 
         path === '/admin/dashboard' || 
         path === '/teacher/dashboard' || 
         path === '/student/dashboard'
})

const breadcrumbs = computed(() => {
  const paths = route.path.split('/').filter(p => p)
  if (paths.length === 0 || paths.length === 1) return []
  
  const crumbs = []
  const role = paths[0]
  
  crumbs.push({ 
    title: 'Dashboard', 
    disabled: false, 
    to: `/${role}/dashboard` 
  })
  
  for (let i = 1; i < paths.length; i++) {
    const segment = paths[i]
    let title = ''
    let disabled = (i === paths.length - 1)
    
    // Skip numeric IDs
    if (!isNaN(segment)) continue
    
    const readableNames = {
      'courses': 'Courses',
      'materials': 'Materials',
      'assignments': 'Assignments',
      'submissions': 'Submissions',
      'grades': 'Grades',
      'announcements': 'Announcements',
      'enrollment': 'Enrollment',
      'students': 'Students',
      'teachers': 'Teachers',
      'profile': 'Profile',
      'settings': 'Settings'
    }
    
    title = readableNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    crumbs.push({
      title,
      disabled,
      to: `/${role}/${segment}`
    })
  }
  
  return crumbs
})

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
      { title: 'Tasks', icon: 'mdi-clipboard-list-outline', value: 'assignments', to: '/student/assignments' },
      { title: 'Grades', icon: 'mdi-chart-line', value: 'grades', to: '/student/grades' }
    ]
  }
  return []
})
</script>

<style scoped>
.dashboard-app {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
}

/* Page transition */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Bottom navigation - CSM style */
.bottom-nav {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1000 !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(8px);
  border-top: 1px solid #E2E8F0 !important;
  border-radius: 0 !important;
}

/* Breadcrumbs */
:deep(.v-breadcrumbs-item) {
  font-size: 0.75rem;
  color: #64748B;
}

:deep(.v-breadcrumbs-divider) {
  color: #94A3B8;
  font-size: 0.75rem;
}
</style>