<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div
        v-if="visible"
        class="fixed top-6 right-6 z-50 max-w-md"
      >
        <div
          class="flex items-start gap-3 p-4 rounded-2xl shadow-medium"
          :class="typeClasses"
        >
          <component :is="iconComponent" :size="20" class="flex-shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <div v-if="title" class="font-semibold text-sm mb-1">{{ title }}</div>
            <div class="text-sm leading-relaxed">{{ message }}</div>
          </div>
          <button
            @click="close"
            class="flex-shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X :size="16" />
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-vue-next'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const props = defineProps<{
  type?: ToastType
  title?: string
  message: string
  duration?: number
}>()

const emit = defineEmits<{
  close: []
}>()

const visible = ref(true)

const typeClasses = computed(() => {
  const classes = {
    success: 'bg-green-50 text-green-900 border border-green-200',
    error: 'bg-red-50 text-red-900 border border-red-200',
    warning: 'bg-orange-50 text-orange-900 border border-orange-200',
    info: 'bg-blue-50 text-blue-900 border border-blue-200'
  }
  return classes[props.type || 'info']
})

const iconComponent = computed(() => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info
  }
  return icons[props.type || 'info']
})

const close = () => {
  visible.value = false
  setTimeout(() => {
    emit('close')
  }, 200)
}

watch(() => props.message, () => {
  visible.value = true
  if (props.duration !== 0) {
    setTimeout(() => {
      close()
    }, props.duration || 3000)
  }
}, { immediate: true })
</script>
