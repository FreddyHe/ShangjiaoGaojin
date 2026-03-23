<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <div class="flex items-center justify-between pb-6 border-b border-background-200">
      <div>
        <h1 class="text-3xl font-bold text-text-primary tracking-tight">信息库</h1>
        <div class="text-sm text-text-muted mt-2">维护校准阶段所需的资料库数据</div>
      </div>
      <div class="flex gap-3">
        <button
          @click="showHistory = true; fetchHistory()"
          class="btn bg-white border border-background-200 text-text-secondary hover:bg-background-50 px-4 py-2.5 shadow-sm flex items-center gap-2"
        >
          <History :size="16" />
          <span>历史回退</span>
        </button>
        <button
          @click="fetchData"
          class="btn bg-white border border-background-200 text-text-secondary hover:bg-background-50 px-4 py-2.5 shadow-sm flex items-center gap-2"
        >
          <RefreshCw :size="16" :class="{ 'animate-spin': loading }" />
          <span>刷新</span>
        </button>
        <button
          v-if="activeCategory === 'people' && false"
          @click="syncFaculty"
          :disabled="syncing"
          class="btn bg-brand-50 border border-brand-200 text-brand-700 hover:bg-brand-100 px-4 py-2.5 shadow-sm flex items-center gap-2"
        >
          <Database :size="16" :class="{ 'animate-pulse': syncing }" />
          <span>{{ syncing ? syncProgressText : '一键同步高金官网教授' }}</span>
        </button>
        <button
          @click="saveData"
          :disabled="saving"
          class="btn btn-primary px-6 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 shadow-sm hover:shadow-glow flex items-center gap-2"
        >
          <Save :size="16" />
          <span>{{ saving ? '保存中...' : '保存更改' }}</span>
        </button>
      </div>
    </div>

    <!-- History Modal -->
    <div v-if="showHistory" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 class="text-xl font-bold text-gray-800">历史版本回退 ({{ currentCategoryObj?.name }})</h3>
          <button @click="showHistory = false" class="text-gray-400 hover:text-gray-600">
            <X :size="20" />
          </button>
        </div>
        <div class="p-6 flex-1 overflow-y-auto">
          <div v-if="historyLoading" class="text-center py-8 text-gray-500">加载中...</div>
          <div v-else-if="historyList.length === 0" class="text-center py-8 text-gray-500">暂无历史版本</div>
          <div v-else class="space-y-3">
            <div v-for="item in historyList" :key="item.timestamp" class="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
              <div>
                <div class="font-medium text-gray-800">{{ item.time_str }}</div>
                <div class="text-sm text-gray-500">备份版本: {{ item.timestamp }}</div>
              </div>
              <button 
                @click="rollbackHistory(item.timestamp)"
                class="btn py-1.5 px-4 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded-lg text-sm font-medium"
              >
                回退至此版本
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row gap-8">
      <!-- Sidebar Categories -->
      <div class="w-full lg:w-64 flex-shrink-0">
        <div class="card bg-surface-50 border border-background-200 shadow-sm overflow-hidden sticky top-8">
          <div class="p-3">
            <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-3">资料类别</div>
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="activeCategory = cat.id"
              class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mb-1"
              :class="activeCategory === cat.id ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-text-secondary hover:bg-background-50 hover:text-text-primary'"
            >
              <component :is="cat.icon" :size="18" :class="activeCategory === cat.id ? 'text-brand-500' : 'text-text-tertiary'" />
              <span>{{ cat.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 min-w-0">
        <div class="card p-6 border border-background-200 shadow-sm min-h-[500px] flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-text-primary flex items-center gap-2">
              {{ currentCategoryObj?.name }}
              <span class="badge bg-background-100 text-text-secondary font-normal text-xs ml-2">
                {{ currentItems.length }} 项
              </span>
            </h2>
            <button
              @click="addNewItem"
              class="btn bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-100 px-4 py-2 flex items-center gap-2 text-sm transition-colors"
            >
              <Plus :size="16" />
              <span>添加条目</span>
            </button>
          </div>

          <div v-if="loading" class="flex-1 flex items-center justify-center">
            <div class="flex flex-col items-center gap-3 text-text-tertiary">
              <Loader2 :size="32" class="animate-spin text-brand-400" />
              <span class="text-sm font-medium">加载数据中...</span>
            </div>
          </div>

          <div v-else-if="currentItems.length === 0" class="flex-1 flex flex-col items-center justify-center text-text-tertiary border-2 border-dashed border-background-200 rounded-2xl p-12 bg-background-50/50">
            <Database :size="48" class="text-text-muted mb-4 opacity-50" />
            <p class="text-base font-medium text-text-secondary mb-1">暂无数据</p>
            <p class="text-sm mb-6 text-center max-w-sm">该类别下还没有任何条目，您可以点击右上角的按钮添加新的数据。</p>
            <button @click="addNewItem" class="btn btn-primary px-5 py-2 shadow-sm text-sm">
              立即添加
            </button>
          </div>

          <div v-else-if="activeCategory === 'people'" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div
              v-for="(item, index) in currentItems"
              :key="index"
              class="group relative bg-white border border-background-200 rounded-3xl p-6 shadow-sm hover:shadow-medium hover:-translate-y-1 hover:border-brand-300 transition-all duration-300 flex flex-col"
            >
              <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <a
                  v-if="item.meta?.url"
                  :href="item.meta.url"
                  target="_blank"
                  class="p-2 text-text-tertiary hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-colors"
                  title="访问官网主页"
                >
                  <ExternalLink :size="16" />
                </a>
                <button
                  @click="removeItem(index)"
                  class="p-2 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                  title="删除此教授资料"
                >
                  <Trash2 :size="16" />
                </button>
              </div>
              
              <div class="flex items-start gap-4 mb-5">
                <div class="h-14 w-14 rounded-full bg-gradient-to-br from-brand-100 to-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 font-bold text-xl flex-shrink-0 shadow-inner overflow-hidden">
                  <img v-if="item.meta?.avatar" :src="item.meta.avatar" class="w-full h-full object-cover" />
                  <span v-else>{{ item.key ? item.key.charAt(0) : '新' }}</span>
                </div>
                <div class="flex-1 min-w-0 pt-1">
                  <input
                    type="text"
                    v-model="item.key"
                    class="bg-transparent w-full font-bold text-lg text-text-primary border-b border-transparent focus:border-brand-300 focus:outline-none transition-colors px-1 placeholder:text-text-muted"
                    placeholder="教授姓名"
                  />
                  <div class="text-xs text-brand-600 font-medium px-1 mt-1 flex items-center gap-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                    Faculty Member
                  </div>
                </div>
              </div>
              
              <div class="flex-1">
                <label class="sr-only">详细描述</label>
                <textarea
                  v-model="item.value"
                  class="w-full h-full min-h-[120px] bg-background-50/50 hover:bg-background-50 focus:bg-white border border-transparent focus:border-brand-200 rounded-2xl p-4 text-sm text-text-secondary leading-relaxed resize-none focus:outline-none transition-colors"
                  placeholder="请输入教授的详细背景、研究领域、头衔等信息..."
                ></textarea>
              </div>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in currentItems"
              :key="index"
              class="group relative bg-white border border-background-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-300"
            >
              <button
                @click="removeItem(index)"
                class="absolute top-4 right-4 p-1.5 text-text-tertiary hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                title="删除此条目"
              >
                <Trash2 :size="16" />
              </button>
              
              <div class="grid gap-4 pr-8">
                <div>
                  <label class="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5 pl-1">名称 / 标识</label>
                  <input
                    type="text"
                    v-model="item.key"
                    class="input bg-background-50 focus:bg-white w-full border-transparent focus:border-brand-300 font-medium text-text-primary"
                    placeholder="例如: 程仕军 / 某某项目"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-1.5 pl-1">详细描述</label>
                  <textarea
                    v-model="item.value"
                    rows="3"
                    class="input bg-background-50 focus:bg-white w-full border-transparent focus:border-brand-300 text-sm resize-y min-h-[80px]"
                    placeholder="请输入详细信息、背景或介绍内容..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  Users, Bookmark, BookOpen, Lightbulb, Users2, 
  Save, Plus, Trash2, Database, RefreshCw, Loader2,
  History, X, ExternalLink
} from 'lucide-vue-next'

interface Category {
  id: string
  name: string
  icon: any
}

interface KnowledgeItem {
  key: string
  value: string
  meta?: {
    avatar?: string
    url?: string
  }
}

interface HistoryItem {
  timestamp: number
  time_str: string
  file: string
}

const categories: Category[] = [
  { id: 'people', name: '教授资料', icon: Users },
  { id: 'brands', name: '学院品牌', icon: Bookmark },
  { id: 'courses', name: '课程项目', icon: BookOpen },
  { id: 'research', name: '研究/智库成果', icon: Lightbulb },
  { id: 'alumni', name: '合作/校友信息', icon: Users2 },
]

const activeCategory = ref(categories[0].id)
const loading = ref(false)
const saving = ref(false)
const syncing = ref(false)
const syncProgressText = ref('正在同步官网数据...')

const showHistory = ref(false)
const historyLoading = ref(false)
const historyList = ref<HistoryItem[]>([])

// Data structure: Record<category_id, KnowledgeItem[]>
const allData = ref<Record<string, KnowledgeItem[]>>({})

const currentCategoryObj = computed(() => categories.find(c => c.id === activeCategory.value))
const currentItems = computed(() => allData.value[activeCategory.value] || [])

const fetchData = async () => {
  loading.value = true
  try {
    let metaData: Record<string, any> = {}
    try {
      const metaRes = await fetch('/api/people/meta')
      if (metaRes.ok) {
        metaData = await metaRes.json()
      }
    } catch (e) {
      console.error('Failed to fetch people meta', e)
    }

    for (const cat of categories) {
      const res = await fetch(`/api/knowledge/${cat.id}`)
      if (res.ok) {
        const data = await res.json()
        // Convert object to array of key-value pairs
        const items = Object.entries(data).map(([key, value]) => ({
          key,
          value: value as string,
          meta: cat.id === 'people' ? metaData[key] : undefined
        }))
        allData.value[cat.id] = items
      } else {
        // Initialize empty array if not found
        allData.value[cat.id] = []
      }
    }
  } catch (error) {
    console.error('Failed to fetch knowledge data:', error)
    alert('加载数据失败，请重试')
  } finally {
    loading.value = false
  }
}

const fetchHistory = async () => {
  historyLoading.value = true
  try {
    const res = await fetch(`/api/knowledge/${activeCategory.value}/history`)
    if (res.ok) {
      historyList.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load history', e)
  } finally {
    historyLoading.value = false
  }
}

const rollbackHistory = async (timestamp: number) => {
  if (!confirm('确定要回退到此版本吗？当前的数据会被覆盖（但也会在回退前自动备份）。')) {
    return
  }
  try {
    const res = await fetch(`/api/knowledge/${activeCategory.value}/rollback/${timestamp}`, {
      method: 'POST'
    })
    if (!res.ok) throw new Error('回退失败')
    alert('回退成功')
    showHistory.value = false
    await fetchData()
  } catch (e: any) {
    alert(e.message)
  }
}

const syncFaculty = async () => {
  if (!confirm('确定要从高金官网重新拉取并同步所有全职、访问、兼职、兼聘教授的资料吗？\n注意：这可能需要几秒钟时间，且会覆盖现有相同名字教授的资料，但不会删除您手动添加的其他人员。')) {
    return
  }
  
  syncing.value = true
  syncProgressText.value = '开始连接...'
  try {
    const res = await fetch('/api/knowledge/sync/faculty', {
      method: 'POST'
    })
    
    if (!res.ok) {
      const errText = await res.text()
      throw new Error(errText || '同步失败')
    }
    
    const reader = res.body?.getReader()
    if (!reader) throw new Error('流式读取失败')
    
    const decoder = new TextDecoder()
    let buffer = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const data = JSON.parse(line)
          if (data.status === 'progress') {
            syncProgressText.value = data.message
          } else if (data.status === 'success') {
            syncProgressText.value = '同步完成'
            alert(data.message)
          } else if (data.status === 'error') {
            throw new Error(data.message)
          }
        } catch (e) {
          console.error('Error parsing line:', line, e)
        }
      }
    }
    
    // 重新拉取数据以更新UI
    await fetchData()
  } catch (error: any) {
    console.error('Failed to sync faculty:', error)
    alert(`同步失败: ${error.message}`)
  } finally {
    syncing.value = false
    syncProgressText.value = '一键同步高金官网教授'
  }
}

const saveData = async () => {
  saving.value = true
  try {
    // Save current active category
    const items = allData.value[activeCategory.value]
    
    // Validate empty keys
    if (items.some(item => !item.key.trim())) {
      alert('所有条目的名称/标识不能为空')
      saving.value = false
      return
    }

    // Convert array back to object
    const dataObj: Record<string, string> = {}
    items.forEach(item => {
      dataObj[item.key.trim()] = item.value.trim()
    })

    const res = await fetch(`/api/knowledge/${activeCategory.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataObj)
    })

    if (!res.ok) throw new Error('保存失败')
    
    // Create a toast/notification logic here if needed
    // alert('保存成功')
  } catch (error) {
    console.error('Failed to save knowledge data:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

const addNewItem = () => {
  if (!allData.value[activeCategory.value]) {
    allData.value[activeCategory.value] = []
  }
  allData.value[activeCategory.value].unshift({ key: '', value: '' })
}

const removeItem = (index: number) => {
  if (confirm('确定要删除此条目吗？此操作在保存后生效。')) {
    allData.value[activeCategory.value].splice(index, 1)
  }
}

// Initial fetch
onMounted(() => {
  fetchData()
})

// Optional: Fetch data when category changes if we want lazy loading,
// but we fetch all on mount, so it's not strictly necessary.
// We can just keep it all in memory.
</script>

<style scoped>
/* Add any specific styles here if needed, most is handled by tailwind */
</style>