import { useEffect, useState } from 'react'

type OutlineSection = { title: string; bullets?: string[]; children?: OutlineSection[] }
type OutlineMeta = { is_system?: boolean; is_favorite?: boolean; title?: string; created_at?: number }
type Outline = { type_id: string; type_name: string; template_id: string; sections: OutlineSection[]; meta?: OutlineMeta }
type TypeItem = { id: string; name: string }

export default function GeneratePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [files, setFiles] = useState<FileList | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  
  // Step 1 Result
  const [predictedType, setPredictedType] = useState<TypeItem | null>(null)
  const [allTypes, setAllTypes] = useState<TypeItem[]>([])
  const [parsedText, setParsedText] = useState('')

  // Step 2 State
  const [availableTemplates, setAvailableTemplates] = useState<Outline[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Outline | null>(null)

  // Step 3 State
  const [materials, setMaterials] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Modification State
  const [articleId, setArticleId] = useState('')
  const [modificationRequest, setModificationRequest] = useState('')
  const [modifying, setModifying] = useState(false)
  
  // Article Versions State
  const [articleVersions, setArticleVersions] = useState<{id: string, content: string}[]>([])
  
  // People Knowledge Base
  const [allPeople, setAllPeople] = useState<{[key: string]: string}>({})
  type MatchedPerson = {
    dbName: string
    materialName: string
    dbInfo: string
    matchType: 'exact' | 'fuzzy'
    similarity: number
    similarNames?: Array<{name: string, similarity: number}>
    conflict?: {
      hasConflict: boolean
      materialInfo?: string
      reason?: string
    }
    userOverride?: {
      name?: string
      info?: string
    }
    selected: boolean
  }
  const [matchedPeople, setMatchedPeople] = useState<MatchedPerson[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  useEffect(() => {
    fetch('/api/types').then(r => r.json()).then(setAllTypes)
    fetch('/api/people').then(r => r.json()).then(setAllPeople)
  }, [])

  // Match people in materials when step is 3 (with fuzzy matching and conflict detection)
  useEffect(() => {
    if (step === 3 && materials && Object.keys(allPeople).length > 0) {
      const matchPeople = async () => {
        try {
          // Step 1: Fuzzy matching
          const matchRes = await fetch('/api/match-people', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              materials: materials,
              people_db: allPeople
            })
          })
          
          if (!matchRes.ok) throw new Error('匹配失败')
          const matches = await matchRes.json()
          
          // Step 2: Conflict detection for each matched person
          setCheckingConflicts(true)
              const matchedWithConflicts: MatchedPerson[] = await Promise.all(
            matches.map(async (match: any) => {
              // Extract context around the name (100 chars before and after)
              const nameIndex = materials.indexOf(match.material_name)
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
              const contextEnd = Math.min(materials.length, nameIndex + match.material_name.length + 100)
              const context = materials.substring(contextStart, contextEnd)
              
              // Check for conflicts
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
          
          setMatchedPeople(matchedWithConflicts)
          setCheckingConflicts(false)
        } catch (e) {
          console.error('Error matching people:', e)
          setCheckingConflicts(false)
        }
      }
      
      matchPeople()
    }
  }, [step, materials, allPeople])

  const handleAnalyze = async () => {
    if (!files || files.length === 0) return alert('请选择文件')
    setAnalyzing(true)
    try {
      // 1. Parse
      const fd = new FormData()
      for (let i = 0; i < files.length; i++) fd.append('files', files[i])
      const resParse = await fetch('/api/files/parse', { method: 'POST', body: fd })
      if (!resParse.ok) throw new Error('解析失败')
      const dataParse = await resParse.json()
      const texts = dataParse.texts as string[]
      setParsedText(texts.join('\n\n'))

      // 2. Classify
      const resClassify = await fetch('/api/classify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts })
      })
      if (!resClassify.ok) throw new Error('分类失败')
      const typeItem = await resClassify.json()
      setPredictedType(typeItem)
      
    } catch (e) { alert((e as Error).message) }
    finally { setAnalyzing(false) }
  }

  const loadTemplates = async () => {
    if (!predictedType) return
    const res = await fetch(`/api/outlines/${predictedType.id}`)
    if (res.ok) {
      const data = await res.json()
      const list = (data.templates as any[]).map(t => ({
          ...t,
          type_id: predictedType.id,
          type_name: predictedType.name
      })) as Outline[]
      // Sort: System > Favorite > Default
      list.sort((a, b) => {
        if (a.meta?.is_system && !b.meta?.is_system) return -1
        if (!a.meta?.is_system && b.meta?.is_system) return 1
        if (a.meta?.is_favorite && !b.meta?.is_favorite) return -1
        if (!a.meta?.is_favorite && b.meta?.is_favorite) return 1
        return 0
      })
      setAvailableTemplates(list)
      if (list.length > 0) setSelectedTemplate(list[0])
      setStep(2)
    } else {
      alert('加载模板失败')
    }
  }

  const confirmTemplate = () => {
    if (!selectedTemplate) return
    setMaterials(parsedText)
    setStep(3)
  }

  const run = async () => {
    if (!selectedTemplate || !materials.trim()) return alert('请填写素材')
    setLoading(true)
    setOutput('')
    try {
      // Prepare knowledge base from selected people (with user overrides)
      const knowledge_base: {[key: string]: string} = {}
      // Build name replacement map: materialName -> dbName (or userOverride name)
      let processedMaterials = materials
      
      // Sort matched people by similarity (descending) to avoid replacement conflicts
      // Higher similarity matches should be processed first
      const sortedMatchedPeople = [...matchedPeople]
        .filter(p => p.selected)
        .sort((a, b) => b.similarity - a.similarity)
      
      sortedMatchedPeople.forEach(person => {
        const name = person.userOverride?.name || person.dbName
        
        // Determine which info to use
        let info: string
        if (person.userOverride?.info !== undefined) {
          // userOverride exists - user has explicitly chosen to use material info or override
          // If it's an empty string, it means user selected "使用素材信息" but materialInfo was not available
          // In this case, we should still use it (empty string) to indicate no knowledge base entry
          // But if it's not empty, use the material info
          info = person.userOverride.info
        } else {
          // No userOverride, use dbInfo (default behavior)
          info = person.dbInfo
        }
        
        // Only add to knowledge_base if info is not empty
        // If user selected "使用素材信息" but materialInfo is empty, 
        // we don't add to knowledge_base (which means no info will be provided to LLM)
        if (info && info.trim()) {
          knowledge_base[name] = info
        }
        
        // Replace materialName with correct dbName in materials
        // Only replace if materialName is different from dbName
        if (person.materialName !== name) {
          // Escape special regex characters in materialName
          const escapedMaterialName = person.materialName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          // Use global replace to replace all occurrences
          processedMaterials = processedMaterials.replace(
            new RegExp(escapedMaterialName, 'g'),
            name
          )
        }
      })
      
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            type_id: selectedTemplate.type_id, 
            outline: selectedTemplate, 
            materials: processedMaterials,
            title: customTitle,
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
        
        // Handle the ID prefix in the first chunk
        if (firstChunk) {
            if (text.startsWith('ID:')) {
                const parts = text.split('\n')
                // The first part is ID:..., the rest is content
                if (parts.length > 0) {
                     currentArticleId = parts[0].substring(3)
                     setArticleId(currentArticleId)
                     text = parts.slice(1).join('\n')
                }
            }
            firstChunk = false
        }
        
        currentContent += text
        setOutput(currentContent)
      }
      
      // Initialize the article versions array with the first version
      setArticleVersions([{ id: currentArticleId, content: currentContent }])
    } catch (e) { alert((e as Error).message) } finally { setLoading(false) }
  }
  
  // Function to fetch article history
  const fetchArticleHistory = async (currentArticleId: string) => {
    try {
      const res = await fetch(`/api/articles/${currentArticleId}/history`)
      if (!res.ok) throw new Error('获取文章历史失败')
      const history = await res.json()
      
      // Extract just the id and content for display
      const versions = history.map((article: any) => ({
        id: article.id,
        content: article.content
      }))
      
      setArticleVersions(versions)
    } catch (e) {
      console.error('Failed to fetch article history:', e)
    }
  }

  const handleModify = async () => {
    if (!articleId || !modificationRequest.trim()) return alert('请填写修改需求')
    setModifying(true)
    try {
      // Prepare knowledge base (reuse same selected people with overrides)
      const knowledge_base: {[key: string]: string} = {}
      matchedPeople.forEach(person => {
        if (person.selected) {
          const name = person.userOverride?.name || person.dbName
          const info = person.userOverride?.info || person.dbInfo
          knowledge_base[name] = info
        }
      })
      
      const res = await fetch('/api/modify-article', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            article_id: articleId,
            user_query: modificationRequest,
            knowledge_base: Object.keys(knowledge_base).length > 0 ? knowledge_base : undefined
        })
      })
      if (!res.ok) throw new Error('修改失败')
      
      const reader = res.body?.getReader()
      if (!reader) throw new Error('无法读取流')
      
      const decoder = new TextDecoder()
      let newArticleId = articleId // Default to original ID
      let firstChunk = true
      let currentContent = ''
      
      // Create a new version entry immediately
      const tempVersionId = `temp-${Date.now()}`
      const newVersionIndex = articleVersions.length
      
      // Add a temporary version entry to be updated as we stream
      setArticleVersions(prev => [
        ...prev,
        { id: tempVersionId, content: '' }
      ])
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        let text = decoder.decode(value, { stream: true })
        
        // Handle the ID prefix in the first chunk
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
        
        // Update the content
        currentContent += text
        
        // Stream update to the new version in the array
        setArticleVersions(prev => {
          const updated = [...prev]
          // Update the content for the newly added version
          updated[updated.length - 1] = { id: newArticleId, content: currentContent }
          return updated
        })
      }
      
      // Update the main article ID after streaming completes
      setArticleId(newArticleId)
      
      // Clear modification request after successful update
      setModificationRequest('')
    } catch (e) {
      // If there's an error, remove the temporary version
      setArticleVersions(prev => prev.slice(0, -1))
      alert((e as Error).message)
    } finally { setModifying(false) }
  }

  // Helper to render section preview
  const renderPreview = (sections: OutlineSection[]) => (
    <div className="space-y-2 text-sm text-gray-600">
      {sections.map((s, i) => (
        <div key={i} className="pl-2 border-l-2 border-gray-200">
          <div className="font-medium text-gray-800">{s.title}</div>
          {s.bullets && (
            <ul className="list-disc list-inside pl-1 text-xs text-gray-500">
              {s.bullets.slice(0, 3).map((b, idx) => <li key={idx} className="truncate">{b}</li>)}
            </ul>
          )}
          {s.children && renderPreview(s.children)}
        </div>
      ))}
    </div>
  )

  if (step === 1) {
    return (
      <div className="grid gap-6 max-w-2xl mx-auto">
        <div className="card p-6">
           <div className="text-lg font-semibold mb-4">第一步：上传素材并智能分类</div>
           <input type="file" multiple className="input mb-4" onChange={e => setFiles(e.target.files)} />
           <button className="btn btn-primary w-full" onClick={handleAnalyze} disabled={analyzing}>
             {analyzing ? '分析中...' : '开始分析'}
           </button>
        </div>
        
        {predictedType && (
            <div className="card p-6 bg-brand-50 border-brand-200 border">
                <div className="font-semibold mb-2 text-brand-800">分析结果</div>
                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-1">系统推荐类型</label>
                    <select className="input" value={predictedType.id} onChange={e => {
                        const t = allTypes.find(x => x.id === e.target.value)
                        if(t) setPredictedType(t)
                    }}>
                        {allTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button className="btn btn-primary w-full" onClick={loadTemplates}>确认类型并选择模板</button>
            </div>
        )}
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col gap-4">
         <div className="flex items-center gap-4">
            <button className="text-gray-500 hover:underline" onClick={() => setStep(1)}>← 返回上传</button>
            <div className="font-bold text-xl">第二步：选择生成模板 ({predictedType?.name})</div>
         </div>
         <div className="flex-1 grid grid-cols-[300px_1fr] gap-6 overflow-hidden">
            {/* Template List */}
            <div className="bg-white rounded shadow overflow-y-auto p-4 space-y-2">
                {availableTemplates.map(t => (
                    <div 
                        key={t.template_id} 
                        onClick={() => setSelectedTemplate(t)}
                        className={`p-3 rounded border cursor-pointer hover:border-brand-300 transition-all ${
                            selectedTemplate?.template_id === t.template_id ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-gray-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate">{t.meta?.title || (t.meta?.is_system ? '系统默认模板' : t.template_id)}</span>
                            {t.meta?.is_favorite && <span className="text-yellow-500">★</span>}
                        </div>
                        <div className="flex gap-2 text-xs">
                            {t.meta?.is_system && <span className="bg-blue-100 text-blue-700 px-1.5 rounded">系统</span>}
                            {!t.meta?.is_system && <span className="bg-gray-100 text-gray-600 px-1.5 rounded">自定义</span>}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Preview */}
            <div className="bg-white rounded shadow p-6 flex flex-col">
                {selectedTemplate ? (
                    <>
                        <div className="mb-4 pb-4 border-b">
                            <h3 className="font-bold text-lg mb-2">
                                {selectedTemplate.meta?.title || (selectedTemplate.meta?.is_system ? '系统默认模板' : selectedTemplate.template_id)}
                            </h3>
                            <div className="text-sm text-gray-500">
                                包含 {selectedTemplate.sections.length} 个主要章节
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded border">
                            {renderPreview(selectedTemplate.sections)}
                        </div>
                        <button className="btn btn-primary w-full py-3" onClick={confirmTemplate}>
                            使用此模板生成
                        </button>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">请选择左侧模板预览</div>
                )}
            </div>
         </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <button className="text-gray-500 hover:underline" onClick={() => setStep(2)}>← 返回选择模板</button>
        <div className="font-bold text-xl">第三步：生成新闻稿</div>
      </div>

      <div className="card p-6">
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
            <span className="font-semibold">当前模板:</span>
            <span>{selectedTemplate?.meta?.title || (selectedTemplate?.meta?.is_system ? '系统默认模板' : selectedTemplate?.template_id)}</span>
        </div>
        
        <div className="mb-4">
            <div className="text-sm font-semibold mb-2">文稿标题 (可选)</div>
            <input 
                className="input w-full" 
                value={customTitle} 
                onChange={e => setCustomTitle(e.target.value)} 
                placeholder="如不填写，将自动生成" 
            />
        </div>

        <div className="text-sm font-semibold mb-2">素材内容 (已提取)</div>
        <textarea className="input h-60" value={materials} onChange={e => setMaterials(e.target.value)} placeholder="粘贴要点、背景、引语、数据等" />
        
        {/* People Selection UI with enhanced matching and conflict detection */}
        {checkingConflicts && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-700">正在检测人物信息和冲突...</div>
          </div>
        )}
        {matchedPeople.length > 0 && !checkingConflicts && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">人物信息选择</div>
            <div className="text-xs text-gray-500 mb-3">系统在素材中匹配到以下人物，您可以选择是否在新闻稿中包含他们的详细信息：</div>
            <div className="grid grid-cols-1 gap-3">
              {matchedPeople.map((person, index) => {
                // Determine status and styling
                let statusColor = 'border-gray-200 bg-white'
                let statusIcon = '✓'
                let statusText = ''
                
                if (person.conflict?.hasConflict) {
                  statusColor = 'border-red-300 bg-red-50'
                  statusIcon = '!'
                  statusText = '冲突'
                } else if (person.matchType === 'fuzzy') {
                  statusColor = 'border-yellow-300 bg-yellow-50'
                  statusIcon = '?'
                  statusText = '疑似'
                } else {
                  statusColor = 'border-green-300 bg-green-50'
                  statusIcon = '✓'
                  statusText = '确信'
                }
                
                return (
                  <div key={index} className={`p-4 rounded border-2 ${statusColor}`}>
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        checked={person.selected} 
                        onChange={e => {
                          setMatchedPeople(prev => prev.map((p, i) => 
                            i === index ? {...p, selected: e.target.checked} : p
                          ))
                        }}
                        className="w-5 h-5 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            person.conflict?.hasConflict ? 'bg-red-500 text-white' :
                            person.similarNames && person.similarNames.length > 0 ? 'bg-orange-500 text-white' :
                            person.matchType === 'fuzzy' ? 'bg-yellow-500 text-white' :
                            'bg-green-500 text-white'
                          }`}>
                            {statusIcon}
                          </span>
                          <div className="text-sm font-semibold">
                            {person.materialName !== person.dbName ? (
                              <span>
                                素材中: <span className="text-gray-600">{person.materialName}</span> → 
                                数据库: <span className="text-blue-600">{person.dbName}</span>
                              </span>
                            ) : (
                              person.dbName
                            )}
                          </div>
                          {/* Always show similarity percentage */}
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            person.matchType === 'exact' && person.similarity >= 0.99
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            相似度: {Math.round(person.similarity * 100)}%
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-600 mb-2">
                          <div className="font-medium">数据库信息:</div>
                          <div className="pl-2">{person.dbInfo}</div>
                        </div>
                        
                        {person.conflict?.hasConflict && (
                          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded">
                            <div className="text-xs font-semibold text-red-800 mb-1">⚠️ 检测到信息冲突</div>
                            {person.conflict.materialInfo && (
                              <div className="text-xs text-red-700 mb-1">
                                素材中: {person.conflict.materialInfo}
                              </div>
                            )}
                            <div className="text-xs text-red-600 mb-2">
                              {person.conflict.reason}
                            </div>
                            <div className="space-y-1">
                              <label className="flex items-center gap-2 text-xs">
                                <input 
                                  type="radio" 
                                  name={`conflict-${index}`}
                                  defaultChecked
                                  onChange={() => {
                                    setMatchedPeople(prev => prev.map((p, i) => 
                                      i === index ? {...p, userOverride: undefined} : p
                                    ))
                                  }}
                                />
                                <span>使用数据库信息</span>
                              </label>
                              <label className="flex items-center gap-2 text-xs">
                                <input 
                                  type="radio" 
                                  name={`conflict-${index}`}
                                  onChange={() => {
                                    setMatchedPeople(prev => prev.map((p, i) => 
                                      i === index ? {
                                        ...p, 
                                        userOverride: {
                                          name: p.materialName,  // Use material name when using material info
                                          // Use materialInfo from conflict if available
                                          // If conflict exists, materialInfo should be available
                                          // If not available, it means no conflict was detected, 
                                          // but user still wants to use material info, so we use empty string
                                          // which will be handled in the generation logic
                                          info: p.conflict?.materialInfo ?? ''
                                        }
                                      } : p
                                    ))
                                  }}
                                />
                                <span>使用素材信息</span>
                              </label>
                            </div>
                          </div>
                        )}
                        
                        {/* Show similar names warning if exists */}
                        {person.similarNames && person.similarNames.length > 0 && (
                          <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded">
                            <div className="text-xs font-semibold text-orange-800 mb-2">
                              ⚠️ 检测到数据库中存在相似的名字，可能是拼写错误：
                            </div>
                            <div className="space-y-1 mb-2">
                              {person.similarNames.map((similar, simIndex) => (
                                <div key={simIndex} className="flex items-center justify-between text-xs">
                                  <span className="text-orange-700">
                                    • {similar.name} (相似度: {Math.round(similar.similarity * 100)}%)
                                  </span>
                                  <button
                                    className="text-xs px-2 py-0.5 bg-orange-500 text-white rounded hover:bg-orange-600"
                                    onClick={() => {
                                      // Replace current match with similar name
                                      // Clear userOverride to ensure the new dbName is used
                                      setMatchedPeople(prev => prev.map((p, i) => {
                                        if (i === index) {
                                          return {
                                            ...p,
                                            dbName: similar.name,
                                            dbInfo: allPeople[similar.name] || p.dbInfo,
                                            matchType: 'fuzzy',
                                            similarity: similar.similarity,
                                            userOverride: undefined  // Clear userOverride when switching to a different database name
                                          }
                                        }
                                        return p
                                      }))
                                    }}
                                  >
                                    使用此名字
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="text-xs text-orange-600">
                              如果素材中的 "{person.materialName}" 写错了，请点击上方按钮切换到正确名字
                            </div>
                          </div>
                        )}
                        
                        {person.matchType === 'fuzzy' && !person.conflict?.hasConflict && !person.similarNames && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded">
                            <div className="text-xs text-yellow-800 mb-2">
                              检测到疑似人名 "{person.materialName}"，是否指代数据库中的 "{person.dbName}"？
                            </div>
                            <div className="flex gap-2">
                              <button 
                                className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                onClick={() => {
                                  setMatchedPeople(prev => prev.map((p, i) => 
                                    i === index ? {...p, matchType: 'exact'} : p
                                  ))
                                }}
                              >
                                确认
                              </button>
                              <button 
                                className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                onClick={() => {
                                  setMatchedPeople(prev => prev.filter((_, i) => i !== index))
                                }}
                              >
                                忽略
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        <div className="mt-4">
          <button className="btn btn-primary w-full py-3 text-lg" onClick={run} disabled={loading}>{loading ? '生成中…' : '生成新闻稿'}</button>
        </div>
      </div>
      
      {/* 显示所有文章版本 */}
      {articleVersions.length > 0 && (
        <div className="space-y-6">
          {articleVersions.map((version, index) => (
            <div 
              key={version.id} 
              className="card p-6 whitespace-pre-wrap bg-white shadow-lg border-t-4"
              style={{ borderTopColor: index === 0 ? '#10b981' : '#3b82f6' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold">
                  {index === 0 ? '原始生成版本' : `修改版本 ${index}`}
                </div>
                <div className="text-xs text-gray-500">版本 ID: {version.id.substring(0, 8)}...</div>
              </div>
              <div className="mt-2">
                {version.content}
              </div>
            </div>
          ))}
          
          <div className="card p-6">
            <div className="text-lg font-semibold mb-4">修改新闻稿</div>
            <textarea 
              className="input h-32 mb-4" 
              value={modificationRequest} 
              onChange={e => setModificationRequest(e.target.value)} 
              placeholder="请输入您的修改需求，例如：'增加更多细节'、'调整语气'、'修改某个部分'等"
              disabled={modifying}
            />
            <button 
              className="btn btn-primary w-full" 
              onClick={handleModify} 
              disabled={modifying || !modificationRequest.trim() || !articleId}
            >
              {modifying ? '修改中...' : '提交修改请求'}
            </button>
          </div>
        </div>
      )}
      
      {/* 兼容旧的单一输出显示 */}
      {output && articleVersions.length === 0 && (
        <div className="card p-6 whitespace-pre-wrap bg-white shadow-lg border-t-4 border-brand-500">
          {output}
        </div>
      )}
    </div>
  )
}
