<template>
  <div class="grid gap-8 max-w-3xl mx-auto">
    <div class="card p-8">
      <div class="text-xl font-bold mb-6 text-text-primary tracking-tight">上传新闻稿文件 <span class="text-sm font-normal text-text-muted ml-2">任意数量，至少1篇</span></div>
      
      <div 
        class="upload-zone cursor-pointer"
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

      <div v-if="selectedFiles.length > 0" class="mt-4 grid gap-2">
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
          <div class="grid grid-cols-2 gap-4 mb-4 pl-4">
            <input
              class="input text-sm bg-background-50"
              :value="section.word_count || ''"
              @input="updateSectionField(index, 'word_count', ($event.target as HTMLInputElement).value)"
              placeholder="字数范围，如 100-150字"
            />
            <input
              class="input text-sm bg-background-50"
              :value="section.granularity || ''"
              @input="updateSectionField(index, 'granularity', ($event.target as HTMLInputElement).value)"
              placeholder="颗粒度，如 高/中/低"
            />
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
import { ref } from 'vue'
import { UploadCloud, FileText, X, Loader2 } from 'lucide-vue-next'
import type { Outline } from '@/types'

const selectedFiles = ref<File[]>([])
const loading = ref(false)
const saving = ref(false)
const outline = ref<Outline | null>(null)
const templateId = ref('default')
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

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
  if (selectedFiles.value.length < 1) return alert('请至少上传1篇稿件')
  const form = new FormData()
  selectedFiles.value.forEach(f => form.append('files', f))
  form.append('template_id', templateId.value || 'default')
  loading.value = true
  outline.value = null
  try {
    const res = await fetch('/api/extract', { method: 'POST', body: form })
    if (!res.ok) throw new Error('提取失败')
    const outlineData: Outline = await res.json()
    outline.value = outlineData
  } catch (e) {
    alert((e as Error).message)
  } finally {
    loading.value = false
  }
}

// ===== 编辑方法 =====

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
