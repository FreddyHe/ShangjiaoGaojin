<template>
  <div class="grid gap-6 max-w-4xl mx-auto">
    <div class="card p-8">
      <div class="text-lg font-semibold mb-2 text-text-primary">上传并解析文件</div>
      <div class="text-sm text-text-muted mb-6">支持 .txt, .docx, .pdf 格式，可批量上传多个文件</div>
      
      <div 
        class="upload-zone"
        :class="{ 'border-brand-400 bg-brand-50/30': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="fileInput?.click()"
      >
        <div class="flex flex-col items-center gap-4">
          <UploadCloud :size="56" class="text-text-muted" />
          <div class="text-text-secondary text-center">
            <span class="text-brand-600 font-medium">点击上传</span> 或拖拽文件到此处
          </div>
          <div class="text-sm text-text-muted">支持 .txt, .docx, .pdf 格式，最多可同时上传 10 个文件</div>
        </div>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".txt,.docx,.pdf"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <div v-if="selectedFiles.length > 0" class="mt-6">
        <div class="text-sm font-medium text-text-secondary mb-3">已选择 {{ selectedFiles.length }} 个文件</div>
        <div class="space-y-2">
          <div
            v-for="(file, index) in selectedFiles"
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

      <div class="mt-6">
        <button 
          class="btn btn-primary w-full flex items-center justify-center gap-2"
          @click="onSubmit" 
          :disabled="loading || selectedFiles.length === 0"
        >
          <Loader2 v-if="loading" :size="18" class="animate-spin" />
          <Upload v-else :size="18" />
          {{ loading ? '解析中…' : '开始解析' }}
        </button>
      </div>
    </div>

    <div v-if="texts.length > 0" class="card p-8">
      <div class="flex items-center gap-2 mb-6 pb-3 border-b border-gray-200">
        <FileText :size="24" class="text-brand-600" />
        <div class="text-lg font-semibold text-text-primary">解析结果</div>
      </div>
      <div class="space-y-4">
        <div
          v-for="(text, index) in texts"
          :key="index"
          class="p-5 bg-background-50 rounded-xl border border-gray-200"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="font-semibold text-text-primary flex items-center gap-2">
              <FileText :size="18" class="text-brand-600" />
              文件 {{ index + 1 }}
            </div>
            <button
              @click="copyText(text)"
              class="p-1.5 text-text-muted hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              title="复制内容"
            >
              <Copy :size="16" />
            </button>
          </div>
          <div class="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">{{ text }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { UploadCloud, FileText, X, Loader2, Upload, Copy } from 'lucide-vue-next'

const selectedFiles = ref<File[]>([])
const texts = ref<string[]>([])
const loading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    const totalFiles = [...selectedFiles.value, ...newFiles]
    if (totalFiles.length > 10) {
      alert('最多只能上传 10 个文件')
      return
    }
    selectedFiles.value = totalFiles
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    const newFiles = Array.from(e.dataTransfer.files)
    const validFiles = newFiles.filter(f => 
      f.name.endsWith('.txt') || f.name.endsWith('.docx') || f.name.endsWith('.pdf')
    )
    if (validFiles.length !== newFiles.length) {
      alert('部分文件格式不支持，仅支持 .txt, .docx, .pdf')
    }
    const totalFiles = [...selectedFiles.value, ...validFiles]
    if (totalFiles.length > 10) {
      alert('最多只能上传 10 个文件')
      return
    }
    selectedFiles.value = totalFiles
  }
}

const removeFile = (index: number) => {
  selectedFiles.value = selectedFiles.value.filter((_, i) => i !== index)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const copyText = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
  })
}

const onSubmit = async () => {
  if (selectedFiles.value.length === 0) return alert('请至少选择1个文件')
  const form = new FormData()
  selectedFiles.value.forEach(f => form.append('files', f))
  loading.value = true
  try {
    const res = await fetch('/api/files/parse', { method: 'POST', body: form })
    if (!res.ok) throw new Error('解析失败')
    const data = await res.json()
    texts.value = data.texts || []
    selectedFiles.value = []
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>
