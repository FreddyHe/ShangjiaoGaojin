<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-text-primary">系统设置</h1>
      <button
        @click="handleSave"
        :disabled="saving"
        class="btn btn-primary flex items-center gap-2"
      >
        <Save :size="18" />
        {{ saving ? '保存中...' : '保存设置' }}
      </button>
    </div>

    <div class="card p-8 space-y-8">
      <div>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
          <Settings2 :size="24" class="text-brand-600" />
          <h2 class="text-lg font-semibold text-text-primary">基础设置</h2>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">系统名称</label>
            <input
              class="input"
              v-model="settings.system_name"
              placeholder="新闻稿智能体"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Logo URL (可选)</label>
            <div class="relative">
              <input
                class="input pr-10"
                v-model="settings.logo_url"
                placeholder="http://..."
              />
              <button
                @click="toggleApiKeyVisibility('logo')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <Eye :size="18" v-if="!showKeys.logo" />
                <EyeOff :size="18" v-else />
              </button>
            </div>
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-text-secondary mb-2">版权信息</label>
            <input
              class="input"
              v-model="settings.copyright_text"
              placeholder="© 2024 Press Release Assistant"
            />
          </div>
        </div>
      </div>

      <div>
        <div class="flex items-center gap-3 mb-6 pb-3 border-b border-gray-200">
          <Bot :size="24" class="text-brand-600" />
          <h2 class="text-lg font-semibold text-text-primary">模型设置 (OpenAI Compatible)</h2>
        </div>
        <div class="grid gap-6">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">API Key</label>
            <div class="relative">
              <input
                :type="showKeys.api ? 'text' : 'password'"
                class="input pr-10"
                v-model="settings.openai_api_key"
                placeholder="sk-..."
              />
              <button
                @click="toggleApiKeyVisibility('api')"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
              >
                <Eye :size="18" v-if="!showKeys.api" />
                <EyeOff :size="18" v-else />
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">Base URL (可选)</label>
            <input
              class="input"
              v-model="settings.openai_base_url"
              placeholder="https://api.openai.com/v1"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-2">模型名称</label>
            <input
              class="input"
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
import { Save, Settings2, Bot, Eye, EyeOff } from 'lucide-vue-next'
import type { Settings } from '@/types'

const settings = ref<Settings>({
  system_name: '',
  copyright_text: '',
  openai_model: 'gpt-4o-mini'
})
const loading = ref(false)
const saving = ref(false)
const showKeys = ref({
  api: false,
  logo: false
})

const toggleApiKeyVisibility = (key: 'api' | 'logo') => {
  showKeys.value[key] = !showKeys.value[key]
}

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
