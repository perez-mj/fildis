<!-- frontend/src/components/common/NavItem.vue -->
<template>
  <v-list-item
    :to="to"
    :prepend-icon="icon"
    :title="title"
    :value="title"
    :active="active"
    :class="{ 'pl-8': indent }"
    @click="handleClick"
    :ripple="false"
  >
    <template v-slot:append>
      <v-icon v-if="badge" size="small" color="error">
        mdi-circle
      </v-icon>
    </template>
  </v-list-item>
</template>

<script setup>
const props = defineProps({
  to: [String, Object],
  icon: String,
  title: String,
  active: Boolean,
  indent: Boolean,
  badge: Boolean
})

const emit = defineEmits(['click'])

const handleClick = (event) => {
  emit('click', event)
}
</script>

<style scoped>
:deep(.v-list-item) {
  cursor: pointer;
}

:deep(.v-list-item--active) {
  background-color: rgba(var(--v-theme-primary), 0.1) !important;
}
</style>