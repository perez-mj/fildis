<!-- frontend/src/components/common/Sidebar.vue -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    :temporary="$vuetify.display.mobile"
    :permanent="!$vuetify.display.mobile"
    :width="280"
    location="left"
    class="sidebar-custom"
    :style="sidebarStyle"
  >
    <!-- Close button for mobile -->
    <v-btn
      v-if="$vuetify.display.mobile"
      icon="mdi-close"
      variant="text"
      class="close-btn"
      @click="closeDrawer"
    ></v-btn>

    <!-- User info section -->
    <template v-if="authStore.user">
      <v-list-item class="py-4 mt-2">
        <template v-slot:prepend>
          <v-avatar :color="avatarColor" size="48" class="avatar-large">
            <span class="text-h6 font-weight-bold">
              {{ getUserInitials() }}
            </span>
          </v-avatar>
        </template>

        <v-list-item-title class="text-subtitle-1 font-weight-bold">
          {{ displayName }}
        </v-list-item-title>
        
        <v-list-item-subtitle class="text-caption mt-1">
          <v-chip 
            :color="roleColor" 
            size="x-small" 
            class="mt-1"
            text-color="white"
            label
          >
            {{ formattedUserRole }}
          </v-chip>
        </v-list-item-subtitle>
      </v-list-item>
    </template>

    <v-divider></v-divider>

    <!-- Navigation items with scrollable area -->
    <div class="sidebar-scrollable">
      <v-list density="compact" nav class="py-2">
        <!-- Admin menu items -->
        <template v-if="authStore.isAdmin">
          <NavItem 
            to="/admin/dashboard" 
            icon="mdi-view-dashboard" 
            title="Dashboard"
            :active="isActive('/admin/dashboard')"
            @click="closeDrawerOnMobile"
          />

          <v-list-group value="Users">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-account-group"
                title="User Management"
              ></v-list-item>
            </template>

            <NavItem 
              to="/admin/teachers" 
              icon="mdi-account-tie" 
              title="Teachers"
              :active="isActive('/admin/teachers')"
              indent
              @click="closeDrawerOnMobile"
            />

            <NavItem 
              to="/admin/students" 
              icon="mdi-account-school" 
              title="Students"
              :active="isActive('/admin/students')"
              indent
              @click="closeDrawerOnMobile"
            />
          </v-list-group>

          <NavItem 
            to="/admin/courses" 
            icon="mdi-book-open-variant" 
            title="Courses"
            :active="isActive('/admin/courses')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/admin/enrollments" 
            icon="mdi-account-plus" 
            title="Enrollments"
            :active="isActive('/admin/enrollments')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/admin/announcements" 
            icon="mdi-bullhorn" 
            title="Announcements"
            :active="isActive('/admin/announcements')"
            @click="closeDrawerOnMobile"
          />
        </template>

        <!-- Teacher menu items -->
        <template v-else-if="authStore.isTeacher">
          <NavItem 
            to="/teacher/dashboard" 
            icon="mdi-view-dashboard" 
            title="Dashboard"
            :active="isActive('/teacher/dashboard')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/teacher/courses" 
            icon="mdi-book-open-variant" 
            title="My Courses"
            :active="isActive('/teacher/courses')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/teacher/assignments" 
            icon="mdi-clipboard-list" 
            title="Assignments"
            :active="isActive('/teacher/assignments')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/teacher/announcements" 
            icon="mdi-bullhorn" 
            title="Announcements"
            :active="isActive('/teacher/announcements')"
            @click="closeDrawerOnMobile"
          />
        </template>

        <!-- Student menu items -->
        <template v-else-if="authStore.isStudent">
          <NavItem 
            to="/student/dashboard" 
            icon="mdi-view-dashboard" 
            title="Dashboard"
            :active="isActive('/student/dashboard')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/student/courses" 
            icon="mdi-book-open-variant" 
            title="My Courses"
            :active="isActive('/student/courses')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/student/assignments" 
            icon="mdi-clipboard-list" 
            title="Assignments"
            :active="isActive('/student/assignments')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/student/grades" 
            icon="mdi-chart-line" 
            title="Grades"
            :active="isActive('/student/grades')"
            @click="closeDrawerOnMobile"
          />

          <NavItem 
            to="/student/announcements" 
            icon="mdi-bullhorn" 
            title="Announcements"
            :active="isActive('/student/announcements')"
            @click="closeDrawerOnMobile"
          />
        </template>
      </v-list>
    </div>

    <template v-slot:append>
      <v-divider></v-divider>
      <v-list density="compact" class="py-2">
        <NavItem 
          @click="handleLogout" 
          icon="mdi-logout" 
          title="Logout"
        />
      </v-list>
    </template>
  </v-navigation-drawer>

  <!-- Logout Confirmation Dialog -->
  <v-dialog v-model="showLogoutDialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="text-h5">
        <v-icon color="error" start>mdi-logout</v-icon>
        Confirm Logout
      </v-card-title>
      
      <v-card-text class="pt-4">
        Are you sure you want to logout?
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="showLogoutDialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          @click="confirmLogout"
          :loading="logoutLoading"
        >
          Logout
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import NavItem from './NavItem.vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const { mobile } = useDisplay()
const showLogoutDialog = ref(false)
const logoutLoading = ref(false)

const drawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Close drawer when route changes on mobile
watch(() => route.path, () => {
  if (mobile.value) {
    closeDrawer()
  }
})

// Sidebar style for mobile
const sidebarStyle = computed(() => {
  if (mobile.value) {
    return {
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      zIndex: 1000
    }
  }
  return {}
})

const displayName = computed(() => {
  if (authStore.user?.name) return authStore.user.name
  if (authStore.user?.firstName && authStore.user?.lastName) {
    return `${authStore.user.firstName} ${authStore.user.lastName}`
  }
  return 'User'
})

const formattedUserRole = computed(() => {
  const role = authStore.userRole
  if (!role) return ''
  return role.charAt(0).toUpperCase() + role.slice(1)
})

const avatarColor = computed(() => {
  const role = authStore.userRole
  switch(role) {
    case 'admin': return 'error'
    case 'teacher': return 'primary'
    case 'student': return 'success'
    default: return 'primary'
  }
})

const roleColor = computed(() => {
  const role = authStore.userRole
  switch(role) {
    case 'admin': return 'error'
    case 'teacher': return 'primary'
    case 'student': return 'success'
    default: return 'primary'
  }
})

const getUserInitials = () => {
  const name = displayName.value
  if (!name || name === 'User') return '?'
  
  const parts = name.split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const isActive = (path) => {
  return route.path.startsWith(path)
}

const closeDrawer = () => {
  if (mobile.value) {
    drawer.value = false
  }
}

const closeDrawerOnMobile = () => {
  if (mobile.value) {
    drawer.value = false
  }
}

const handleLogout = () => {
  closeDrawer()
  showLogoutDialog.value = true
}

const confirmLogout = async () => {
  logoutLoading.value = true
  try {
    await authStore.logout()
    router.push('/login')
  } catch (error) {
    console.error('Logout failed:', error)
  } finally {
    logoutLoading.value = false
    showLogoutDialog.value = false
  }
}
</script>

<style scoped>
.sidebar-custom {
  z-index: 1000;
}

.close-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 1;
}

/* Scrollable area for sidebar content */
.sidebar-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Custom scrollbar for better mobile experience */
.sidebar-scrollable::-webkit-scrollbar {
  width: 4px;
}

.sidebar-scrollable::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-scrollable::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 2px;
}

.sidebar-scrollable::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Mobile specific styles */
@media (max-width: 600px) {
  :deep(.v-navigation-drawer) {
    width: 85% !important;
    max-width: 280px;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }
  
  .avatar-large {
    margin-left: 8px;
  }
}

/* Desktop styles */
@media (min-width: 601px) {
  .close-btn {
    display: none;
  }
}

/* Animation for mobile drawer */
:deep(.v-navigation-drawer--temporary) {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
</style>