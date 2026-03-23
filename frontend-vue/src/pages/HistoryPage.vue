<template>
  <div class="h-[calc(100vh-8rem)] grid grid-cols-[340px_1fr] gap-8">
    <div class="flex flex-col bg-surface-50 rounded-2xl shadow-soft h-full overflow-hidden border border-background-200">
      <div class="p-6 border-b border-background-200 font-bold text-xl flex justify-between items-center bg-background-50/50">
        <span class="text-text-primary tracking-tight">历史记录</span>
        <button class="text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors" @click="loadArticles">刷新</button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <div v-if="loading" class="flex flex-col items-center justify-center h-32 gap-3 text-text-muted">
          <div class="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <span>加载中...</span>
        </div>
        <div v-if="!loading && articles.length === 0" class="flex flex-col items-center justify-center h-32 gap-2 text-text-muted">
          <div class="text-2xl">📭</div>
          <span>暂无记录</span>
        </div>
        <div
          v-for="a in articles"
          :key="a.id"
          @click="selectedId = a.id"
          class="p-4 rounded-xl cursor-pointer border transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group"
          :class="selectedId === a.id ? 'bg-brand-50/50 border-brand-300 shadow-sm' : 'bg-surface-50 border-background-200 hover:border-brand-200'"
        >
          <div v-if="selectedId === a.id" class="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
          <div class="font-medium text-text-primary truncate mb-3" :class="{'pl-1': selectedId === a.id}">{{ a.title || '未命名' }}</div>
          <div class="flex justify-between items-center" :class="{'pl-1': selectedId === a.id}">
            <div class="flex items-center gap-2 bg-background-50 px-2 py-1 rounded-md">
              <div class="w-2 h-2 rounded-full" :class="getTypeColor(a.type_name)"></div>
              <span class="text-xs text-text-secondary font-medium">{{ a.type_name }}</span>
            </div>
            <span class="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">{{ formatRelativeTime(a.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-surface-50 rounded-2xl shadow-soft h-full overflow-hidden flex flex-col border border-background-200">
      <div v-if="selectedArticle" class="flex flex-col h-full">
        <div class="p-6 border-b border-background-200 flex flex-wrap lg:flex-nowrap justify-between items-start lg:items-center gap-4 bg-background-50/50 flex-shrink-0">
          <div class="min-w-0 flex-1">
            <div class="font-bold text-2xl text-text-primary tracking-tight mb-2 truncate" :title="selectedArticle.title">{{ selectedArticle.title }}</div>
            <div class="text-sm text-text-secondary flex flex-wrap items-center gap-x-4 gap-y-2">
              <span class="flex items-center gap-1.5 whitespace-nowrap"><span class="text-text-tertiary">生成时间:</span> {{ formatDate(selectedArticle.created_at) }}</span>
              <span class="flex items-center gap-1.5 whitespace-nowrap"><span class="text-text-tertiary">类型:</span> {{ selectedArticle.type_name }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-2 lg:gap-3 flex-shrink-0">
            <button 
              @click="previewArticle(selectedArticle.title, selectedArticle.content)"
              class="btn py-2 px-3 lg:px-4 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
              title="网页预览"
            >
              <ExternalLink :size="16" class="flex-shrink-0" />
              <span class="font-medium text-sm lg:text-base">网页预览</span>
            </button>
            <a
              :href="`/api/articles/${selectedArticle.id}/download/docx`"
              target="_blank"
              class="btn py-2 px-3 lg:px-4 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 border-indigo-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
              title="下载 Word 文档"
            >
              <FileText :size="16" class="flex-shrink-0" />
              <span class="font-medium text-sm lg:text-base">Word</span>
            </a>
            <button
              v-if="!editing"
              @click="handleEdit"
              class="btn py-2 px-3 lg:px-4 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 border-blue-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
              title="编辑内容"
            >
              <Edit3 :size="16" class="flex-shrink-0" />
              <span class="font-medium text-sm lg:text-base">修改</span>
            </button>
            <template v-if="editing">
              <button
                @click="handleSave"
                class="btn py-2 px-3 lg:px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 border-emerald-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
                title="保存修改"
              >
                <Save :size="16" class="flex-shrink-0" />
                <span class="font-medium text-sm lg:text-base">保存</span>
              </button>
              <button
                @click="editing = false"
                class="btn py-2 px-3 lg:px-4 bg-surface-50 text-text-secondary hover:bg-background-50 hover:border-background-300 border-background-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
                title="取消编辑"
              >
                <X :size="16" class="flex-shrink-0" />
                <span class="font-medium text-sm lg:text-base">取消</span>
              </button>
            </template>
            <button
              @click="handleDelete(selectedArticle.id)"
              class="btn py-2 px-3 lg:px-4 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 border-rose-200 flex items-center gap-1.5 lg:gap-2 whitespace-nowrap"
              title="删除记录"
            >
              <Trash2 :size="16" class="flex-shrink-0" />
              <span class="font-medium text-sm lg:text-base">删除</span>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-8 bg-surface-50">
          <textarea
            v-if="editing"
            class="w-full h-full min-h-[60vh] p-6 border-2 border-brand-200 rounded-2xl font-mono text-sm leading-relaxed focus:outline-none focus:border-brand-400 resize-none shadow-inner bg-background-50"
            v-model="editContent"
          />
          <div v-else class="prose prose-brand max-w-none prose-p:leading-relaxed prose-headings:tracking-tight" v-html="renderedMarkdown"></div>
        </div>
      </div>
      <div v-else class="flex flex-col items-center justify-center h-full text-text-muted gap-4 bg-background-50/30">
        <div class="w-16 h-16 rounded-full bg-background-100 flex items-center justify-center text-2xl border border-background-200 shadow-sm">📄</div>
        <span>请选择左侧记录查看详情</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import { FileText, Edit3, Save, X, Trash2, ExternalLink } from 'lucide-vue-next'
import type { Article } from '@/types'

const articles = ref<Article[]>([])
const selectedId = ref<string | null>(null)
const loading = ref(false)
const editing = ref(false)
const editContent = ref('')

const md = new MarkdownIt()

const selectedArticle = computed(() => articles.value.find(a => a.id === selectedId.value))

const renderedMarkdown = computed(() => {
  if (!selectedArticle.value) return ''
  return md.render(selectedArticle.value.content)
})

const getTypeColor = (typeName: string) => {
  const colors: Record<string, string> = {
    'commemoration': 'bg-brand-500',
    'news': 'bg-blue-500',
    'opinion': 'bg-green-500',
    'professor': 'bg-purple-500',
    'research': 'bg-indigo-500',
    'speech': 'bg-orange-500',
    'activity': 'bg-pink-500',
  }
  return colors[typeName] || 'bg-gray-500'
}

const formatRelativeTime = (ts: number) => {
  const now = Date.now()
  const diff = now - ts * 1000
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDate(ts)
}

const formatDate = (ts: number) => {
  return new Date(ts * 1000).toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false 
  })
}

const loadArticles = async () => {
  loading.value = true
  try {
    const res = await fetch('/api/articles')
    if (res.ok) {
      const data = await res.json()
      data.sort((a: Article, b: Article) => b.created_at - a.created_at)
      articles.value = data
    }
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条记录吗？')) return
  const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
  if (res.ok) {
    articles.value = articles.value.filter(a => a.id !== id)
    if (selectedId.value === id) selectedId.value = null
  } else {
    alert('删除失败')
  }
}

const handleEdit = () => {
  if (selectedArticle.value) {
    editContent.value = selectedArticle.value.content
    editing.value = true
  }
}

const handleSave = async () => {
  if (!selectedArticle.value) return
  const newArticle = { ...selectedArticle.value, content: editContent.value }
  try {
    const res = await fetch(`/api/articles/${selectedArticle.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle)
    })
    if (res.ok) {
      articles.value = articles.value.map(a => a.id === selectedArticle.value!.id ? newArticle : a)
      editing.value = false
    } else {
      alert('保存失败')
    }
  } catch (e) {
    alert('保存失败: ' + (e as Error).message)
  }
}

const previewArticle = (title: string, content: string) => {
  let previewTitle = title;
  if (!previewTitle) {
    const lines = content.split('\n');
    if (lines.length > 0 && lines[0].trim().length > 0) {
      previewTitle = lines[0].replace(/^#\s*/, '').trim();
    } else {
      previewTitle = '生成文稿预览';
    }
  }
  
  localStorage.setItem('preview_title', previewTitle);
  localStorage.setItem('preview_content', content);
  
  window.open('/template.html', '_blank');
}

watch(selectedId, () => {
  editing.value = false
  editContent.value = ''
})

onMounted(() => {
  loadArticles()
})
</script>
