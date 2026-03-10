<template>
  <div class="grid gap-6">
    <div class="card p-6">
      <div class="text-lg font-semibold mb-2">上传新闻稿文件（任意数量，至少1篇）</div>
      <input
        ref="fileInput"
        class="input"
        type="file"
        multiple
        accept=".txt,.docx,.pdf"
        @change="handleFileChange"
      />
      <div class="mt-3 grid md:grid-cols-2 gap-3">
        <input class="input" v-model="templateId" placeholder="模板ID（默认default，可自定义）" />
        <div class="text-sm text-gray-600 flex items-center">将保存到该类型的此模板下</div>
      </div>
      <div class="mt-4">
        <button class="btn btn-primary" @click="onSubmit" :disabled="loading">{{ loading ? '提取中…' : '开始提取大纲' }}</button>
      </div>
    </div>
    <div v-if="outline" class="card p-6">
      <div class="font-bold text-brand-600">类型：{{ outline.type_name }}</div>
      <div class="mt-4 grid gap-4">
        <SectionView
          v-for="(section, index) in outline.sections"
          :key="index"
          :section="section"
          :depth="0"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Outline, OutlineSection } from '@/types'

const files = ref<FileList | null>(null)
const loading = ref(false)
const outline = ref<Outline | null>(null)
const templateId = ref('default')
const fileInput = ref<HTMLInputElement | null>(null)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  files.value = target.files
}

const onSubmit = async () => {
  if (!files.value || files.value.length < 1) return alert('请至少上传1篇稿件')
  const form = new FormData()
  Array.from(files.value).forEach(f => form.append('files', f))
  form.append('template_id', templateId.value || 'default')
  loading.value = true
  outline.value = null
  try {
    const res = await fetch('/api/extract', { method: 'POST', body: form })
    if (!res.ok) throw new Error('提取失败')
    
    const outlineData: Outline = await res.json()
    outline.value = outlineData
    localStorage.setItem('currentOutline', JSON.stringify(outlineData))
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}
</script>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    SectionView: defineComponent({
      props: {
        section: {
          type: Object as () => OutlineSection,
          required: true
        },
        depth: {
          type: Number,
          default: 0
        }
      },
      template: `
        <div class="border rounded-md p-4" :class="depth > 0 ? 'ml-6' : ''">
          <div class="font-semibold">{{ section.title }}</div>
          <ul v-if="(section.bullets||[]).length" class="list-disc ml-6 mt-2">
            <li v-for="(b, j) in (section.bullets||[])" :key="j">{{ b }}</li>
          </ul>
          <div v-if="(section.children||[]).length" class="mt-3 grid gap-3">
            <SectionView
              v-for="(c, k) in (section.children||[])"
              :key="k"
              :section="c"
              :depth="depth+1"
            />
          </div>
        </div>
      `
    })
  }
})
</script>
