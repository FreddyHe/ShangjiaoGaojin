<template>
  <div class="min-h-screen bg-amber-50/30 flex flex-col">
    <header class="bg-white h-16 flex items-center px-6 sticky top-0 z-10 border-b border-gray-100">
      <div class="flex items-center gap-3">
        <div v-if="settings.logo_url" class="h-9 w-9 object-contain">
          <img :src="settings.logo_url" alt="Logo" class="h-9 w-9 object-contain" />
        </div>
        <div v-else class="h-9 w-9 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
          {{ (settings.system_name || 'A')[0] }}
        </div>
        <span class="font-bold text-xl text-gray-900 tracking-tight">{{ settings.system_name || '新闻稿智能体' }}</span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <aside class="w-64 bg-amber-50/30 flex flex-col overflow-y-auto">
        <nav class="p-4 space-y-1">
          <router-link
            v-for="nav in navs"
            :key="nav.path"
            :to="nav.path"
            class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group"
            :class="isActive(nav.path) ? 'bg-orange-100/60 text-orange-700 font-medium border-l-4 border-orange-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'"
          >
            <component :is="nav.icon" :size="20" :class="isActive(nav.path) ? 'text-orange-600' : 'text-gray-400 group-hover:text-gray-600'" />
            <span>{{ nav.label }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 overflow-y-auto p-8 relative">
        <div class="max-w-6xl mx-auto min-h-[calc(100vh-12rem)]">
          <slot />
        </div>
        
        <footer class="mt-12 py-6 text-center text-sm text-gray-400">
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
