<!-- frontend/src/components/student/AnnouncementsList.vue -->
<template>
  <v-row>
    <v-col cols="12">
      <v-card class="rounded-lg" elevation="2">
        <v-list v-if="announcements.length > 0" lines="three">
          <v-list-item
            v-for="announcement in announcements"
            :key="announcement._id"
            class="announcement-item"
            :class="{ 'pinned': announcement.isPinned }"
          >
            <template v-slot:prepend>
              <v-avatar size="48" :color="getPriorityColor(announcement.priority)" variant="tonal">
                <v-icon size="28">{{ getPriorityIcon(announcement.priority) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title class="font-weight-medium">
              {{ announcement.title }}
              <v-chip
                v-if="announcement.isPinned"
                size="x-small"
                color="primary"
                class="ml-2"
              >
                Pinned
              </v-chip>
              <v-chip
                v-if="announcement.priority === 'urgent'"
                size="x-small"
                color="error"
                class="ml-2"
              >
                Urgent
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <div class="text-caption mb-1">
                Posted by {{ announcement.author?.firstName }} {{ announcement.author?.lastName }}
                • {{ formatDate(announcement.createdAt) }}
                <span v-if="announcement.courseId"> • {{ announcement.courseId.courseCode }}</span>
              </div>
              <div class="text-body-2">
                {{ announcement.content }}
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                v-if="announcement.attachments?.length"
                variant="text"
                size="small"
                @click="showAttachments(announcement)"
              >
                <v-icon>mdi-attachment</v-icon>
                {{ announcement.attachments.length }}
              </v-btn>
            </template>
          </v-list-item>
        </v-list>

        <v-card-text v-else class="text-center pa-8">
          <v-icon size="64" color="grey" class="mb-4">mdi-bullhorn-outline</v-icon>
          <h3 class="text-h6 mb-2">No announcements</h3>
          <p class="text-body-2 text-medium-emphasis">
            There are no announcements to display at this time.
          </p>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { format } from 'date-fns'

const props = defineProps({
  announcements: {
    type: Array,
    required: true
  }
})

const formatDate = (date) => {
  if (!date) return 'N/A'
  return format(new Date(date), 'MMM dd, yyyy h:mm a')
}

const getPriorityColor = (priority) => {
  const colors = {
    low: 'grey',
    normal: 'info',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'primary'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'mdi-information-outline',
    normal: 'mdi-bullhorn',
    high: 'mdi-alert',
    urgent: 'mdi-alert-circle'
  }
  return icons[priority] || 'mdi-bullhorn'
}

const showAttachments = (announcement) => {
  // Handle attachments view
  console.log('Attachments:', announcement.attachments)
}
</script>

<style scoped>
.announcement-item {
  transition: background-color 0.2s;
  cursor: pointer;
}

.announcement-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.announcement-item.pinned {
  background-color: rgba(33, 150, 243, 0.05);
}
</style>