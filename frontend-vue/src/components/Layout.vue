<template>
  <div class="h-screen bg-background-50 flex font-sans overflow-hidden relative">
    <!-- Background Image overlay -->
    <div class="absolute inset-0 pointer-events-none z-0 opacity-[0.5] mix-blend-multiply bg-center bg-no-repeat bg-cover" style="background-image: url('/background.png');"></div>
    <!-- Left Dark Sidebar -->
    <aside class="w-64 bg-slate-900 flex flex-col shadow-xl z-20 flex-shrink-0 text-slate-300 relative">
      <!-- Logo Area -->
      <div class="h-20 flex items-center justify-center px-6 border-b border-slate-800 gap-3 w-full">
        <div class="relative flex-shrink-0">
          <div class="absolute inset-0 bg-brand-500 blur-md opacity-30 rounded-xl"></div>
          <img :src="settings.logo_url || '/logo.png'" alt="Logo" class="relative h-10 w-10 object-cover rounded-[10px] shadow-lg border border-slate-700 bg-white" />
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-[17px] font-bold text-slate-100 tracking-wide truncate">
            {{ settings.system_name || '新闻稿智能体' }}
          </h1>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1.5 flex-1 overflow-y-auto mt-2">
        <router-link
          v-for="nav in navs"
          :key="nav.path"
          :to="nav.path"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative"
          :class="isActive(nav.path) ? 'bg-brand-600 text-white font-medium shadow-md shadow-brand-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'"
        >
          <div v-if="isActive(nav.path)" class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
          <component :is="nav.icon" :size="20" :class="isActive(nav.path) ? 'text-white' : 'text-slate-500 group-hover:text-slate-400 transition-colors'" />
          <span>{{ nav.label }}</span>
        </router-link>
      </nav>

      <!-- Bottom Info Box -->
      <div class="p-5 mt-auto border-t border-slate-800">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <span class="text-slate-300 font-bold text-sm">PR</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-medium text-slate-200">新闻稿智能体</span>
            <span class="text-xs text-slate-500">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
      <header class="bg-surface-50/80 backdrop-blur-md h-16 flex items-center px-8 border-b border-background-200 justify-between gap-6 shadow-sm flex-shrink-0 z-10">
        <div class="flex items-center gap-4">
          <div class="h-8 w-1 bg-brand-500 rounded-full mr-1"></div>
          <span class="font-bold text-xl text-text-primary tracking-tight">{{ currentTitle }}</span>
        </div>
        <div class="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-8 relative bg-transparent">
        <div class="max-w-6xl mx-auto min-h-[calc(100vh-12rem)]">
          <slot />
        </div>
        
        <footer class="mt-12 py-6 text-center text-sm text-text-tertiary">
          {{ settings.copyright_text }}
        </footer>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutDashboard, FileText, PenTool, History, Settings, Sparkles, Database } from 'lucide-vue-next'
import UserMenu from './UserMenu.vue'

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
  { path: '/knowledge', label: '信息库', icon: Database },
  { path: '/history', label: '历史记录', icon: History },
  { path: '/settings', label: '系统设置', icon: Settings },
]

const isActive = (path: string) => {
  return route.path === path
}

const currentTitle = computed(() => {
  if (route.path === '/profile') return '个人中心'
  const nav = navs.find(n => n.path === route.path)
  return nav ? nav.label : (settings.value.system_name || '新闻稿智能体')
})

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
