<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white border-b h-16 flex items-center px-6 sticky top-0 z-10 shadow-sm">
      <div class="flex items-center gap-3">
        <div v-if="settings.logo_url" class="h-8 w-8 object-contain">
          <img :src="settings.logo_url" alt="Logo" class="h-8 w-8 object-contain" />
        </div>
        <div v-else class="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
          {{ (settings.system_name || 'A')[0] }}
        </div>
        <span class="font-bold text-xl text-gray-900 tracking-tight">{{ settings.system_name || '新闻稿智能体' }}</span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 bg-white border-r flex flex-col overflow-y-auto">
        <nav class="p-4 space-y-1">
          <router-link
            v-for="nav in navs"
            :key="nav.path"
            :to="nav.path"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
            :class="isActive(nav.path) ? 'bg-brand-50 text-brand-700 font-medium shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
          >
            <component :is="nav.icon" :size="18" :class="isActive(nav.path) ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'" />
            <span>{{ nav.label }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 overflow-y-auto p-8 relative">
        <div class="max-w-6xl mx-auto min-h-[calc(100vh-12rem)]">
          <router-view />
        </div>
        
        <footer class="mt-12 py-6 border-t text-center text-sm text-gray-400">
          {{ settings.copyright_text }}
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, FileText, PenTool, History, Settings } from 'lucide-vue-next'

interface SettingsType {
  system_name: string
  logo_url?: string
  copyright_text: string
}

const route = useRoute()
const settings = ref<SettingsType>({
  system_name: '新闻稿智能体',
  copyright_text: '© 2024 Press Release Assistant'
})

const navs = [
  { path: '/templates', label: '模板管理', icon: LayoutDashboard },
  { path: '/extract', label: '大纲提取', icon: FileText },
  { path: '/generate', label: '稿件生成', icon: PenTool },
  { path: '/history', label: '历史记录', icon: History },
  { path: '/settings', label: '系统设置', icon: Settings },
]

const isActive = (path: string) => {
  return route.path === path
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
</script>
