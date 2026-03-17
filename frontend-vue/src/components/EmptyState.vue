<template>
  <div class="flex flex-col items-center justify-center p-12 text-center">
    <div 
      class="mb-6 rounded-full p-6"
      :class="iconContainerClass"
    >
      <component :is="iconComponent" :size="48" :class="iconClass" />
    </div>
    <h3 v-if="title" class="text-lg font-semibold text-text-primary mb-2">{{ title }}</h3>
    <p v-if="description" class="text-sm text-text-muted mb-6 max-w-md">{{ description }}</p>
    <slot name="actions">
      <button
        v-if="actionText"
        @click="$emit('action')"
        class="btn btn-primary"
      >
        {{ actionText }}
      </button>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Inbox, 
  Search, 
  AlertCircle, 
  CheckCircle,
  Database,
  FolderOpen,
  FileSearch
} from 'lucide-vue-next'

type EmptyStateType = 'no-data' | 'no-results' | 'error' | 'success' | 'loading' | 'no-files' | 'no-records'

const props = withDefaults(defineProps<{
  type?: EmptyStateType
  title?: string
  description?: string
  actionText?: string
}>(), {
  type: 'no-data'
})

defineEmits<{
  action: []
}>()

const iconComponent = computed(() => {
  const icons = {
    'no-data': Database,
    'no-results': Search,
    'error': AlertCircle,
    'success': CheckCircle,
    'loading': Inbox,
    'no-files': FolderOpen,
    'no-records': FileSearch
  }
  return icons[props.type]
})

const iconContainerClass = computed(() => {
  const classes = {
    'no-data': 'bg-gray-100',
    'no-results': 'bg-gray-100',
    'error': 'bg-red-100',
    'success': 'bg-green-100',
    'loading': 'bg-brand-100',
    'no-files': 'bg-blue-100',
    'no-records': 'bg-purple-100'
  }
  return classes[props.type]
})

const iconClass = computed(() => {
  const classes = {
    'no-data': 'text-gray-400',
    'no-results': 'text-gray-400',
    'error': 'text-red-500',
    'success': 'text-green-500',
    'loading': 'text-brand-500',
    'no-files': 'text-blue-500',
    'no-records': 'text-purple-500'
  }
  return classes[props.type]
})
</script>
