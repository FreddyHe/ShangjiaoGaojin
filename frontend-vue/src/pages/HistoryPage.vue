<template>
  <div class="h-[calc(100vh-4rem)] grid grid-cols-[300px_1fr] gap-6">
    <div class="flex flex-col bg-white rounded shadow h-full overflow-hidden">
      <div class="p-4 border-b font-bold text-lg flex justify-between items-center">
        <span>历史记录</span>
        <button class="text-sm text-brand-600 hover:underline" @click="loadArticles">刷新</button>
      </div>
      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <div v-if="loading" class="text-center p-4 text-gray-500">加载中...</div>
        <div v-if="!loading && articles.length === 0" class="text-center p-4 text-gray-500">暂无记录</div>
        <div
          v-for="a in articles"
          :key="a.id"
          @click="selectedId = a.id"
          class="p-3 rounded cursor-pointer border hover:border-brand-300 transition-colors"
          :class="selectedId === a.id ? 'bg-brand-50 border-brand-500' : 'bg-white border-gray-100'"
        >
          <div class="font-medium text-gray-900 truncate">{{ a.title || '未命名' }}</div>
          <div class="flex justify-between items-center mt-1">
            <span class="text-xs text-white bg-gray-400 px-1.5 py-0.5 rounded">{{ a.type_name }}</span>
            <span class="text-xs text-gray-400">{{ formatDate(a.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded shadow h-full overflow-hidden flex flex-col">
      <div v-if="selectedArticle">
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <div class="font-bold text-lg">{{ selectedArticle.title }}</div>
            <div class="text-xs text-gray-500 mt-1">
              生成时间: {{ formatDate(selectedArticle.created_at) }} | 类型: {{ selectedArticle.type_name }}
            </div>
          </div>
          <div class="flex gap-2">
            <a
              :href="`/api/articles/${selectedArticle.id}/download/docx`"
              target="_blank"
              class="btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200 flex items-center gap-1"
            >
              Word
            </a>
            <a
              :href="`/api/articles/${selectedArticle.id}/download/pdf`"
              target="_blank"
              class="btn bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-200 flex items-center gap-1"
            >
              PDF
            </a>
            <button
              v-if="!editing"
              @click="handleEdit"
              class="btn bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
            >
              修改内容
            </button>
            <template v-if="editing">
              <button
                @click="handleSave"
                class="btn bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
              >
                保存
              </button>
              <button
                @click="editing = false"
                class="btn bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200"
              >
                取消
              </button>
            </template>
            <button
              @click="handleDelete(selectedArticle.id)"
              class="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            >
              删除
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-6">
          <textarea
            v-if="editing"
            class="w-full h-full p-4 border rounded font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500"
            v-model="editContent"
          />
          <div v-else class="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none" v-html="renderedMarkdown"></div>
        </div>
      </div>
      <div v-else class="flex items-center justify-center h-full text-gray-400">
        请选择左侧记录查看详情
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
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

const formatDate = (ts: number) => {
  return new Date(ts * 1000).toLocaleString('zh-CN', { hour12: false })
}

watch(selectedId, () => {
  editing.value = false
  editContent.value = ''
})

onMounted(() => {
  loadArticles()
})
</script>
