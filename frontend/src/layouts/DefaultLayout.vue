<!-- frontend/src/layouts/DefaultLayout.vue -->
<template>
  <v-app>
    <!-- Simple navbar without sidebar -->
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>LMS System</v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <v-btn
        v-if="authStore.isAuthenticated"
        variant="text"
        @click="logout"
      >
        <v-icon start>mdi-logout</v-icon>
        Logout
      </v-btn>
    </v-app-bar>

    <!-- Main content -->
    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>