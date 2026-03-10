<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">系统设置</h1>
      <button
        @click="handleSave"
        :disabled="saving"
        class="btn btn-primary flex items-center gap-2"
      >
        <Save :size="18" />
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 class="text-lg font-semibold mb-4 border-b pb-2">基础设置</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">系统名称</label>
            <input
              class="input w-full"
              v-model="settings.system_name"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL (可选)</label>
            <input
              class="input w-full"
              v-model="settings.logo_url"
              placeholder="http://..."
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700 mb-1">版权信息</label>
            <input
              class="input w-full"
              v-model="settings.copyright_text"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 class="text-lg font-semibold mb-4 border-b pb-2">模型设置 (OpenAI Compatible)</h2>
        <div class="grid gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              class="input w-full"
              v-model="settings.openai_api_key"
              placeholder="sk-..."
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Base URL (可选)</label>
            <input
              class="input w-full"
              v-model="settings.openai_base_url"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">模型名称</label>
            <input
              class="input w-full"
              v-model="settings.openai_model"
              placeholder="gpt-4o-mini"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save } from 'lucide-vue-next'
import type { Settings } from '@/types'

const settings = ref<Settings>({
  system_name: '',
  copyright_text: '',
  openai_model: 'gpt-4o-mini'
})
const loading = ref(false)
const saving = ref(false)

onMounted(() => {
  fetch('/api/settings')
    .then(r => {
      if (r.ok) return r.json()
      throw new Error('Failed to load settings')
    })
    .then(data => {
      settings.value = { ...settings.value, ...data }
    })
    .catch(console.error)
})

const handleSave = async () => {
  saving.value = true
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings.value)
    })
    if (!res.ok) throw new Error('保存失败')
    const data = await res.json()
    settings.value = data
    alert('保存成功，部分设置可能需要刷新页面生效')
    window.location.reload()
  } catch (e) {
    alert((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>
