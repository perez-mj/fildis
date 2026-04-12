<!-- frontend/src/components/common/Navbar.vue -->
<template>
  <v-app-bar 
    :color="appBarColor" 
    :elevation="2"
    app
    fixed
  >
    <!-- Menu toggle for mobile -->
    <v-app-bar-nav-icon
      @click="$emit('toggle-drawer')"
      class="d-md-none"
    ></v-app-bar-nav-icon>

    <!-- Logo/Title -->
    <v-app-bar-title class="text-subtitle-1 text-sm-h6">
      <v-icon 
        start 
        size="small" 
        :class="{ 'd-none': $vuetify.display.mobile && $vuetify.display.width < 360 }"
      >
        mdi-school
      </v-icon>
      
      <span v-if="!$vuetify.display.mobile || $vuetify.display.width >= 360">
        LMS Portal
      </span>
      
      <span v-else class="d-inline d-sm-none">
        LMS
      </span>
    </v-app-bar-title>

    <v-spacer></v-spacer>

    <!-- Search field -->
    <v-text-field
      v-if="!$vuetify.display.mobile || $vuetify.display.width > 600"
      v-model="search"
      density="compact"
      label="Search"
      prepend-inner-icon="mdi-magnify"
      variant="solo-filled"
      flat
      hide-details
      single-line
      class="mx-2 mx-md-4 search-field"
      style="max-width: 250px;"
    ></v-text-field>

    <!-- Search button for mobile -->
    <v-btn
      v-else
      icon="mdi-magnify"
      variant="text"
      @click="showSearchDialog = true"
    ></v-btn>

    <!-- User menu -->
    <v-menu
      v-model="userMenuOpen"
      :close-on-content-click="false"
      location="bottom end"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="text"
          class="user-menu-btn"
        >
          <v-avatar size="32" :color="avatarColor" class="mr-1">
            <span class="text-caption font-weight-bold">
              {{ getUserInitials() }}
            </span>
          </v-avatar>
          <span class="d-none d-sm-inline text-none">
            {{ shortName }}
          </span>
          <v-icon end size="small">mdi-chevron-down</v-icon>
        </v-btn>
      </template>

      <v-list density="compact" class="py-0">
        <v-list-item @click="goToProfile">
          <template v-slot:prepend>
            <v-icon>mdi-account</v-icon>
          </template>
          <v-list-item-title>Profile</v-list-item-title>
        </v-list-item>

        <v-list-item @click="goToChangePassword">
          <template v-slot:prepend>
            <v-icon>mdi-lock</v-icon>
          </template>
          <v-list-item-title>Change Password</v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item @click="logout">
          <template v-slot:prepend>
            <v-icon color="error">mdi-logout</v-icon>
          </template>
          <v-list-item-title class="text-error">Logout</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <!-- Mobile Search Dialog -->
  <v-dialog v-model="showSearchDialog" fullscreen hide-overlay transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar :color="appBarColor">
        <v-btn icon dark @click="showSearchDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-text-field
          v-model="search"
          placeholder="Search..."
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          hide-details
          single-line
          autofocus
          class="mx-4"
        ></v-text-field>
      </v-toolbar>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'vue-router'

defineEmits(['toggle-drawer'])

const authStore = useAuthStore()
const router = useRouter()
const search = ref('')
const showSearchDialog = ref(false)
const userMenuOpen = ref(false)

const appBarColor = computed(() => {
  const role = authStore.userRole
  switch(role) {
    case 'admin': return 'error'
    case 'teacher': return 'primary'
    case 'student': return 'success'
    default: return 'primary'
  }
})

const shortName = computed(() => {
  if (authStore.user?.name) {
    const parts = authStore.user.name.split(' ')
    return parts[0]
  }
  return 'User'
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

const getUserInitials = () => {
  const name = displayName.value
  if (!name || name === 'User') return '?'
  
  const parts = name.split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const logout = async () => {
  userMenuOpen.value = false
  await authStore.logout()
  router.push('/login')
}

const goToProfile = () => {
  userMenuOpen.value = false
  router.push('/profile')
}

const goToChangePassword = () => {
  userMenuOpen.value = false
  router.push('/change-password')
}
</script>

<style scoped>
.search-field {
  max-width: 250px;
}

.user-menu-btn {
  text-transform: none;
}

@media (max-width: 600px) {
  .v-app-bar-title {
    font-size: 0.9rem !important;
  }
}
</style>