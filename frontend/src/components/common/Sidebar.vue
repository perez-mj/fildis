<template>
  <v-navigation-drawer
    v-model="drawer"
    :rail="rail"
    permanent
    @click="rail = false"
  >
    <!-- User info section -->
    <v-list-item
      v-if="!rail"
      :title="authStore.user?.name"
      :subtitle="authStore.userRole"
      class="py-4"
    >
      <template v-slot:prepend>
        <v-avatar color="primary" size="40">
          <span class="text-h6">
            {{ getUserInitials() }}
          </span>
        </v-avatar>
      </template>

      <template v-slot:append>
        <v-btn
          variant="text"
          icon="mdi-chevron-left"
          @click.stop="rail = !rail"
        ></v-btn>
      </template>
    </v-list-item>

    <!-- Rail toggle button (when rail is true) -->
    <div v-else class="d-flex justify-center py-4">
      <v-btn
        variant="text"
        icon="mdi-chevron-right"
        @click.stop="rail = !rail"
      ></v-btn>
    </div>

    <v-divider></v-divider>

    <!-- Navigation items -->
    <v-list density="compact" nav>
      <!-- Admin menu items -->
      <template v-if="authStore.userRole === 'admin'">
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
      <template v-else-if="authStore.userRole === 'teacher'">
        <v-list-item
          to="/teacher/dashboard"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
        ></v-list-item>

        <v-list-item
          to="/teacher/courses"
          prepend-icon="mdi-book-open-variant"
          title="My Courses"
          value="courses"
        ></v-list-item>

        <v-list-item
          to="/teacher/assignments"
          prepend-icon="mdi-clipboard-list"
          title="Assignments"
          value="assignments"
        ></v-list-item>

        <v-list-item
          to="/teacher/announcements"
          prepend-icon="mdi-bullhorn"
          title="Announcements"
          value="announcements"
        ></v-list-item>
      </template>

      <!-- Student menu items -->
      <template v-else-if="authStore.userRole === 'student'">
        <v-list-item
          to="/student/dashboard"
          prepend-icon="mdi-view-dashboard"
          title="Dashboard"
          value="dashboard"
        ></v-list-item>

        <v-list-item
          to="/student/courses"
          prepend-icon="mdi-book-open-variant"
          title="My Courses"
          value="courses"
        ></v-list-item>

        <v-list-item
          to="/student/assignments"
          prepend-icon="mdi-clipboard-list"
          title="Assignments"
          value="assignments"
        ></v-list-item>

        <v-list-item
          to="/student/grades"
          prepend-icon="mdi-chart-line"
          title="Grades"
          value="grades"
        ></v-list-item>

        <v-list-item
          to="/student/announcements"
          prepend-icon="mdi-bullhorn"
          title="Announcements"
          value="announcements"
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

const getUserInitials = () => {
  const name = authStore.user?.name || ''
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const isActive = (path) => {
  return route.path.startsWith(path)
}

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>