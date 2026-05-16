<!-- frontend/src/layouts/DefaultLayout.vue -->
<template>
  <v-app class="default-app">
    <!-- Simple navbar with glassmorphism effect -->
    <v-app-bar 
      color="primary" 
      density="comfortable"
      elevation="0"
      class="navbar-glass"
    >
      <template v-slot:prepend>
        <div class="logo-wrapper">
          <v-icon icon="mdi-school-outline" size="28" class="mr-2"></v-icon>
          <v-app-bar-title class="font-weight-light">
            <span class="d-none d-sm-inline">Learning Management System</span>
            <span class="d-inline d-sm-none">LMS</span>
          </v-app-bar-title>
        </div>
      </template>
      
      <v-spacer></v-spacer>
      
      <div class="navbar-actions">
        <v-btn
          v-if="authStore.isAuthenticated"
          variant="text"
          @click="logout"
          class="logout-btn"
          prepend-icon="mdi-logout"
        >
          <span class="d-none d-sm-inline">Logout</span>
        </v-btn>
      </div>
    </v-app-bar>

    <!-- Main content with calming background -->
    <v-main class="main-default">
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center" class="fill-height">
          <v-col cols="12" sm="10" md="8" lg="6" xl="5">
            <router-view v-slot="{ Component }">
              <transition name="fade-up" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </v-col>
        </v-row>
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

<style scoped>
.default-app {
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  min-height: 100vh;
}

/* Glassmorphism navbar */
.navbar-glass {
  background: rgba(var(--v-theme-primary), 0.92) !important;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-wrapper {
  display: flex;
  align-items: center;
  color: white;
}

/* Custom navbar styling */
:deep(.v-toolbar-title) {
  font-weight: 300;
  letter-spacing: -0.01em;
  opacity: 0.95;
}

.logout-btn {
  transition: all 0.2s ease;
  border-radius: 20px;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.15) !important;
  transform: translateY(-1px);
}

/* Main content area */
.main-default {
  padding: 0;
  min-height: calc(100vh - 64px);
}

/* Page transition */
.fade-up-enter-active,
.fade-up-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .main-default {
    min-height: calc(100vh - 56px);
  }
  
  :deep(.v-app-bar) {
    padding: 0 8px;
  }
}

/* Smooth scrolling */
.default-app {
  scroll-behavior: smooth;
}
</style>