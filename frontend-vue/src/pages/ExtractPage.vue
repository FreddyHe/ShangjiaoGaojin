<template>
  <div class="grid gap-8 max-w-3xl mx-auto">
    <div class="card p-8">
      <div class="text-xl font-bold mb-6 text-text-primary tracking-tight">上传新闻稿文件或链接 <span class="text-sm font-normal text-text-muted ml-2">任意数量，至少1篇/1个链接</span></div>
      
      <div 
        class="upload-zone cursor-pointer mb-6"
        :class="{ 'border-brand-400 bg-brand-50/30': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
        @click="triggerFileInput"
      >
        <div class="flex flex-col items-center gap-3">
          <UploadCloud :size="48" class="text-text-muted" />
          <div class="text-text-secondary">
            <span class="text-brand-600 font-medium">点击上传</span> 或拖拽文件到此处
          </div>
          <div class="text-sm text-text-muted">支持 .txt, .docx, .pdf 格式</div>
        </div>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept=".txt,.docx,.pdf"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <div v-if="selectedFiles.length > 0" class="mt-4 mb-6 grid gap-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-gray-200"
        >
          <div class="flex items-center gap-2">
            <FileText :size="18" class="text-text-muted" />
            <span class="text-sm text-text-primary">{{ file.name }}</span>
          </div>
          <button
            @click="removeFile(index)"
            class="text-text-muted hover:text-red-500 transition-colors"
          >
            <X :size="18" />
          </button>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-text-secondary mb-2">或输入新闻链接（每行一个URL）</label>
        <textarea 
          v-model="urlInputs" 
          class="input w-full min-h-[100px] resize-y" 
          placeholder="https://www.saif.sjtu.edu.cn/show-107-6698.html&#10;https://www.saif.sjtu.edu.cn/show-107-6725.html"
        ></textarea>
      </div>

      <div class="mt-6 grid md:grid-cols-[1fr_auto] gap-4 items-center">
        <input class="input" v-model="templateId" placeholder="模板ID（默认default，可自定义）" />
        <div class="text-sm text-text-muted flex items-center bg-background-50 px-4 py-2.5 rounded-xl border border-background-200">将保存到该类型的此模板下</div>
      </div>
      
      <div class="mt-6">
        <button class="btn btn-primary w-full py-3 text-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:shadow-glow" @click="onSubmit" :disabled="loading">
          <span v-if="loading" class="flex items-center gap-2">
            <Loader2 :size="20" class="animate-spin" />
            提取中…
          </span>
          <span v-else>开始提取大纲</span>
        </button>
      </div>
    </div>

    <!-- 提取加载状态及网页预览模态框 -->
    <div v-if="loading" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div class="bg-surface-50 rounded-2xl shadow-2xl w-[800px] max-w-[90vw] overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-5 border-b border-background-200 flex items-center justify-between bg-background-50/50">
          <div class="flex items-center gap-3">
            <Loader2 :size="24" class="text-brand-500 animate-spin" />
            <h3 class="text-lg font-bold text-text-primary">{{ progressMessage }}</h3>
          </div>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          <!-- 实时进度日志框 -->
          <div ref="logContainer" class="bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 h-32 overflow-y-auto shadow-inner border border-slate-700 relative scroll-smooth">
            <div class="absolute top-2 right-3 flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span class="text-slate-400 text-[10px]">Terminal</span>
            </div>
            <div class="flex flex-col gap-1.5 mt-2">
              <div v-for="(log, i) in progressLog" :key="i" class="opacity-90">
                <span class="text-slate-500 mr-2">></span> {{ log }}
              </div>
              <div class="animate-pulse text-green-500 opacity-70">_</div>
            </div>
          </div>

          <div v-if="selectedFiles.length > 0" class="flex items-center gap-2 text-sm text-text-secondary">
            <FileText :size="16" />
            <span>正在读取 {{ selectedFiles.length }} 个本地文件</span>
          </div>
          
          <div v-if="parsedUrls.length > 0" class="flex flex-col gap-4">
            <div class="flex items-center gap-2 text-sm text-text-secondary">
              <Globe :size="16" />
              <span>正在抓取并分析 {{ parsedUrls.length }} 个网页链接:</span>
            </div>
            
            <div class="grid gap-4" :class="parsedUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'">
              <div v-for="(url, idx) in parsedUrls" :key="idx" class="relative rounded-xl overflow-hidden border border-background-200 shadow-sm bg-white aspect-video group">
                <!-- 扫描动画效果 -->
                <div class="absolute inset-0 z-10 bg-brand-500/10 pointer-events-none overflow-hidden">
                  <div class="w-full h-1 bg-brand-400 shadow-[0_0_10px_2px_rgba(59,130,246,0.6)] animate-scan"></div>
                </div>
                <!-- 缩小比例的真实网页预览 -->
                <iframe :src="url" class="w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none opacity-80" frameborder="0"></iframe>
                
                <!-- URL 底部标签 -->
                <div class="absolute bottom-0 left-0 right-0 bg-slate-900/80 text-white text-xs px-3 py-2 truncate backdrop-blur-md">
                  {{ url }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-4 bg-background-100 text-center text-sm text-text-tertiary border-t border-background-200">
          智能体正在深度阅读内容并生成结构化大纲，请稍候...
        </div>
      </div>
    </div>

    <!-- 类型确认模态框 -->
    <div v-if="showTypeConfirm" class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div class="bg-surface-50 rounded-2xl shadow-2xl w-[500px] max-w-[90vw] overflow-hidden flex flex-col max-h-[85vh]">
        <div class="p-5 border-b border-background-200 bg-background-50/50 flex-shrink-0">
          <h3 class="text-lg font-bold text-text-primary">确认文章类型</h3>
          <p class="text-sm text-text-secondary mt-1">智能体已自动为您分类，您可以确认或手动修改为其他类型。</p>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1">
          <label class="block text-sm font-medium text-text-secondary mb-3">选择稿件类型</label>
          <div class="grid gap-3">
            <label 
              v-for="type in availableTypes" 
              :key="type.id"
              class="flex items-center p-3 border rounded-xl cursor-pointer transition-colors"
              :class="selectedTypeId === type.id ? 'border-brand-500 bg-brand-50/50' : 'border-background-200 hover:border-brand-300 hover:bg-background-50'"
            >
              <input 
                type="radio" 
                :value="type.id" 
                v-model="selectedTypeId"
                class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500 flex-shrink-0"
              />
              <div class="ml-3 flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-text-primary truncate">{{ type.name }}</span>
                  <span v-if="parsedData?.type_id === type.id" class="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2">自动识别</span>
                </div>
                <div v-if="type.description" class="text-xs text-text-secondary mt-1 line-clamp-2">{{ type.description }}</div>
              </div>
            </label>
          </div>
        </div>
        
        <div class="p-5 border-t border-background-200 flex justify-end gap-3 bg-background-50/50 flex-shrink-0">
          <button class="btn btn-secondary px-6" @click="showTypeConfirm = false">取消</button>
          <button class="btn btn-primary px-8 bg-gradient-to-r from-brand-500 to-brand-600" @click="confirmType">
            确认并提取大纲
          </button>
        </div>
      </div>
    </div>

    <!-- 大纲编辑区域 -->
    <div v-if="outline" class="card p-8">
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-background-200">
        <div class="font-bold text-2xl text-text-primary tracking-tight">提取结果</div>
        <div class="flex items-center gap-4">
          <div class="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-200">类型：{{ outline.type_name }}</div>
          <span class="text-sm text-text-muted bg-background-50 px-3 py-1 rounded-full border border-background-200">模板ID: {{ outline.template_id }}</span>
        </div>
      </div>

      <div class="grid gap-6">
        <div
          v-for="(section, index) in outline.sections"
          :key="index"
          class="section-card border-background-200 shadow-sm relative group overflow-hidden"
        >
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-200 group-hover:bg-brand-400 transition-colors"></div>
          <!-- Section 标题 -->
          <div class="flex items-center gap-3 mb-4 pl-2">
            <div class="w-1.5 h-5 bg-brand-500 rounded-full shadow-sm"></div>
            <input
              class="input font-bold text-text-primary text-lg bg-transparent border-transparent hover:border-background-200 focus:bg-surface-50 focus:border-brand-400 px-2 py-1 flex-1"
              :value="section.title"
              @input="updateSectionTitle(index, ($event.target as HTMLInputElement).value)"
              placeholder="章节标题"
            />
            <button
              @click="removeSection(index)"
              class="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="删除章节"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- Description -->
          <div class="mb-4 pl-4">
            <input
              class="input text-sm bg-background-50"
              :value="section.description || ''"
              @input="updateSectionField(index, 'description', ($event.target as HTMLInputElement).value)"
              placeholder="章节描述/写作指引（可选）"
            />
          </div>

          <!-- Word count & Granularity -->
          <div class="flex flex-wrap gap-4 mb-4 pl-4">
            <div class="flex items-center gap-2 bg-background-50 px-3 py-1.5 rounded-lg border border-background-200">
              <span class="text-xs text-text-tertiary font-medium">字数要求</span>
              <input
                class="input text-sm bg-transparent border-transparent hover:border-background-200 focus:bg-white focus:border-brand-400 py-0.5 px-2 w-32 h-auto min-h-0"
                :value="section.word_count || ''"
                @input="updateSectionField(index, 'word_count', ($event.target as HTMLInputElement).value)"
                placeholder="如 100-150字"
              />
            </div>
            <div class="flex items-center gap-2 bg-background-50 px-3 py-1.5 rounded-lg border border-background-200">
              <span class="text-xs text-text-tertiary font-medium">颗粒度</span>
              <input
                class="input text-sm bg-transparent border-transparent hover:border-background-200 focus:bg-white focus:border-brand-400 py-0.5 px-2 w-24 h-auto min-h-0"
                :value="section.granularity || ''"
                @input="updateSectionField(index, 'granularity', ($event.target as HTMLInputElement).value)"
                placeholder="如 高/中/低"
              />
            </div>
          </div>

          <!-- Bullets -->
          <div class="mt-4 grid gap-2.5 pl-4">
            <div
              v-for="(b, j) in (section.bullets || [])"
              :key="j"
              class="flex items-center gap-2 group/bullet"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-text-tertiary"></div>
              <input
                class="input text-sm flex-1 py-2 bg-transparent border-transparent hover:border-background-200 focus:bg-surface-50 focus:border-brand-400"
                :value="b"
                @input="updateBullet(index, j, ($event.target as HTMLInputElement).value)"
                :placeholder="'要点 ' + (j+1)"
              />
              <button
                @click="removeBullet(index, j)"
                class="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 opacity-0 group-hover/bullet:opacity-100"
              >
                <X :size="14" />
              </button>
            </div>
          </div>

          <!-- Children sections -->
          <div v-if="(section.children || []).length > 0" class="mt-5 ml-6 border-l-2 border-background-200 pl-5 grid gap-4">
            <div
              v-for="(child, ci) in section.children"
              :key="ci"
              class="bg-surface-50 rounded-xl p-4 border border-background-200 shadow-sm relative group/child"
            >
              <div class="flex items-center gap-3 mb-3">
                <input
                  class="input text-sm font-bold flex-1 bg-transparent border-transparent hover:border-background-200 focus:bg-white focus:border-brand-400 px-2 py-1"
                  :value="child.title"
                  @input="updateChildTitle(index, ci, ($event.target as HTMLInputElement).value)"
                  placeholder="子章节标题"
                />
                <button
                  @click="removeChild(index, ci)"
                  class="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                >
                  <X :size="14" />
                </button>
              </div>
              <div
                v-for="(cb, cj) in (child.bullets || [])"
                :key="cj"
                class="flex items-center gap-2 mt-2 group/cb"
              >
                <div class="w-1 h-1 rounded-full bg-text-tertiary"></div>
                <input
                  class="input text-xs flex-1 py-1.5 bg-transparent border-transparent hover:border-background-200 focus:bg-white focus:border-brand-400"
                  :value="cb"
                  @input="updateChildBullet(index, ci, cj, ($event.target as HTMLInputElement).value)"
                  :placeholder="'要点 ' + (cj+1)"
                />
                <button
                  @click="removeChildBullet(index, ci, cj)"
                  class="p-1 text-text-muted hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0 opacity-0 group-hover/cb:opacity-100"
                >
                  <X :size="12" />
                </button>
              </div>
              <button
                class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1 mt-3"
                @click="addChildBullet(index, ci)"
              ><span class="text-lg leading-none">+</span> 添加子要点</button>
            </div>
          </div>

          <!-- Add buttons -->
          <div class="flex gap-4 mt-5 pl-4">
            <button class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1" @click="addBullet(index)"><span class="text-lg leading-none">+</span> 添加要点</button>
            <button class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1" @click="addChild(index)"><span class="text-lg leading-none">+</span> 添加子章节</button>
          </div>
        </div>
      </div>

      <!-- Bottom actions -->
      <div class="mt-8 pt-6 border-t border-background-200 flex items-center gap-4">
        <button class="btn border-dashed border-2 hover:border-brand-400 text-brand-600 hover:bg-brand-50" @click="addSection">+ 添加新章节</button>
        <div class="flex-1"></div>
        <button class="btn btn-primary px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:shadow-glow" @click="saveOutline" :disabled="saving">
          <span v-if="saving" class="flex items-center gap-2">
            <Loader2 :size="18" class="animate-spin" />
            保存中…
          </span>
          <span v-else class="text-lg">保存到模板库</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { UploadCloud, FileText, X, Loader2, Globe } from 'lucide-vue-next'
import type { Outline, TypeItem } from '@/types'

const selectedFiles = ref<File[]>([])
const urlInputs = ref('')
const logContainer = ref<HTMLElement | null>(null)

const parsedUrls = computed(() => {
  if (!urlInputs.value) return []
  return urlInputs.value.split('\n').map(u => u.trim()).filter(u => u.length > 0)
})

const loading = ref(false)
const progressMessage = ref('准备就绪')
const progressLog = ref<string[]>([])
const saving = ref(false)
const outline = ref<Outline | null>(null)
const templateId = ref('default')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// 新增的状态变量用于类型确认
const showTypeConfirm = ref(false)
const parsedData = ref<{type_id: string, type_name: string, texts: string[]} | null>(null)
const availableTypes = ref<TypeItem[]>([])
const selectedTypeId = ref('')

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    selectedFiles.value = Array.from(e.dataTransfer.files)
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const onSubmit = async () => {
  const hasFiles = selectedFiles.value.length > 0
  const hasUrls = urlInputs.value.trim().length > 0
  
  if (!hasFiles && !hasUrls) {
    return alert('请至少上传1篇稿件或输入1个链接')
  }
  
  const form = new FormData()
  if (hasFiles) {
    selectedFiles.value.forEach(f => form.append('files', f))
  }
  if (hasUrls) {
    form.append('urls', urlInputs.value)
  }
  form.append('template_id', templateId.value || 'default')
  
  loading.value = true
  progressLog.value = []
  progressMessage.value = '正在建立连接...'
  outline.value = null

  try {
    const res = await fetch('/api/extract', { method: 'POST', body: form })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || '提取失败')
    }

    if (!res.body) throw new Error('Response body is null')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        
        if (!line) continue
        
        try {
          const event = JSON.parse(line)
          if (event.status === 'progress') {
            progressMessage.value = event.message
            progressLog.value.push(event.message)
            // 自动滚动到底部
            nextTick(() => {
              if (logContainer.value) {
                logContainer.value.scrollTop = logContainer.value.scrollHeight
              }
            })
          } else if (event.status === 'error') {
            throw new Error(event.message)
          } else if (event.status === 'success') {
            parsedData.value = event.data
            selectedTypeId.value = event.data.type_id
            
            // 获取可用类型列表
            try {
              const typesRes = await fetch('/api/types')
              if (typesRes.ok) {
                availableTypes.value = await typesRes.json()
              }
            } catch (e) {
              console.error('Failed to load types', e)
            }
            
            showTypeConfirm.value = true
            loading.value = false
            return // 退出当前的解析流程，等待用户确认
          }
        } catch (err) {
          if (err instanceof Error && err.message !== 'Unexpected end of JSON input') {
            throw err
          }
        }
      }
    }
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}

const confirmType = async () => {
  if (!parsedData.value) return
  
  showTypeConfirm.value = false
  loading.value = true
  progressLog.value = []
  progressMessage.value = '正在提取大纲...'
  
  try {
    const res = await fetch('/api/extract/outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: parsedData.value.texts,
        type_id: selectedTypeId.value,
        type_name: availableTypes.value.find(t => t.id === selectedTypeId.value)?.name || '',
        template_id: templateId.value || 'default'
      })
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || '提取失败')
    }

    if (!res.body) throw new Error('Response body is null')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      
      let newlineIndex
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)
        
        if (!line) continue
        
        try {
          const event = JSON.parse(line)
          if (event.status === 'progress') {
            progressMessage.value = event.message
            progressLog.value.push(event.message)
            nextTick(() => {
              if (logContainer.value) {
                logContainer.value.scrollTop = logContainer.value.scrollHeight
              }
            })
          } else if (event.status === 'error') {
            throw new Error(event.message)
          } else if (event.status === 'success') {
            progressMessage.value = '大纲提取完成！'
            progressLog.value.push('大纲提取完成！')
            outline.value = event.data
          }
        } catch (err) {
          if (err instanceof Error && err.message !== 'Unexpected end of JSON input') {
            throw err
          }
        }
      }
    }
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}

const updateSectionTitle = (idx: number, val: string) => {
  if (!outline.value) return
  outline.value.sections[idx].title = val
}

const updateSectionField = (idx: number, field: string, val: string) => {
  if (!outline.value) return
  ;(outline.value.sections[idx] as any)[field] = val
}

const updateBullet = (sIdx: number, bIdx: number, val: string) => {
  if (!outline.value) return
  const bullets = outline.value.sections[sIdx].bullets || []
  bullets[bIdx] = val
  outline.value.sections[sIdx].bullets = bullets
}

const addBullet = (sIdx: number) => {
  if (!outline.value) return
  if (!outline.value.sections[sIdx].bullets) {
    outline.value.sections[sIdx].bullets = []
  }
  outline.value.sections[sIdx].bullets!.push('')
}

const removeBullet = (sIdx: number, bIdx: number) => {
  if (!outline.value) return
  outline.value.sections[sIdx].bullets?.splice(bIdx, 1)
}

const addChild = (sIdx: number) => {
  if (!outline.value) return
  if (!outline.value.sections[sIdx].children) {
    outline.value.sections[sIdx].children = []
  }
  outline.value.sections[sIdx].children!.push({ title: '', bullets: [] })
}

const removeChild = (sIdx: number, cIdx: number) => {
  if (!outline.value) return
  outline.value.sections[sIdx].children?.splice(cIdx, 1)
}

const updateChildTitle = (sIdx: number, cIdx: number, val: string) => {
  if (!outline.value) return
  const children = outline.value.sections[sIdx].children || []
  if (children[cIdx]) children[cIdx].title = val
}

const updateChildBullet = (sIdx: number, cIdx: number, bIdx: number, val: string) => {
  if (!outline.value) return
  const child = (outline.value.sections[sIdx].children || [])[cIdx]
  if (child && child.bullets) child.bullets[bIdx] = val
}

const addChildBullet = (sIdx: number, cIdx: number) => {
  if (!outline.value) return
  const child = (outline.value.sections[sIdx].children || [])[cIdx]
  if (child) {
    if (!child.bullets) child.bullets = []
    child.bullets.push('')
  }
}

const removeChildBullet = (sIdx: number, cIdx: number, bIdx: number) => {
  if (!outline.value) return
  const child = (outline.value.sections[sIdx].children || [])[cIdx]
  if (child && child.bullets) child.bullets.splice(bIdx, 1)
}

const addSection = () => {
  if (!outline.value) return
  outline.value.sections.push({ title: '', bullets: [] })
}

const removeSection = (idx: number) => {
  if (!outline.value) return
  if (!confirm('确定删除该章节？')) return
  outline.value.sections.splice(idx, 1)
}

// ===== 保存 =====

const saveOutline = async () => {
  if (!outline.value) return
  saving.value = true
  try {
    const res = await fetch(`/api/outline/${outline.value.type_id}/${outline.value.template_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outline.value)
    })
    if (!res.ok) throw new Error('保存失败')
    alert('保存成功！可在"模板管理"页面查看。')
  } catch (e) {
    alert((e as Error).message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
@keyframes scan {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(400px);
  }
}
.animate-scan {
  animation: scan 2s linear infinite;
}
</style>
