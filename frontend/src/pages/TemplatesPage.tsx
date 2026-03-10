import { useEffect, useState } from 'react'

type TypeItem = { id: string; name: string; template_count: number }
type OutlineSection = { title: string; bullets?: string[]; children?: OutlineSection[] }
type OutlineMeta = { is_system: boolean; is_favorite: boolean; created_at: number; title?: string }
type Outline = { type_id: string; type_name: string; template_id?: string; sections: OutlineSection[]; meta?: OutlineMeta }
type TemplateItem = { template_id: string; meta?: OutlineMeta; sections_summary?: string[] }

export default function TemplatesPage() {
  const [types, setTypes] = useState<TypeItem[]>([])
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  const [templates, setTemplates] = useState<TemplateItem[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [outline, setOutline] = useState<Outline | null>(null)
  
  // Type Management State
  const [newId, setNewId] = useState('')
  const [newName, setNewName] = useState('')

  useEffect(() => { loadTypes() }, [])

  useEffect(() => {
    if (selectedTypeId) {
      loadTemplates(selectedTypeId)
      setOutline(null)
      setSelectedTemplateId('')
    }
  }, [selectedTypeId])

  useEffect(() => {
    if (selectedTypeId && selectedTemplateId) {
      loadOutline(selectedTypeId, selectedTemplateId)
    }
  }, [selectedTypeId, selectedTemplateId])

  const loadTypes = async () => {
    const res = await fetch('/api/types')
    if (res.ok) {
      const data = await res.json()
      setTypes(data)
    }
  }

  const loadTemplates = async (typeId: string) => {
    const res = await fetch(`/api/outlines/${typeId}`)
    if (res.ok) {
      const data = await res.json()
      // Sort: System first, then Favorites, then others
      const list = (data.templates || []) as TemplateItem[]
      list.sort((a, b) => {
        if (a.meta?.is_system && !b.meta?.is_system) return -1
        if (!a.meta?.is_system && b.meta?.is_system) return 1
        if (a.meta?.is_favorite && !b.meta?.is_favorite) return -1
        if (!a.meta?.is_favorite && b.meta?.is_favorite) return 1
        return 0
      })
      setTemplates(list)
    }
  }

  const loadOutline = async (typeId: string, templateId: string) => {
    const res = await fetch(`/api/outline/${typeId}/${templateId}`)
    if (res.ok) {
      setOutline(await res.json())
    }
  }

  const addType = async () => {
    if (!newId.trim() || !newName.trim()) return
    const res = await fetch('/api/types', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: newId.trim(), name: newName.trim() })
    })
    if (res.ok) { setNewId(''); setNewName(''); loadTypes() } else { alert('新增失败') }
  }

  const deleteType = async (id: string) => {
    if (!confirm('确认删除该类型及其所有大纲？')) return
    const res = await fetch(`/api/types/${id}`, { method: 'DELETE' })
    if (res.ok) {
       loadTypes()
       if (selectedTypeId === id) {
         setSelectedTypeId('')
         setOutline(null)
       }
    } else { alert('删除失败') }
  }

  const saveOutline = async () => {
    if (!outline) return
    const res = await fetch(`/api/outline/${outline.type_id}/${outline.template_id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outline)
    })
    if (res.ok) {
      alert('保存成功')
      loadTemplates(outline.type_id)
    } else {
      alert('保存失败')
    }
  }
  
  const toggleFavorite = async (templateId: string) => {
      if (!selectedTypeId) return
      const res = await fetch(`/api/outline/${selectedTypeId}/${templateId}/favorite`, { method: 'POST' })
      if (res.ok) {
          loadTemplates(selectedTypeId)
          if (outline && outline.template_id === templateId) {
              const data = await res.json()
              setOutline({...outline, meta: {...outline.meta!, is_favorite: data.is_favorite}})
          }
      }
  }
  
  const deleteTemplate = async (typeId: string, templateId: string) => {
      if (!confirm('确定要删除该模板吗？')) return
      const res = await fetch(`/api/outline/${typeId}/${templateId}`, { method: 'DELETE' })
      if (res.ok) {
          loadTemplates(typeId)
          if (selectedTemplateId === templateId) {
              setSelectedTemplateId('')
              setOutline(null)
          }
      } else {
          const data = await res.json().catch(() => ({}))
          alert(`删除失败: ${data.detail || '未知错误'}`)
      }
  }

  // Editor Helpers
  const updateSectionTitle = (idx: number, v: string) => {
    if (!outline) return
    const sections = outline.sections.slice()
    sections[idx] = { ...sections[idx], title: v }
    setOutline({ ...outline, sections })
  }
  const updateBullet = (i: number, j: number, v: string) => {
    if (!outline) return
    const sections = outline.sections.slice()
    const bullets = (sections[i].bullets || []).slice()
    bullets[j] = v
    sections[i] = { ...sections[i], bullets }
    setOutline({ ...outline, sections })
  }
  const addChild = (i: number) => {
    if (!outline) return
    const sections = outline.sections.slice()
    const children = (sections[i].children || []).slice()
    children.push({ title: '', bullets: [], children: [] })
    sections[i] = { ...sections[i], children }
    setOutline({ ...outline, sections })
  }
  const addSection = () => {
    if (!outline) return
    setOutline({ ...outline, sections: [...outline.sections, { title: '', bullets: [] }] })
  }
  const addBullet = (i: number) => {
    if (!outline) return
    const sections = outline.sections.slice()
    const bullets = (sections[i].bullets || []).slice()
    bullets.push('')
    sections[i] = { ...sections[i], bullets }
    setOutline({ ...outline, sections })
  }

  return (
    <div className="grid grid-cols-[250px_300px_1fr] gap-6 h-[calc(100vh-100px)]">
      {/* Col 1: Types */}
      <div className="card p-4 flex flex-col gap-4 overflow-hidden">
        <div className="font-bold text-lg">类型管理</div>
        <div className="grid grid-cols-2 gap-2">
           <input className="input text-sm" placeholder="ID" value={newId} onChange={e => setNewId(e.target.value)} />
           <input className="input text-sm" placeholder="名称" value={newName} onChange={e => setNewName(e.target.value)} />
           <button className="btn btn-primary col-span-2 text-sm" onClick={addType}>新增类型</button>
        </div>
        <div className="flex-1 overflow-y-auto grid gap-2">
          {types.map(t => (
            <div key={t.id} 
              className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${selectedTypeId === t.id ? 'border-brand-500 bg-brand-50' : ''}`}
              onClick={() => setSelectedTypeId(t.id)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t.template_count}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                 <span className="text-xs text-gray-400">{t.id}</span>
                 <button className="text-xs text-red-500 hover:underline" onClick={(e) => { e.stopPropagation(); deleteType(t.id) }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Col 2: Templates List */}
      <div className="card p-4 flex flex-col gap-4 overflow-hidden">
         <div className="font-bold text-lg">模板列表</div>
         {!selectedTypeId ? (
             <div className="text-gray-400 text-sm">请先选择类型</div>
         ) : (
             <div className="flex-1 overflow-y-auto grid gap-2">
                 {templates.map(t => (
                     <div key={t.template_id}
                        className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${selectedTemplateId === t.template_id ? 'border-brand-500 bg-brand-50' : ''}`}
                        onClick={() => setSelectedTemplateId(t.template_id)}
                     >
                         <div className="flex justify-between items-start mb-1">
                            <span className="font-medium text-sm truncate" title={t.template_id}>
                                {t.meta?.title || (t.template_id === 'default' ? '系统默认模板' : t.template_id)}
                            </span>
                            <div className="flex gap-1">
                                {t.meta?.is_system ? (
                                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded">系统</span>
                                ) : (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(t.template_id) }} className={`text-lg leading-none ${t.meta?.is_favorite ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-500'}`}>
                                            ★
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); deleteTemplate(selectedTypeId, t.template_id) }} className="text-xs text-red-500 hover:text-red-600">
                                            删除
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                         <div className="text-xs text-gray-500 line-clamp-2">
                             {(t.sections_summary || []).join(' / ')}
                         </div>
                     </div>
                 ))}
                 <button className="btn w-full mt-2 text-sm" onClick={() => {
                     const name = prompt('请输入新模板名称 (ID)', 'new_template')
                     if(name) {
                         // Just set it in editor state, it will be created on save
                         setSelectedTemplateId('') // clear selection
                         setOutline({
                             type_id: selectedTypeId,
                             type_name: types.find(x => x.id === selectedTypeId)?.name || '',
                             template_id: name,
                             sections: [], // Empty
                             meta: { is_system: false, is_favorite: false, created_at: Date.now() }
                         })
                     }
                 }}>+ 新建空白模板</button>
             </div>
         )}
      </div>

      {/* Col 3: Editor */}
      <div className="card p-6 flex flex-col overflow-hidden">
        {!outline ? (
           <div className="flex items-center justify-center h-full text-gray-400">请选择模板或新建</div>
        ) : (
           <>
             <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b">
               <div className="flex items-center gap-2">
                  <div className="font-bold text-lg">{outline.meta?.title || (outline.template_id === 'default' ? '系统默认模板' : outline.template_id)}</div>
                  {outline.meta?.is_system && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">系统内置</span>}
               </div>
               <div className="flex items-center gap-2">
                 {!outline.meta?.is_system && (
                    <button className="btn text-sm" onClick={() => {
                        const title = prompt('修改模板显示名称', outline.meta?.title || '')
                        if (title !== null) {
                            setOutline({...outline, meta: {...outline.meta!, title}})
                        }
                    }}>重命名</button>
                 )}
                 <button className="btn text-sm" onClick={() => {
                    const name = prompt('另存为新模板 (ID)', outline.template_id + '_copy')
                    if(name) {
                        setOutline({...outline, template_id: name, meta: { ...outline.meta!, is_system: false, is_favorite: false }})
                        alert('已切换为新模板ID，请保存')
                    }
                 }}>另存为</button>
               </div>
             </div>
             
             {/* Editor Area */}
             <div className="flex-1 overflow-y-auto">
                <div className="grid gap-4">
                    {outline.sections.map((s, i) => (
                        <SectionEditor key={i} section={s} 
                        onTitle={v => updateSectionTitle(i, v)} 
                        onAddBullet={() => addBullet(i)} 
                        onAddChild={() => addChild(i)} 
                        onBullet={(j, v) => updateBullet(i, j, v)} 
                        />
                    ))}
                    <button className="btn btn-primary w-max" onClick={addSection}>添加一级标题</button>
                </div>
             </div>
             
             {/* Footer Actions */}
             <div className="pt-4 border-t mt-4 flex justify-end">
                 <button className="btn btn-primary" onClick={saveOutline}>保存当前模板</button>
             </div>
           </>
        )}
      </div>
    </div>
  )
}

function SectionEditor({ section, onTitle, onAddBullet, onBullet, onAddChild }: {
  section: OutlineSection;
  onTitle: (v: string) => void;
  onAddBullet: () => void;
  onBullet: (i: number, v: string) => void;
  onAddChild: () => void;
}) {
  return (
    <div className="border rounded-md p-4 bg-white">
      <input className="input font-bold" value={section.title} onChange={e => onTitle(e.target.value)} placeholder="标题" />
      <div className="mt-3 grid gap-2">
        {(section.bullets || []).map((b, j) => (
          <input key={j} className="input text-sm" value={b} onChange={e => onBullet(j, e.target.value)} placeholder={`要点 ${j+1}`} />
        ))}
        <div className="flex gap-2">
          <button className="text-xs text-brand-600 hover:underline" onClick={onAddBullet}>+ 添加要点</button>
          <button className="text-xs text-brand-600 hover:underline" onClick={onAddChild}>+ 添加子标题</button>
        </div>
      </div>
      {!!(section.children||[]).length && (
        <div className="mt-3 grid gap-3 ml-6 border-l pl-4">
          {(section.children||[]).map((c, k) => (
            <SectionEditor key={k} section={c}
              onTitle={v => { c.title = v }}
              onAddBullet={() => { (c.bullets ||= []).push('') }}
              onBullet={(i, v) => { (c.bullets ||= []); c.bullets[i] = v }}
              onAddChild={() => { (c.children ||= []).push({ title: '', bullets: [], children: [] }) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}