<template>
  <div class="grid gap-6">
    <div class="card p-6">
      <div class="text-lg font-semibold mb-2">上传并解析文件</div>
      <input
        ref="fileInput"
        class="input"
        type="file"
        multiple
        accept=".txt,.docx,.pdf"
        @change="handleFileChange"
      />
      <div class="mt-4">
        <button class="btn btn-primary" @click="onSubmit" :disabled="loading">{{ loading ? '解析中…' : '开始解析' }}</button>
      </div>
    </div>
    <div v-if="texts.length > 0" class="card p-6 grid gap-4">
      <div v-for="(text, index) in texts" :key="index" class="border rounded-md p-4">
        <div class="font-semibold">文件 {{ index + 1 }}</div>
        <div class="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{{ text.slice(0, 2000) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const files = ref<FileList | null>(null)
const texts = ref<string[]>([])
const loading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  files.value = target.files
}

const onSubmit = async () => {
  if (!files.value || files.value.length < 1) return alert('请至少选择1个文件')
  const form = new FormData()
  Array.from(files.value).forEach(f => form.append('files', f))
  loading.value = true
  try {
    const res = await fetch('/api/files/parse', { method: 'POST', body: form })
    if (!res.ok) throw new Error('解析失败')
    const data = await res.json()
    texts.value = data.texts || []
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>
