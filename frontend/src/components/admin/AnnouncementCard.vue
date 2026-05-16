<!-- frontend/src/components/common/AnnouncementCard.vue -->
<template>
  <v-card class="announcement-card" :class="{ 'priority-card': isPriority }">
    <v-card-text class="pa-4">
      <div class="d-flex justify-space-between align-start">
        <div class="flex-grow-1">
          <!-- Chips Row -->
          <div class="d-flex flex-wrap ga-2 mb-2">
            <v-chip 
              v-if="announcement.isPinned" 
              color="warning" 
              size="x-small"
              variant="tonal"
            >
              <v-icon start icon="mdi-pin" size="12"></v-icon>
              Pinned
            </v-chip>
            
            <v-chip 
              :color="getPriorityColor(announcement.priority)" 
              size="x-small"
              variant="tonal"
            >
              {{ getPriorityLabel(announcement.priority) }}
            </v-chip>
            
            <v-chip 
              :color="getAudienceColor(announcement.targetAudience)" 
              size="x-small"
              variant="tonal"
            >
              <v-icon start :icon="getAudienceIcon(announcement.targetAudience)" size="12"></v-icon>
              {{ getAudienceLabel(announcement.targetAudience) }}
            </v-chip>
            
            <v-chip 
              v-if="!announcement.isActive" 
              color="grey" 
              size="x-small"
              variant="tonal"
            >
              Inactive
            </v-chip>
          </div>
          
          <!-- Title -->
          <h3 class="text-subtitle-1 font-weight-medium mb-2">
            {{ announcement.title }}
          </h3>
          
          <!-- Content -->
          <div class="text-body-2 text-grey-darken-1 mb-3" v-html="formattedContent"></div>
          
          <!-- Footer -->
          <div class="d-flex justify-space-between align-center text-caption text-grey-darken-1">
            <div class="d-flex align-center ga-2">
              <div class="d-flex align-center">
                <v-icon icon="mdi-account" size="12" class="mr-1"></v-icon>
                <span>{{ announcement.author?.firstName }} {{ announcement.author?.lastName }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon :icon="getRoleIcon(announcement.author?.role)" size="12" class="mr-1"></v-icon>
                <span>{{ getRoleLabel(announcement.author?.role) }}</span>
              </div>
            </div>
            
            <div class="d-flex align-center ga-3">
              <div class="d-flex align-center">
                <v-icon icon="mdi-eye" size="12" class="mr-1"></v-icon>
                <span>{{ announcement.views || 0 }}</span>
              </div>
              <div class="d-flex align-center">
                <v-icon icon="mdi-calendar" size="12" class="mr-1"></v-icon>
                <span>{{ formatDate(announcement.createdAt) }}</span>
              </div>
              <div v-if="announcement.expiresAt" class="d-flex align-center">
                <v-icon icon="mdi-clock-outline" size="12" class="mr-1"></v-icon>
                <span>Expires {{ formatShortDate(announcement.expiresAt) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="d-flex ga-1 ml-3">
          <v-btn
            icon="mdi-pin"
            size="x-small"
            :color="announcement.isPinned ? 'warning' : 'grey'"
            variant="text"
            @click="$emit('toggle-pin', announcement)"
            :title="announcement.isPinned ? 'Unpin' : 'Pin'"
          ></v-btn>
          <v-btn
            icon="mdi-pencil"
            size="x-small"
            color="primary"
            variant="text"
            @click="$emit('edit', announcement)"
            title="Edit"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="x-small"
            color="error"
            variant="text"
            @click="$emit('delete', announcement)"
            title="Delete"
          ></v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  announcement: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete', 'toggle-pin'])

const isPriority = computed(() => {
  return props.announcement.priority === 'urgent' || props.announcement.priority === 'high'
})

const getPriorityColor = (priority) => {
  const colors = {
    low: 'info',
    normal: 'primary',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent'
  }
  return labels[priority] || priority
}

const getAudienceColor = (target) => {
  const colors = {
    all: 'primary',
    students: 'success',
    teachers: 'info',
    admins: 'error'
  }
  return colors[target] || 'grey'
}

const getAudienceIcon = (target) => {
  const icons = {
    all: 'mdi-account-group',
    students: 'mdi-school',
    teachers: 'mdi-teacher',
    admins: 'mdi-shield-account'
  }
  return icons[target] || 'mdi-bullhorn'
}

const getAudienceLabel = (target) => {
  const labels = {
    all: 'Everyone',
    students: 'Students',
    teachers: 'Teachers',
    admins: 'Admins'
  }
  return labels[target] || target
}

const getRoleIcon = (role) => {
  const icons = {
    admin: 'mdi-shield-account',
    teacher: 'mdi-teacher',
    student: 'mdi-school'
  }
  return icons[role] || 'mdi-account'
}

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Admin',
    teacher: 'Teacher',
    student: 'Student'
  }
  return labels[role] || role
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formatShortDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const formattedContent = computed(() => {
  if (!props.announcement.content) return ''
  // Truncate long content for preview
  const content = props.announcement.content.replace(/\n/g, '<br>')
  if (content.length > 200) {
    return content.substring(0, 200) + '...'
  }
  return content
})
</script>

<style scoped>
.announcement-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.announcement-card:hover {
  transform: translateY(-2px);
}

.priority-card {
  border-left: 3px solid rgb(var(--v-theme-warning));
}

.priority-card:has(.v-chip[color="error"]) {
  border-left-color: rgb(var(--v-theme-error));
}

.ga-1 {
  gap: 4px;
}

.ga-2 {
  gap: 8px;
}

.ga-3 {
  gap: 12px;
}
</style>