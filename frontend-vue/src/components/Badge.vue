<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
    :class="badgeClasses"
  >
    <span v-if="showDot" class="w-1.5 h-1.5 rounded-full" :class="dotClasses"></span>
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'sm' | 'md' | 'lg'

const props = withDefaults(defineProps<{
  text?: string
  variant?: BadgeVariant
  size?: BadgeSize
  showDot?: boolean
}>(), {
  variant: 'default',
  size: 'md',
  showDot: false
})

const badgeClasses = computed(() => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-orange-100 text-orange-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  }
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  }
  
  return `${variantClasses[props.variant]} ${sizeClasses[props.size]}`
})

const dotClasses = computed(() => {
  const colors = {
    default: 'bg-gray-500',
    success: 'bg-green-500',
    warning: 'bg-orange-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }
  return colors[props.variant]
})
</script>
