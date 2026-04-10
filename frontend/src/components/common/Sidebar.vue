<!-- frontend/src/components/common/Sidebar.vue -->
<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    @click="rail = false"
  >
    <!-- User info section -->
    <template v-if="authStore.user">
      <v-list-item
        v-if="!rail"
        :title="displayName"
        :subtitle="formattedUserRole"
        class="py-4"
      >
        <template v-slot:prepend>
          <v-avatar :color="avatarColor" size="40">
            <span class="text-h6">
              {{ getUserInitials() }}
            </span>
          </v-avatar>
        </template>

        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="toggleRail"
          ></v-btn>
        </template>
      </v-list-item>

      <!-- Rail toggle button (when rail is true) -->
      <div v-else class="d-flex justify-center py-4">
        <v-btn
          variant="text"
          icon="mdi-chevron-right"
          @click.stop="toggleRail"
        ></v-btn>
      </div>
    </template>

    <!-- Loading state -->
    <div v-else-if="authStore.loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate size="32"></v-progress-circular>
    </div>

    <v-divider v-if="authStore.user"></v-divider>

    <!-- Navigation items -->
    <v-list density="compact" nav>
      <!-- Admin menu items -->
      <template v-if="authStore.isAdmin">
        <v-list-item
          to="/admin/dashboard"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          :active="isActive('/admin/dashboard')"
        ></v-list-item>

        <v-list-group value="Users">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-account-group"
              title="User Management"
            ></v-list-item>
          </template>

          <v-list-item
            to="/admin/teachers"
            prepend-icon="mdi-account-tie"
            title="Teachers"
            value="teachers"
          ></v-list-item>

          <v-list-item
            to="/admin/students"
            prepend-icon="mdi-account-school"
            title="Students"
            value="students"
          ></v-list-item>
        </v-list-group>

        <v-list-item
          to="/admin/courses"
          prepend-icon="mdi-book-open-variant"
          title="Courses"
          value="courses"
        ></v-list-item>

        <v-list-item
          to="/admin/enrollments"
          prepend-icon="mdi-account-plus"
          title="Enrollments"
          value="enrollments"
        ></v-list-item>

        <v-list-item
          to="/admin/announcements"
          prepend-icon="mdi-bullhorn"
          title="Announcements"
          value="announcements"
        ></v-list-item>
      </template>

      <!-- Teacher menu items -->
      <template v-else-if="authStore.isTeacher">
        <v-list-item
          to="/teacher/dashboard"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          :active="isActive('/teacher/dashboard')"
        ></v-list-item>

        <v-list-item
          to="/teacher/courses"
          prepend-icon="mdi-book-open-variant"
          title="My Courses"
          value="courses"
          :active="isActive('/teacher/courses')"
        ></v-list-item>

        <v-list-item
          to="/teacher/assignments"
          prepend-icon="mdi-clipboard-list"
          title="Assignments"
          value="assignments"
          :active="isActive('/teacher/assignments')"
        ></v-list-item>

        <v-list-item
          to="/teacher/announcements"
          prepend-icon="mdi-bullhorn"
          title="Announcements"
          value="announcements"
          :active="isActive('/teacher/announcements')"
        ></v-list-item>
      </template>

      <!-- Student menu items -->
      <template v-else-if="authStore.isStudent">
        <v-list-item
          to="/student/dashboard"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
          :active="isActive('/student/dashboard')"
        ></v-list-item>

        <v-list-item
          to="/student/courses"
          prepend-icon="mdi-book-open-variant"
          title="My Courses"
          value="courses"
          :active="isActive('/student/courses')"
        ></v-list-item>

        <v-list-item
          to="/student/assignments"
          prepend-icon="mdi-clipboard-list"
          title="Assignments"
          value="assignments"
          :active="isActive('/student/assignments')"
        ></v-list-item>

        <v-list-item
          to="/student/grades"
          prepend-icon="mdi-chart-line"
          title="Grades"
          value="grades"
          :active="isActive('/student/grades')"
        ></v-list-item>

        <v-list-item
          to="/student/announcements"
          prepend-icon="mdi-bullhorn"
          title="Announcements"
          value="announcements"
          :active="isActive('/student/announcements')"
        ></v-list-item>
      </template>
    </v-list>

    <template v-slot:append>
      <v-divider></v-divider>
      <v-list density="compact">
        <v-list-item
          @click="logout"
          prepend-icon="mdi-logout"
          title="Logout"
          value="logout"
        ></v-list-item>
      </v-list>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const drawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const rail = ref(false)

// Computed properties for better display
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
    case 'admin': return 'red'
    case 'teacher': return 'blue'
    case 'student': return 'green'
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

const toggleRail = () => {
  rail.value = !rail.value
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Optional: Add some styling for better UX */
.v-list-item :deep(.v-list-item__prepend) {
  margin-right: 12px;
}

.v-navigation-drawer :deep(.v-list-item__append) {
  margin-left: auto;
}
</style>