<template>
  <div 
    class="upload-zone"
    :class="{ 
      'border-brand-400 bg-brand-50/30': isDragging,
      'border-gray-300': !isDragging
    }"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="fileInput?.click()"
  >
    <div class="flex flex-col items-center gap-4">
      <UploadCloud :size="48" class="text-text-muted" />
      <div class="text-text-secondary text-center">
        <span class="text-brand-600 font-medium">点击上传</span> 或拖拽文件到此处
      </div>
      <div class="text-sm text-text-muted">{{ description }}</div>
      <div v-if="accept" class="text-xs text-text-muted">
        支持格式: {{ accept }}
      </div>
    </div>
    <input
      ref="fileInput"
      type="file"
      :multiple="multiple"
      :accept="accept"
      class="hidden"
      @change="handleFileChange"
    />
  </div>

  <div v-if="files.length > 0" class="mt-6">
    <div class="text-sm font-medium text-text-secondary mb-3">
      已选择 {{ files.length }} 个文件
    </div>
    <div class="space-y-2">
      <div
        v-for="(file, index) in files"
        :key="index"
        class="flex items-center justify-between p-3 bg-background-50 rounded-xl border border-gray-200"
      >
        <div class="flex items-center gap-3">
          <FileText :size="20" class="text-text-tertiary" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-text-primary truncate">{{ file.name }}</div>
            <div class="text-xs text-text-muted">{{ formatFileSize(file.size) }}</div>
          </div>
        </div>
        <button
          @click="removeFile(index)"
          class="p-1.5 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <X :size="18" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadCloud, FileText, X } from 'lucide-vue-next'

const props = defineProps<{
  description?: string
  accept?: string
  multiple?: boolean
  maxSize?: number
}>()

const emit = defineEmits<{
  'update:files': [files: File[]]
}>()

const files = ref<File[]>([])
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    addFiles(newFiles)
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    const newFiles = Array.from(e.dataTransfer.files)
    addFiles(newFiles)
  }
}

const addFiles = (newFiles: File[]) => {
  const validFiles = newFiles.filter(f => {
    if (props.maxSize && f.size > props.maxSize) {
      alert(`文件 ${f.name} 超过大小限制`)
      return false
    }
    return true
  })
  
  files.value = [...files.value, ...validFiles]
  emit('update:files', files.value)
}

const removeFile = (index: number) => {
  files.value = files.value.filter((_, i) => i !== index)
  emit('update:files', files.value)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

defineExpose({
  clear: () => {
    files.value = []
    emit('update:files', files.value)
  }
})
</script>
