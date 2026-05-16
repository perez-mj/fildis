<!-- frontend/src/components/student/AnnouncementsList.vue -->
<template>
  <v-row>
    <v-col cols="12">
      <div v-if="announcements.length > 0" class="announcements-list">
        <div
          v-for="announcement in announcements"
          :key="announcement._id"
          class="announcement-card rounded-xl"
          :class="{ pinned: announcement.isPinned }"
        >
          <div class="announcement-content">
            <div class="announcement-icon" :class="getPriorityClass(announcement.priority)">
              <v-icon :icon="getPriorityIcon(announcement.priority)" size="24"></v-icon>
            </div>
            
            <div class="announcement-info">
              <div class="announcement-header">
                <h3 class="announcement-title">
                  {{ announcement.title }}
                  <div class="title-accent" v-if="announcement.isPinned"></div>
                </h3>
                <div class="announcement-badges">
                  <v-chip v-if="announcement.isPinned" size="x-small" color="primary" variant="light" class="rounded-pill">
                    <v-icon start size="10">mdi-pin</v-icon>
                    Pinned
                  </v-chip>
                  <v-chip v-if="announcement.priority === 'urgent'" size="x-small" color="error" variant="light" class="rounded-pill">
                    <v-icon start size="10">mdi-alert</v-icon>
                    Urgent
                  </v-chip>
                </div>
              </div>
              
              <div class="announcement-meta">
                <span class="meta-item">
                  <v-icon size="12">mdi-account-circle-outline</v-icon>
                  {{ announcement.author?.firstName }} {{ announcement.author?.lastName }}
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <v-icon size="12">mdi-calendar-outline</v-icon>
                  {{ formatDate(announcement.createdAt) }}
                </span>
                <span v-if="announcement.courseId" class="meta-item">
                  <v-icon size="12">mdi-book-open-outline</v-icon>
                  {{ announcement.courseId.courseCode }}
                </span>
              </div>
              
              <p class="announcement-text">{{ announcement.content }}</p>
              
              <div v-if="announcement.attachments?.length" class="announcement-attachments">
                <v-btn
                  variant="text"
                  size="small"
                  color="primary"
                  prepend-icon="mdi-paperclip"
                  @click="showAttachments(announcement)"
                  class="attachment-btn"
                >
                  {{ announcement.attachments.length }} attachment(s)
                </v-btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <v-card v-else class="rounded-xl text-center pa-8" variant="tonal">
        <div class="empty-icon mb-4">
          <v-icon size="56" color="grey-lighten-2">mdi-bullhorn-outline</v-icon>
        </div>
        <h3 class="text-h6 font-weight-light mb-2">No announcements</h3>
        <p class="text-body-2 text-medium-emphasis">
          There are no announcements to display at this time.
        </p>
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

const getPriorityClass = (priority) => {
  const classes = {
    low: 'priority-low',
    normal: 'priority-normal',
    high: 'priority-high',
    urgent: 'priority-urgent'
  }
  return classes[priority] || 'priority-normal'
}

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'mdi-information-outline',
    normal: 'mdi-bullhorn-outline',
    high: 'mdi-alert-outline',
    urgent: 'mdi-alert-circle-outline'
  }
  return icons[priority] || 'mdi-bullhorn-outline'
}

const showAttachments = (announcement) => {
  if (announcement.attachments?.length) {
    window.open(announcement.attachments[0].webViewLink, '_blank')
  }
}
</script>

<style scoped>
.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-card {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
  background: white;
}

.announcement-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.announcement-card.pinned {
  border-left: 3px solid #6366f1;
  background: rgba(99, 102, 241, 0.02);
}

.announcement-content {
  display: flex;
  gap: 16px;
  padding: 20px;
}

.announcement-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
}

.announcement-icon.priority-low {
  background: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

.announcement-icon.priority-normal {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.announcement-icon.priority-high {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.announcement-icon.priority-urgent {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.announcement-info {
  flex: 1;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.announcement-title {
  font-size: 1rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.title-accent {
  width: 24px;
  height: 2px;
  background: #6366f1;
  border-radius: 2px;
}

.announcement-badges {
  display: flex;
  gap: 6px;
}

.announcement-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-bottom: 12px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: #64748b;
}

.meta-divider {
  color: #cbd5e1;
}

.announcement-text {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #334155;
  margin: 0 0 12px 0;
}

.announcement-attachments {
  margin-top: 4px;
}

.attachment-btn {
  padding: 0 8px;
  margin-left: -8px;
}

/* Empty State */
.empty-icon {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 600px) {
  .announcement-content {
    padding: 16px;
    gap: 12px;
  }
  
  .announcement-icon {
    width: 40px;
    height: 40px;
  }
  
  .announcement-icon .v-icon {
    font-size: 20px;
  }
  
  .announcement-title {
    font-size: 0.9rem;
  }
  
  .announcement-text {
    font-size: 0.85rem;
  }
  
  .announcement-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>