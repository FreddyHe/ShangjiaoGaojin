<template>
  <div class="flex items-center justify-center" :class="containerClass">
    <div
      class="animate-spin rounded-full"
      :class="spinnerClass"
      :style="{ width: size + 'px', height: size + 'px' }"
    >
      <svg
        class="animate-spin"
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          :stroke="strokeColor"
          stroke-width="4"
          stroke-opacity="0.2"
        />
        <path
          d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2"
          :stroke="strokeColor"
          stroke-width="4"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <span v-if="text" class="ml-3 text-sm text-text-muted">{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  size?: number
  text?: string
  color?: 'brand' | 'gray' | 'white'
  fullScreen?: boolean
}>(), {
  size: 24,
  color: 'brand'
})

const spinnerClass = computed(() => {
  return props.fullScreen ? '' : ''
})

const containerClass = computed(() => {
  return props.fullScreen 
    ? 'fixed inset-0 bg-background-50/80 z-50' 
    : ''
})

const strokeColor = computed(() => {
  const colors = {
    brand: '#C96442',
    gray: '#8A8886',
    white: '#FFFFFF'
  }
  return colors[props.color]
})
</script>
