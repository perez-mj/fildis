<template>
  <v-app>
    <router-view />
    
    <!-- Global Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, provide } from 'vue'

// Global snackbar state
const snackbar = ref({
  show: false,
  text: '',
  color: 'info'
})

// Provide snackbar to all components
provide('snackbar', snackbar)
</script>