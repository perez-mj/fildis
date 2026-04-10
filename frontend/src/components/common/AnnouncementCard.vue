<!-- frontend/src/components/common/AnnouncementCard.vue -->
 <template>
  <v-card elevation="2" class="announcement-card" :class="{ 'priority-border': getPriorityBorder }">
    <v-card-title class="pa-4" :class="getHeaderClass">
      <div class="d-flex justify-space-between align-start">
        <div class="flex-grow-1">
          <div class="d-flex align-center flex-wrap gap-2 mb-2">
            <v-chip 
              v-if="announcement.isPinned" 
              color="warning" 
              size="small"
              class="mr-2"
            >
              <v-icon left size="14">mdi-pin</v-icon>
              Pinned
            </v-chip>
            
            <v-chip 
              :color="getPriorityColor(announcement.priority)" 
              size="small"
            >
              {{ getPriorityLabel(announcement.priority) }}
            </v-chip>
            
            <v-chip 
              :color="getAudienceColor(announcement.targetAudience)" 
              size="small"
              variant="outline"
            >
              <v-icon left size="14">{{ getAudienceIcon(announcement.targetAudience) }}</v-icon>
              {{ getAudienceLabel(announcement.targetAudience) }}
            </v-chip>
            
            <v-chip 
              v-if="!announcement.isActive" 
              color="error" 
              size="small"
            >
              Inactive
            </v-chip>
          </div>
          
          <div class="text-h6 font-weight-bold">
            {{ announcement.title }}
          </div>
        </div>
        
        <div>
          <v-btn
            icon
            size="small"
            color="warning"
            variant="text"
            @click="$emit('toggle-pin', announcement)"
            :title="announcement.isPinned ? 'Unpin' : 'Pin'"
          >
            <v-icon>{{ announcement.isPinned ? 'mdi-pin' : 'mdi-pin-off' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            color="primary"
            variant="text"
            @click="$emit('edit', announcement)"
            title="Edit"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            size="small"
            color="error"
            variant="text"
            @click="$emit('delete', announcement)"
            title="Delete"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </div>
      </div>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text class="pa-4">
      <div class="text-body-1 mb-3" v-html="formattedContent"></div>
      
      <div class="d-flex justify-space-between align-center text-caption text-grey mt-2">
        <div class="d-flex align-center">
          <v-icon size="small" class="mr-1">mdi-account</v-icon>
          {{ announcement.author?.firstName }} {{ announcement.author?.lastName }}
          <span class="mx-1">•</span>
          <v-icon size="small" class="mr-1">mdi-account-badge</v-icon>
          {{ getRoleLabel(announcement.author?.role) }}
        </div>
        
        <div class="d-flex align-center gap-3">
          <div class="d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-eye</v-icon>
            {{ announcement.views || 0 }} views
          </div>
          <div class="d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-calendar</v-icon>
            {{ formatDate(announcement.createdAt) }}
          </div>
          <div v-if="announcement.expiresAt" class="d-flex align-center">
            <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
            Expires: {{ formatDate(announcement.expiresAt) }}
          </div>
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

const getPriorityColor = (priority) => {
  const colors = {
    low: 'info',
    normal: 'success',
    high: 'warning',
    urgent: 'error'
  }
  return colors[priority] || 'grey'
}

const getPriorityLabel = (priority) => {
  const labels = {
    low: 'Low Priority',
    normal: 'Normal',
    high: 'High Priority',
    urgent: 'URGENT'
  }
  return labels[priority] || priority
}

const getPriorityBorder = computed(() => {
  return props.announcement.priority === 'urgent' || props.announcement.priority === 'high'
})

const getHeaderClass = computed(() => {
  if (props.announcement.priority === 'urgent') return 'bg-error-lighten-5'
  if (props.announcement.priority === 'high') return 'bg-warning-lighten-5'
  if (props.announcement.isPinned) return 'bg-warning-lighten-4'
  return 'bg-grey-lighten-4'
})

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
    students: 'Students Only',
    teachers: 'Teachers Only',
    admins: 'Admins Only'
  }
  return labels[target] || target
}

const getRoleLabel = (role) => {
  const labels = {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student'
  }
  return labels[role] || role
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString()
}

const formattedContent = computed(() => {
  return props.announcement.content.replace(/\n/g, '<br>')
})
</script>

<style scoped>
.announcement-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.announcement-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.priority-border {
  border-left: 4px solid;
}

.priority-border:has(.bg-error-lighten-5) {
  border-left-color: #ff5252;
}

.priority-border:has(.bg-warning-lighten-5) {
  border-left-color: #ffb74d;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>