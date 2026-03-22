<template>
  <div class="grid grid-cols-[280px_320px_1fr] gap-8 h-[calc(100vh-100px)]">
    <div class="card p-6 flex flex-col gap-5 overflow-hidden">
      <div class="font-bold text-xl tracking-tight text-text-primary mb-2">类型管理</div>
      <div class="grid grid-cols-2 gap-3">
        <input class="input text-sm" v-model="newId" placeholder="ID (字母数字)" />
        <input class="input text-sm" v-model="newName" placeholder="类型名称" />
        <button
          class="btn btn-primary col-span-2 text-sm py-2"
          @click="addType"
          :disabled="!newId.trim() || !newName.trim()"
        >+ 新增类型</button>
      </div>
      <div class="flex-1 overflow-y-auto grid gap-3">
        <div
          v-for="t in types"
          :key="t.id"
          class="type-card"
          :class="selectedTypeId === t.id ? 'type-card-selected' : ''"
          @click="setSelectedTypeId(t.id)"
        >
          <div class="flex justify-between items-center">
            <span class="font-medium text-text-primary">{{ t.name }}</span>
            <span class="badge badge-custom">{{ t.template_count }}</span>
          </div>
          <div class="flex justify-between items-center mt-2">
            <span class="text-xs text-text-muted">{{ t.id }}</span>
            <button class="text-xs text-red-500 hover:text-red-600 hover:underline" @click.stop="deleteType(t.id)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card p-6 flex flex-col gap-5 overflow-hidden">
      <div class="font-bold text-xl tracking-tight text-text-primary mb-2">模板列表</div>
      <div v-if="selectedTypeDescription" class="text-sm text-text-secondary bg-brand-50/50 p-4 rounded-xl border border-brand-100 leading-relaxed">
        <span class="font-medium text-brand-700 block mb-1">类型说明：</span>
        {{ selectedTypeDescription }}
      </div>
      <div v-if="!selectedTypeId" class="text-text-muted text-sm flex items-center justify-center h-32 bg-background-50 rounded-xl border border-dashed border-background-200">← 请先选择类型</div>
      <div v-else class="flex-1 overflow-y-auto grid gap-3 pr-1">
        <div
          v-for="t in templates"
          :key="t.template_id"
          class="template-card"
          :class="selectedTemplateId === t.template_id ? 'template-card-selected' : ''"
          @click="setSelectedTemplateId(t.template_id)"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium text-sm truncate text-text-primary" :title="t.template_id">
              {{ t.meta?.title || t.template_id }}
            </span>
            <div class="flex gap-1">
              <button
                @click.stop="toggleFavorite(t.template_id)"
                class="text-lg leading-none transition-all duration-200"
                :class="t.meta?.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'"
              >
                ★
              </button>
              <button
                @click.stop="deleteTemplate(selectedTypeId, t.template_id)"
                class="text-xs text-red-500 hover:text-red-600"
              >
                删除
              </button>
            </div>
          </div>
          <div class="text-xs text-text-secondary line-clamp-2">
            {{ (t.sections_summary || []).join(' / ') }}
          </div>
        </div>
        <button class="btn w-full mt-2 text-sm" @click="createNewTemplate">+ 新建空白模板</button>
        <button class="btn w-full mt-2 text-sm" @click="importJsonTemplate">+ 导入JSON模板</button>
      </div>
    </div>

    <div class="card p-8 flex flex-col overflow-hidden">
      <div v-if="!outline" class="flex flex-col items-center justify-center h-full text-text-muted gap-4">
        <div class="w-16 h-16 rounded-full bg-background-100 flex items-center justify-center text-2xl border border-background-200 shadow-sm">📝</div>
        <span>请选择模板或新建空白模板</span>
      </div>
      <template v-else>
        <div class="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-background-200">
          <div class="flex items-center gap-3">
            <div class="font-bold text-2xl tracking-tight text-text-primary">{{ outline.meta?.title || outline.template_id }}</div>
          </div>
          <div class="flex gap-2">
            <button class="btn text-sm" @click="renameTemplate">修改名称</button>
            <button class="btn text-sm" @click="saveAsTemplate">另存为</button>
            <button class="btn btn-primary text-sm shadow-sm" @click="saveOutline">保存修改</button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-2">
          <div class="grid gap-5">
            <SectionEditor
              v-for="(section, index) in outline.sections"
              :key="index"
              :section="section"
              @update-title="(v) => updateSectionTitle(index, v)"
              @add-bullet="() => addBullet(index)"
              @update-bullet="(j, v) => updateBullet(index, j, v)"
              @add-child="() => addChild(index)"
            />
            <button class="btn btn-primary w-max mt-2" @click="addSection">+ 添加一级标题</button>
          </div>
        </div>

        <div class="pt-6 border-t border-background-200 mt-6 flex justify-end">
          <button class="btn btn-primary px-8 py-3 text-base bg-gradient-to-r from-brand-500 to-brand-600 hover:shadow-glow" @click="saveOutline">保存当前模板</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { TypeItem, Outline, TemplateItem } from '@/types'

const types = ref<TypeItem[]>([])
const selectedTypeId = ref('')
const templates = ref<TemplateItem[]>([])
const selectedTemplateId = ref('')
const outline = ref<Outline | null>(null)
const newId = ref('')
const newName = ref('')

const selectedTypeDescription = computed(() => {
  const t = types.value.find(x => x.id === selectedTypeId.value)
  return t?.description || ''
})

const loadTypes = async () => {
  const res = await fetch('/api/types')
  if (res.ok) {
    const data = await res.json()
    types.value = data
  }
}

const loadTemplates = async (typeId: string) => {
  const res = await fetch(`/api/outlines/${typeId}`)
  if (res.ok) {
    const data = await res.json()
    const list = (data.templates || []) as TemplateItem[]
    list.sort((a, b) => {
      if (a.meta?.is_favorite && !b.meta?.is_favorite) return -1
      if (!a.meta?.is_favorite && b.meta?.is_favorite) return 1
      return 0
    })
    templates.value = list
  }
}

const loadOutline = async (typeId: string, templateId: string) => {
  console.log('loadOutline called:', typeId, templateId)
  const res = await fetch(`/api/outline/${typeId}/${templateId}`)
  console.log('loadOutline response status:', res.status)
  if (res.ok) {
    const data = await res.json()
    console.log('outline loaded:', data)
    outline.value = data
  } else {
    console.error('loadOutline failed:', res.status)
  }
}

const setSelectedTypeId = (id: string) => {
  selectedTypeId.value = id
  outline.value = null
  selectedTemplateId.value = ''
}

const setSelectedTemplateId = (id: string) => {
  selectedTemplateId.value = id
}

watch(selectedTypeId, async (newVal) => {
  if (newVal) {
    await loadTemplates(newVal)
  }
})

watch([() => selectedTypeId.value, () => selectedTemplateId.value], ([typeId, templateId]) => {
  if (typeId && templateId) {
    loadOutline(typeId, templateId)
  }
})

const addType = async () => {
  const id = newId.value.trim()
  const name = newName.value.trim()
  if (!id || !name) {
    alert('请填写完整的ID和名称')
    return
  }
  try {
    const res = await fetch('/api/types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    })
    if (res.ok) {
      newId.value = ''
      newName.value = ''
      await loadTypes()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(`新增失败: ${data.detail || res.status}`)
    }
  } catch (e) {
    alert('网络错误，新增失败')
  }
}

const deleteType = async (id: string) => {
  if (!confirm('确认删除该类型及其所有大纲？')) return
  const res = await fetch(`/api/types/${id}`, { method: 'DELETE' })
  if (res.ok) {
    await loadTypes()
    if (selectedTypeId.value === id) {
      selectedTypeId.value = ''
      outline.value = null
    }
  } else {
    alert('删除失败')
  }
}

const saveOutline = async () => {
  if (!outline.value) return
  const res = await fetch(`/api/outline/${outline.value.type_id}/${outline.value.template_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(outline.value)
  })
  if (res.ok) {
    alert('保存成功')
    await loadTemplates(outline.value.type_id)
  } else {
    alert('保存失败')
  }
}

const toggleFavorite = async (templateId: string) => {
  if (!selectedTypeId.value) return
  const res = await fetch(`/api/outline/${selectedTypeId.value}/${templateId}/favorite`, { method: 'POST' })
  if (res.ok) {
    await loadTemplates(selectedTypeId.value)
    if (outline.value && outline.value.template_id === templateId) {
      const data = await res.json()
      outline.value = { ...outline.value, meta: { ...outline.value.meta!, is_favorite: data.is_favorite } }
    }
  }
}

const deleteTemplate = async (typeId: string, templateId: string) => {
  if (!confirm('确定要删除该模板吗？')) return
  const res = await fetch(`/api/outline/${typeId}/${templateId}`, { method: 'DELETE' })
  if (res.ok) {
    await loadTemplates(typeId)
    if (selectedTemplateId.value === templateId) {
      selectedTemplateId.value = ''
      outline.value = null
    }
  } else {
    const data = await res.json().catch(() => ({}))
    alert(`删除失败: ${data.detail || '未知错误'}`)
  }
}

const createNewTemplate = () => {
  const name = prompt('请输入新模板名称 (ID)', 'new_template')
  if (name) {
    selectedTemplateId.value = ''
    outline.value = {
      type_id: selectedTypeId.value,
      type_name: types.value.find(x => x.id === selectedTypeId.value)?.name || '',
      template_id: name,
      sections: [],
      meta: { is_favorite: false, created_at: Date.now() }
    }
  }
}

const importJsonTemplate = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        const name = prompt('请输入导入的模板名称 (ID)', file.name.replace('.json', ''))
        if (name) {
          selectedTemplateId.value = ''
          outline.value = {
            type_id: selectedTypeId.value,
            type_name: types.value.find(x => x.id === selectedTypeId.value)?.name || '',
            template_id: name,
            sections: data.sections || data,
            meta: { is_favorite: false, created_at: Date.now(), title: data.meta?.title || name }
          }
        }
      } catch (err) {
        alert('解析 JSON 文件失败')
      }
    }
    reader.readAsText(file)
  }
  input.click()
}

const renameTemplate = () => {
  if (!outline.value) return
  const title = prompt('修改模板显示名称', outline.value.meta?.title || '')
  if (title !== null) {
    outline.value = { ...outline.value, meta: { ...outline.value.meta!, title } }
  }
}

const saveAsTemplate = () => {
  if (!outline.value) return
  const name = prompt('另存为新模板 (ID)', outline.value.template_id + '_copy')
  if (name) {
    outline.value = {
      ...outline.value,
      template_id: name,
      meta: { ...outline.value.meta!, is_favorite: false }
    }
    alert('已切换为新模板ID，请保存')
  }
}

const updateSectionTitle = (idx: number, v: string) => {
  if (!outline.value) return
  const sections = outline.value.sections.slice()
  sections[idx] = { ...sections[idx], title: v }
  outline.value = { ...outline.value, sections }
}

const updateBullet = (i: number, j: number, v: string) => {
  if (!outline.value) return
  const sections = outline.value.sections.slice()
  const bullets = (sections[i].bullets || []).slice()
  bullets[j] = v
  sections[i] = { ...sections[i], bullets }
  outline.value = { ...outline.value, sections }
}

const addChild = (i: number) => {
  if (!outline.value) return
  const sections = outline.value.sections.slice()
  const children = (sections[i].children || []).slice()
  children.push({ title: '', bullets: [], children: [] })
  sections[i] = { ...sections[i], children }
  outline.value = { ...outline.value, sections }
}

const addSection = () => {
  if (!outline.value) return
  outline.value = { ...outline.value, sections: [...outline.value.sections, { title: '', bullets: [] }] }
}

const addBullet = (i: number) => {
  if (!outline.value) return
  const sections = outline.value.sections.slice()
  const bullets = (sections[i].bullets || []).slice()
  bullets.push('')
  sections[i] = { ...sections[i], bullets }
  outline.value = { ...outline.value, sections }
}

onMounted(() => {
  loadTypes()
})
</script>

<script lang="ts">
import { defineComponent } from 'vue'
import type { OutlineSection } from '@/types'

export default defineComponent({
  components: {
    SectionEditor: defineComponent({
      props: {
        section: {
          type: Object as () => OutlineSection,
          required: true
        }
      },
      emits: ['update-title', 'add-bullet', 'update-bullet', 'add-child'],
      template: `
        <div class="section-card border-background-200 shadow-sm relative group overflow-hidden">
          <div class="absolute left-0 top-0 bottom-0 w-1 bg-brand-200 group-hover:bg-brand-400 transition-colors"></div>
          <div class="flex items-center gap-3 mb-4 pl-2">
            <div class="w-1.5 h-5 bg-brand-500 rounded-full shadow-sm"></div>
            <input class="input font-bold text-text-primary text-lg bg-transparent border-transparent hover:border-background-200 focus:bg-surface-50 focus:border-brand-400 px-2 py-1" :value="section.title" @input="$emit('update-title', $event.target.value)" placeholder="章节标题" />
          </div>
          <div class="mt-3 grid gap-2.5 pl-4">
            <div
              v-for="(b, j) in (section.bullets || [])"
              :key="j"
              class="flex items-center gap-2 group/bullet"
            >
              <div class="w-1.5 h-1.5 rounded-full bg-text-tertiary"></div>
              <input
                class="input text-sm py-2 bg-transparent border-transparent hover:border-background-200 focus:bg-surface-50 focus:border-brand-400"
                :value="b"
                @input="$emit('update-bullet', j, $event.target.value)"
                :placeholder="'要点 ' + (j+1)"
              />
            </div>
            <div class="flex gap-4 mt-2 pl-4">
              <button class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1" @click="$emit('add-bullet')"><span class="text-lg leading-none">+</span> 添加要点</button>
              <button class="text-xs font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-2 py-1 rounded transition-colors flex items-center gap-1" @click="$emit('add-child')"><span class="text-lg leading-none">+</span> 添加子标题</button>
            </div>
          </div>
          <div v-if="(section.children||[]).length" class="mt-5 grid gap-4 ml-6 border-l-2 border-background-200 pl-5">
            <SectionEditor
              v-for="(c, k) in (section.children||[])"
              :key="k"
              :section="c"
              @update-title="(v) => { c.title = v }"
              @add-bullet="() => { (c.bullets ||= []).push('') }"
              @update-bullet="(i, v) => { (c.bullets ||= []); c.bullets[i] = v }"
              @add-child="() => { (c.children ||= []).push({ title: '', bullets: [], children: [] }) }"
            />
          </div>
        </div>
      `
    })
  }
})
</script>
