<template>
  <div class="grid gap-6 max-w-4xl mx-auto">
    <div v-if="step === 1">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-lg font-semibold">第一步：上传素材并智能分类</div>
        </div>
        
        <div 
          class="upload-zone cursor-pointer mb-4"
          :class="{ 'border-brand-400 bg-brand-50/30': isDragging }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput?.click()"
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
            class="hidden"
            @change="handleFileChange"
          />
        </div>

        <div v-if="selectedFiles.length > 0" class="mb-4 grid gap-2">
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

        <button class="btn btn-primary w-full" @click="handleAnalyze" :disabled="analyzing">
          <span v-if="analyzing" class="flex items-center gap-2">
            <Loader2 :size="18" class="animate-spin" />
            分析中…
          </span>
          <span v-else>开始分析</span>
        </button>
      </div>
      
      <div v-if="predictedType" class="card p-6 bg-brand-50/50 border-brand-200 border">
        <div class="font-semibold mb-4 text-brand-800">分析结果</div>
        <div class="mb-4">
          <label class="block text-sm text-text-secondary mb-2">系统推荐类型</label>
          <select class="input" v-model="predictedType.id" @change="handleTypeChange">
            <option v-for="t in allTypes" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <button class="btn btn-primary w-full" @click="loadTemplates">确认类型并选择模板</button>
      </div>
    </div>

    <div v-if="step === 2" class="h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div class="flex items-center gap-4">
        <button class="text-text-secondary hover:text-text-primary hover:underline transition-colors" @click="step = 1">← 返回上传</button>
        <div class="font-bold text-xl text-text-primary">第二步：选择生成模板 ({{ predictedType?.name }})</div>
      </div>
      <div class="flex-1 grid grid-cols-[320px_1fr] gap-6 overflow-hidden">
        <div class="bg-surface-50 rounded-2xl shadow-soft overflow-y-auto p-4 space-y-2">
          <div
            v-for="t in availableTemplates"
            :key="t.template_id"
            @click="selectedTemplate = t"
            class="p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
            :class="selectedTemplate?.template_id === t.template_id ? 'bg-brand-50/50 border-brand-400 border-l-4 border-l-brand-500' : 'bg-surface-50 border-gray-200'"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium truncate text-text-primary">{{ t.meta?.title || (t.meta?.is_system ? '系统默认模板' : t.template_id) }}</span>
              <span v-if="t.meta?.is_favorite" class="text-yellow-500">★</span>
            </div>
            <div class="flex gap-2 text-xs">
              <span v-if="t.meta?.is_system" class="badge badge-system">系统</span>
              <span v-else class="badge badge-custom">自定义</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm p-6 flex flex-col overflow-hidden">
          <div v-if="selectedTemplate" class="flex flex-col h-full min-h-0">
            <div class="mb-4 pb-4 border-b flex-shrink-0">
              <h3 class="font-bold text-lg mb-2">
                {{ selectedTemplate.meta?.title || (selectedTemplate.meta?.is_system ? '系统默认模板' : selectedTemplate.template_id) }}
              </h3>
              <div class="text-sm text-gray-500">
                包含 {{ selectedTemplate.sections.length }} 个主要章节
              </div>
            </div>
            <div class="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-xl border min-h-0">
              <div class="space-y-3 text-sm text-text-secondary">
                <div v-for="(s, i) in selectedTemplate.sections" :key="i" class="pl-3 border-l-2 border-brand-200">
                  <div class="font-medium text-text-primary">{{ s.title }}</div>
                  <ul v-if="s.bullets" class="list-disc list-inside pl-2 text-xs text-text-tertiary mt-1">
                    <li v-for="(b, idx) in s.bullets.slice(0, 3)" :key="idx" class="truncate">{{ b }}</li>
                  </ul>
                  <div v-if="s.children" class="space-y-2 text-sm text-text-secondary mt-2">
                    <div v-for="(c, k) in s.children" :key="k" class="pl-3 border-l-2 border-brand-100">
                      <div class="font-medium text-text-primary">{{ c.title }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex-shrink-0 pt-4">
              <button class="btn btn-primary w-full py-3" @click="confirmTemplate">
                使用此模板生成
              </button>
            </div>
          </div>
          <div v-else class="flex items-center justify-center h-full text-gray-400">请选择左侧模板预览</div>
        </div>
      </div>
    </div>

    <div v-if="step === 3" class="space-y-6">
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="text-lg font-semibold">第三步：确认素材并生成</div>
          <button class="text-gray-500 hover:underline text-sm" @click="resetToStart">重新开始新的生成</button>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-text-secondary mb-2">素材内容</label>
          <textarea class="input h-48" v-model="materials" placeholder="请输入或粘贴素材内容" />
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium text-text-secondary mb-2">自定义标题（可选）</label>
          <input class="input" v-model="customTitle" placeholder="留空则自动生成" />
        </div>
        
        <div v-if="matchedPeople.length > 0" class="mb-4 p-4 bg-brand-50/50 border border-brand-200 rounded-2xl">
          <div class="text-sm font-semibold text-brand-800 mb-4">检测到人物信息（{{ selectedPeopleCount }}/{{ matchedPeople.length }} 已选择）</div>
          <div class="space-y-3">
            <div 
              v-for="(person, index) in matchedPeople" 
              :key="index" 
              class="person-card border-gray-200"
              :class="person.conflict?.hasConflict ? 'person-card-conflict' : (person.matchType === 'exact' && person.similarity >= 0.99 ? 'person-card-exact' : 'person-card-fuzzy')"
            >
              <div class="flex items-center justify-between mb-3">
                <label class="flex items-center gap-3">
                  <input type="checkbox" v-model="person.selected" class="w-4 h-4 rounded" />
                  <span class="font-medium text-text-primary">
                    <template v-if="person.matchType === 'fuzzy' && person.materialName !== person.dbName">
                      <span>
                        素材中: <span class="text-text-tertiary">{{ person.materialName }}</span> → 
                        数据库: <span class="text-brand-600">{{ person.dbName }}</span>
                      </span>
                    </template>
                    <template v-else>
                      {{ person.dbName }}
                    </template>
                  </span>
                </label>
                <span class="badge" :class="person.matchType === 'exact' && person.similarity >= 0.99 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  相似度: {{ Math.round(person.similarity * 100) }}%
                </span>
              </div>
              
              <div class="text-xs text-text-secondary mb-3">
                <div class="font-medium text-text-primary mb-1">数据库信息:</div>
                <div class="pl-2">{{ person.dbInfo }}</div>
              </div>
              
              <div v-if="person.conflict?.hasConflict" class="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                <div class="text-xs font-semibold text-red-800 mb-2">⚠️ 检测到信息冲突</div>
                <div v-if="person.conflict.materialInfo" class="text-xs text-red-700 mb-2">
                  素材中: {{ person.conflict.materialInfo }}
                </div>
                <div class="text-xs text-red-600 mb-3">
                  {{ person.conflict.reason }}
                </div>
                <div class="space-y-2">
                  <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                    <input
                      type="radio"
                      :name="'conflict-' + index"
                      :checked="!person.userOverride"
                      @change="handleConflictChange(index, undefined)"
                      class="w-4 h-4"
                    />
                    <span>使用数据库信息</span>
                  </label>
                  <label class="flex items-center gap-2 text-xs text-text-primary cursor-pointer">
                    <input
                      type="radio"
                      :name="'conflict-' + index"
                      :checked="person.userOverride?.info !== undefined"
                      @change="handleConflictChange(index, { name: person.materialName, info: person.conflict?.materialInfo ?? '' })"
                      class="w-4 h-4"
                    />
                    <span>使用素材信息</span>
                  </label>
                </div>
              </div>
              
              <div v-if="person.similarNames && person.similarNames.length > 0" class="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                <div class="text-xs font-semibold text-orange-800 mb-3">
                  ⚠️ 检测到数据库中存在相似的名字，可能是拼写错误：
                </div>
                <div class="space-y-2 mb-3">
                  <div v-for="(similar, simIndex) in person.similarNames" :key="simIndex" class="flex items-center justify-between text-xs">
                    <span class="text-orange-700">
                      • {{ similar.name }} (相似度: {{ Math.round(similar.similarity * 100) }}%)
                    </span>
                    <button
                      class="btn text-xs px-2 py-1 bg-orange-500 text-white hover:bg-orange-600"
                      @click="handleSimilarNameChange(index, similar)"
                    >
                      使用此名字
                    </button>
                  </div>
                </div>
                <div class="text-xs text-orange-600">
                  如果素材中的 "{{ person.materialName }}" 写错了，请点击上方按钮切换到正确名字
                </div>
              </div>
              
              <div v-if="person.matchType === 'fuzzy' && !person.conflict?.hasConflict && !person.similarNames" class="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div class="text-xs text-yellow-800 mb-3">
                  检测到疑似人名 "{{ person.materialName }}"，是否指代数据库中的 "{{ person.dbName }}"？
                </div>
                <div class="flex gap-2">
                  <button
                    class="btn text-xs px-3 py-1.5 bg-yellow-500 text-white hover:bg-yellow-600"
                    @click="person.matchType = 'exact'"
                  >
                    确认
                  </button>
                  <button
                    class="btn text-xs px-3 py-1.5 bg-gray-200 text-text-primary hover:bg-gray-300"
                    @click="matchedPeople.splice(index, 1)"
                  >
                    忽略
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-4">
          <button 
            class="btn btn-primary w-full py-3 text-lg bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 hover:shadow-glow" 
            @click="run" 
            :disabled="loading"
          >
            <span v-if="loading" class="flex items-center gap-2">
              <Loader2 :size="20" class="animate-spin" />
              生成中…
            </span>
            <span v-else>生成新闻稿</span>
          </button>
        </div>
      </div>
      
      <div v-if="articleVersions.length > 0" class="space-y-6">
        <div
          v-for="(version, index) in articleVersions"
          :key="version.id"
          class="card p-6 whitespace-pre-wrap bg-surface-50 shadow-medium border-t-4"
          :class="index === 0 ? 'border-t-green-500' : 'border-t-blue-500'"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="text-lg font-semibold text-text-primary">
              {{ index === 0 ? '原始生成版本' : '修改版本 ' + index }}
            </div>
            <div class="text-xs text-text-muted">版本 ID: {{ version.id.substring(0, 8) }}...</div>
          </div>
          <div class="mt-2 text-text-secondary leading-relaxed">
            {{ version.content }}
          </div>
        </div>
        
        <div class="card p-6">
          <div class="text-lg font-semibold mb-4 text-text-primary">修改新闻稿</div>
          <textarea
            class="input h-32 mb-4"
            v-model="modificationRequest"
            placeholder="请输入您的修改需求，例如：'增加更多细节'、'调整语气'、'修改某个部分'等"
            :disabled="modifying"
          />
          <button
            class="btn btn-primary w-full"
            @click="handleModify"
            :disabled="modifying || !modificationRequest.trim() || !articleId"
          >
            <span v-if="modifying" class="flex items-center gap-2">
              <Loader2 :size="18" class="animate-spin" />
              修改中…
            </span>
            <span v-else>提交修改请求</span>
          </button>
        </div>
      </div>
      
      <div v-if="output && articleVersions.length === 0" class="card p-6 whitespace-pre-wrap bg-surface-50 shadow-medium border-t-4 border-t-brand-500">
        <div class="text-text-secondary leading-relaxed">
          {{ output }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onActivated, computed } from 'vue'
import { UploadCloud, FileText, X, Loader2 } from 'lucide-vue-next'
import type { TypeItem, Outline, MatchedPerson, ArticleVersion } from '@/types'

const step = ref<1 | 2 | 3>(1)
const files = ref<FileList | null>(null)
const selectedFiles = ref<File[]>([])
const analyzing = ref(false)
const predictedType = ref<TypeItem | null>(null)
const allTypes = ref<TypeItem[]>([])
const parsedText = ref('')
const availableTemplates = ref<Outline[]>([])
const selectedTemplate = ref<Outline | null>(null)
const materials = ref('')
const customTitle = ref('')
const output = ref('')
const loading = ref(false)
const articleId = ref('')
const modificationRequest = ref('')
const modifying = ref(false)
const articleVersions = ref<ArticleVersion[]>([])
const allPeople = ref<Record<string, string>>({})
const matchedPeople = ref<MatchedPerson[]>([])
const checkingConflicts = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const selectedPeopleCount = computed(() => {
  return matchedPeople.value.filter(p => p.selected).length
})

onMounted(() => {
  console.log('GeneratePage mounted - 组件首次创建')
  fetch('/api/types').then(r => r.json()).then(data => { allTypes.value = data })
  fetch('/api/people').then(r => r.json()).then(data => { allPeople.value = data })
})

onActivated(() => {
  console.log('GeneratePage activated - 组件从缓存中恢复')
  console.log('当前步骤:', step.value)
  console.log('素材内容长度:', materials.value.length)
  console.log('已选择文件数:', selectedFiles.value.length)
})

watch(
  () => step.value,
  (newStep) => {
    if (newStep === 3 && materials.value && Object.keys(allPeople.value).length > 0) {
      matchPeople()
    }
  }
)

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    selectedFiles.value = Array.from(target.files)
    files.value = target.files
  }
}

const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  if (e.dataTransfer?.files) {
    selectedFiles.value = Array.from(e.dataTransfer.files)
    files.value = e.dataTransfer.files as any
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const handleAnalyze = async () => {
  if (!files.value || files.value.length === 0) return alert('请选择文件')
  analyzing.value = true
  try {
    const fd = new FormData()
    for (let i = 0; i < files.value.length; i++) fd.append('files', files.value[i])
    const resParse = await fetch('/api/files/parse', { method: 'POST', body: fd })
    if (!resParse.ok) throw new Error('解析失败')
    const dataParse = await resParse.json()
    const texts = dataParse.texts as string[]
    parsedText.value = texts.join('\n\n')

    const resClassify = await fetch('/api/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts })
    })
    if (!resClassify.ok) throw new Error('分类失败')
    const typeItem = await resClassify.json()
    predictedType.value = typeItem
  } catch (e) {
    alert((e as Error).message)
  } finally {
    analyzing.value = false
  }
}

const handleTypeChange = (e: Event) => {
  const target = e.target as HTMLSelectElement
  const t = allTypes.value.find(x => x.id === target.value)
  if (t) predictedType.value = t
}

const loadTemplates = async () => {
  if (!predictedType.value) return
  const res = await fetch(`/api/outlines/${predictedType.value.id}`)
  if (res.ok) {
    const data = await res.json()
    const list = (data.templates as any[]).map(t => ({
      ...t,
      type_id: predictedType.value!.id,
      type_name: predictedType.value!.name
    })) as Outline[]
    list.sort((a, b) => {
      if (a.meta?.is_system && !b.meta?.is_system) return -1
      if (!a.meta?.is_system && b.meta?.is_system) return 1
      if (a.meta?.is_favorite && !b.meta?.is_favorite) return -1
      if (!a.meta?.is_favorite && b.meta?.is_favorite) return 1
      return 0
    })
    availableTemplates.value = list
    if (list.length > 0) selectedTemplate.value = list[0]
    step.value = 2
  } else {
    alert('加载模板失败')
  }
}

const confirmTemplate = () => {
  if (!selectedTemplate.value) return
  materials.value = parsedText.value
  step.value = 3
}

const matchPeople = async () => {
  if (checkingConflicts.value) return
  
  try {
    const matchRes = await fetch('/api/match-people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        materials: materials.value,
        people_db: allPeople.value
      })
    })
    
    if (!matchRes.ok) throw new Error('匹配失败')
    const matches = await matchRes.json()
    
    checkingConflicts.value = true
    const matchedWithConflicts: MatchedPerson[] = await Promise.all(
      matches.map(async (match: any) => {
        const nameIndex = materials.value.indexOf(match.material_name)
        if (nameIndex === -1) {
          return {
            dbName: match.db_name,
            materialName: match.material_name,
            dbInfo: match.db_info,
            matchType: match.match_type,
            similarity: match.similarity,
            similarNames: match.similar_names,
            selected: true
          }
        }
        
        const contextStart = Math.max(0, nameIndex - 100)
        const contextEnd = Math.min(materials.value.length, nameIndex + match.material_name.length + 100)
        const context = materials.value.substring(contextStart, contextEnd)
        
        const conflictRes = await fetch('/api/check-conflict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: match.db_name,
            db_info: match.db_info,
            material_context: context
          })
        })
        
        let conflict = undefined
        if (conflictRes.ok) {
          const conflictData = await conflictRes.json()
          if (conflictData.has_conflict) {
            conflict = {
              hasConflict: true,
              materialInfo: conflictData.material_info,
              reason: conflictData.reason
            }
          }
        }
        
        return {
          dbName: match.db_name,
          materialName: match.material_name,
          dbInfo: match.db_info,
          matchType: match.match_type,
          similarity: match.similarity,
          similarNames: match.similar_names,
          conflict: conflict,
          selected: true
        }
      })
    )
    
    matchedPeople.value = matchedWithConflicts
    checkingConflicts.value = false
  } catch (e) {
    console.error('Error matching people:', e)
    checkingConflicts.value = false
  }
}

const handleConflictChange = (index: number, override: { name?: string; info?: string } | undefined) => {
  matchedPeople.value[index].userOverride = override
}

const handleSimilarNameChange = (index: number, similar: { name: string; similarity: number }) => {
  matchedPeople.value[index] = {
    ...matchedPeople.value[index],
    dbName: similar.name,
    dbInfo: allPeople.value[similar.name] || matchedPeople.value[index].dbInfo,
    matchType: 'fuzzy',
    similarity: similar.similarity,
    userOverride: undefined
  }
}

const run = async () => {
  if (!selectedTemplate.value || !materials.value.trim()) return alert('请填写素材')
  loading.value = true
  output.value = ''
  try {
    const knowledge_base: Record<string, string> = {}
    let processedMaterials = materials.value
    
    const sortedMatchedPeople = [...matchedPeople.value]
      .filter(p => p.selected)
      .sort((a, b) => b.similarity - a.similarity)
    
    sortedMatchedPeople.forEach(person => {
      const name = person.userOverride?.name || person.dbName
      let info: string
      if (person.userOverride?.info !== undefined) {
        info = person.userOverride.info
      } else {
        info = person.dbInfo
      }
      
      if (info && info.trim()) {
        knowledge_base[name] = info
      }
      
      if (person.materialName !== name) {
        const escapedMaterialName = person.materialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        processedMaterials = processedMaterials.replace(
          new RegExp(escapedMaterialName, 'g'),
          name
        )
      }
    })
    
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type_id: selectedTemplate.value.type_id,
        outline: selectedTemplate.value,
        materials: processedMaterials,
        title: customTitle.value,
        knowledge_base: Object.keys(knowledge_base).length > 0 ? knowledge_base : undefined
      })
    })
    if (!res.ok) throw new Error('生成失败')
    
    const reader = res.body?.getReader()
    if (!reader) throw new Error('无法读取流')
    
    const decoder = new TextDecoder()
    let firstChunk = true
    let currentContent = ''
    let currentArticleId = ''
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      let text = decoder.decode(value, { stream: true })
      
      if (firstChunk) {
        if (text.startsWith('ID:')) {
          const parts = text.split('\n')
          if (parts.length > 0) {
            currentArticleId = parts[0].substring(3)
            articleId.value = currentArticleId
            text = parts.slice(1).join('\n')
          }
        }
        firstChunk = false
      }
      
      currentContent += text
      output.value = currentContent
    }
    
    articleVersions.value = [{ id: currentArticleId, content: currentContent }]
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}

const handleModify = async () => {
  if (!articleId.value || !modificationRequest.value.trim()) return alert('请填写修改需求')
  modifying.value = true
  try {
    const knowledge_base: Record<string, string> = {}
    matchedPeople.value.forEach(person => {
      if (person.selected) {
        const name = person.userOverride?.name || person.dbName
        const info = person.userOverride?.info || person.dbInfo
        knowledge_base[name] = info
      }
    })
    
    const res = await fetch('/api/modify-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article_id: articleId.value,
        user_query: modificationRequest.value,
        knowledge_base: Object.keys(knowledge_base).length > 0 ? knowledge_base : undefined
      })
    })
    if (!res.ok) throw new Error('修改失败')
    
    const reader = res.body?.getReader()
    if (!reader) throw new Error('无法读取流')
    
    const decoder = new TextDecoder()
    let newArticleId = articleId.value
    let firstChunk = true
    let currentContent = ''
    
    const tempVersionId = `temp-${Date.now()}`
    articleVersions.value = [
      ...articleVersions.value,
      { id: tempVersionId, content: '' }
    ]
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      let text = decoder.decode(value, { stream: true })
      
      if (firstChunk) {
        if (text.startsWith('ID:')) {
          const parts = text.split('\n')
          if (parts.length > 0) {
            newArticleId = parts[0].substring(3)
            text = parts.slice(1).join('\n')
          }
        }
        firstChunk = false
      }
      
      currentContent += text
      
      articleVersions.value = articleVersions.value.map((v, i) => {
        if (i === articleVersions.value.length - 1) {
          return { id: newArticleId, content: currentContent }
        }
        return v
      })
    }
    
    articleId.value = newArticleId
    modificationRequest.value = ''
  } catch (e) {
    articleVersions.value = articleVersions.value.slice(0, -1)
    alert((e as Error).message)
  } finally {
    modifying.value = false
  }
}

const resetToStart = () => {
  step.value = 1
  files.value = null
  predictedType.value = null
  parsedText.value = ''
  availableTemplates.value = []
  selectedTemplate.value = null
  materials.value = ''
  customTitle.value = ''
  output.value = ''
  articleId.value = ''
  articleVersions.value = []
  matchedPeople.value = []
  modificationRequest.value = ''
}
</script>
