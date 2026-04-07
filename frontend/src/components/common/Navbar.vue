<template>
  <v-app-bar color="primary">
    <!-- Mobile menu toggle -->
    <v-app-bar-nav-icon
      @click="$emit('toggle-drawer')"
      class="d-md-none"
    ></v-app-bar-nav-icon>

    <!-- Logo/Title -->
    <v-app-bar-title>
      <v-icon start>mdi-school</v-icon>
      LMS Portal
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- Search (optional) -->
    <v-text-field
      v-model="search"
      density="compact"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="solo-filled"
      flat
      hide-details
      single-line
      class="mx-4"
      style="max-width: 300px;"
    ></v-text-field>

    <!-- User menu -->
    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
        >
          <v-icon start>mdi-account-circle</v-icon>
          {{ authStore.user?.name || 'User' }}
          <v-icon end>mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item @click="goToProfile">
          <v-list-item-title>
            <v-icon start>mdi-account</v-icon>
            Profile
          </v-list-item-title>
        </v-list-item>

        <v-list-item @click="goToChangePassword">
          <v-list-item-title>
            <v-icon start>mdi-lock</v-icon>
            Change Password
          </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="logout">
          <v-list-item-title>
            <v-icon start>mdi-logout</v-icon>
            Logout
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

defineEmits(['toggle-drawer'])

const authStore = useAuthStore()
const router = useRouter()
const search = ref('')

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

const goToProfile = () => {
  router.push('/profile')
}

const goToChangePassword = () => {
  router.push('/change-password')
}
</script>